/**
 * ABANDONED CART / RECOVERY STATE (browser-safe part)
 *
 * A stable anonymous cart id, activity timestamps and the abandonment signals
 * that lifecycle flows subscribe to. Recovery links never carry prices, order
 * data or customer details — only a server-signed, expiring token.
 */

export const CART_STATE_KEY = "oasis.cart.recovery.v1";

export type CartRecoveryState = {
  cartId: string;
  createdAt: string;
  lastActivityAt: string;
  checkoutStartedAt: string | null;
  /** Set when the customer signs in / is known; otherwise anonymous. */
  customerId: string | null;
  /** Marks the abandonment event as already emitted for this cart cycle. */
  abandonedEmittedAt: string | null;
};

function newCartId(): string {
  const globalCrypto = typeof crypto !== "undefined" ? crypto : undefined;
  const raw =
    globalCrypto && typeof globalCrypto.randomUUID === "function"
      ? globalCrypto.randomUUID().replace(/-/g, "")
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `cart_${raw}`;
}

export function emptyCartState(now = new Date()): CartRecoveryState {
  const iso = now.toISOString();
  return {
    cartId: newCartId(),
    createdAt: iso,
    lastActivityAt: iso,
    checkoutStartedAt: null,
    customerId: null,
    abandonedEmittedAt: null,
  };
}

export function readCartState(): CartRecoveryState {
  if (typeof window === "undefined") return emptyCartState();
  try {
    const raw = window.localStorage.getItem(CART_STATE_KEY);
    if (!raw) {
      const created = emptyCartState();
      window.localStorage.setItem(CART_STATE_KEY, JSON.stringify(created));
      return created;
    }
    const parsed = JSON.parse(raw) as Partial<CartRecoveryState>;
    if (!parsed.cartId) return emptyCartState();
    return { ...emptyCartState(), ...parsed } as CartRecoveryState;
  } catch {
    return emptyCartState();
  }
}

export function writeCartState(state: CartRecoveryState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function touchCart(patch: Partial<CartRecoveryState> = {}): CartRecoveryState {
  const next: CartRecoveryState = {
    ...readCartState(),
    ...patch,
    lastActivityAt: new Date().toISOString(),
  };
  writeCartState(next);
  return next;
}

/** Minutes of inactivity after which a non-empty cart counts as abandoned. */
export const ABANDON_AFTER_MINUTES = 45;

export function isAbandoned(
  state: CartRecoveryState,
  hasLines: boolean,
  now = new Date(),
): boolean {
  if (!hasLines || state.abandonedEmittedAt) return false;
  const idleMs = now.getTime() - new Date(state.lastActivityAt).getTime();
  return idleMs >= ABANDON_AFTER_MINUTES * 60_000;
}
