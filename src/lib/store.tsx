import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { products } from "@/data/catalog";
import type { Money, Product, ProductVariant } from "@/data/types";

/**
 * Client-side shop state (cart + wishlist), persisted to localStorage.
 * This is a UI placeholder: no backend, no payments, no inventory checks.
 */

export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type GiftState = {
  message: string;
  ribbonId: string;
  sealId: string;
  concealInvoice: boolean;
};

const emptyGift: GiftState = {
  message: "",
  ribbonId: "rib-none",
  sealId: "seal-none",
  concealInvoice: false,
};

type ShopState = {
  lines: CartLine[];
  wishlist: string[];
  gift: GiftState;
};

type ShopContextValue = ShopState & {
  ready: boolean;
  addToCart: (productId: string, variantId: string, quantity?: number) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeLine: (productId: string, variantId: string) => void;
  clearCart: () => void;
  replaceLines: (lines: CartLine[]) => void;
  toggleWishlist: (productId: string) => void;
  setGift: (patch: Partial<GiftState>) => void;
  isWishlisted: (productId: string) => boolean;
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
};

const STORAGE_KEY = "oasis.shop.v1";

const ShopContext = createContext<ShopContextValue | null>(null);

function readStorage(): ShopState {
  if (typeof window === "undefined") return { lines: [], wishlist: [], gift: emptyGift };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], wishlist: [], gift: emptyGift };
    const parsed = JSON.parse(raw) as Partial<ShopState>;
    return {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      gift: { ...emptyGift, ...(parsed.gift ?? {}) },
    };
  } catch {
    return { lines: [], wishlist: [], gift: emptyGift };
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShopState>({ lines: [], wishlist: [], gift: emptyGift });
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Hydration-safe: read persisted state only after mount.
  useEffect(() => {
    setState(readStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — state stays in memory */
    }
  }, [state, ready]);

  const addToCart = useCallback((productId: string, variantId: string, quantity = 1) => {
    setState((prev) => {
      const existing = prev.lines.find(
        (l) => l.productId === productId && l.variantId === variantId,
      );
      const lines = existing
        ? prev.lines.map((l) =>
            l === existing ? { ...l, quantity: Math.min(99, l.quantity + quantity) } : l,
          )
        : [...prev.lines, { productId, variantId, quantity }];
      return { ...prev, lines };
    });
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      lines:
        quantity <= 0
          ? prev.lines.filter((l) => !(l.productId === productId && l.variantId === variantId))
          : prev.lines.map((l) =>
              l.productId === productId && l.variantId === variantId
                ? { ...l, quantity: Math.min(99, quantity) }
                : l,
            ),
    }));
  }, []);

  const removeLine = useCallback((productId: string, variantId: string) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => !(l.productId === productId && l.variantId === variantId)),
    }));
  }, []);

  const clearCart = useCallback(() => setState((prev) => ({ ...prev, lines: [] })), []);

  /** Used by cart recovery: the restored selection replaces the current basket. */
  const replaceLines = useCallback((lines: CartLine[]) => {
    setState((prev) => ({ ...prev, lines }));
  }, []);


  const toggleWishlist = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      wishlist: prev.wishlist.includes(productId)
        ? prev.wishlist.filter((id) => id !== productId)
        : [...prev.wishlist, productId],
    }));
  }, []);

  const setGift = useCallback((patch: Partial<GiftState>) => {
    setState((prev) => ({ ...prev, gift: { ...prev.gift, ...patch } }));
  }, []);

  const value = useMemo<ShopContextValue>(
    () => ({
      ...state,
      ready,
      addToCart,
      setQuantity,
      removeLine,
      clearCart,
      replaceLines,
      toggleWishlist,
      setGift,
      isWishlisted: (id: string) => state.wishlist.includes(id),
      cartCount: state.lines.reduce((sum, l) => sum + l.quantity, 0),
      cartOpen,
      setCartOpen,
    }),
    [
      state,
      ready,
      addToCart,
      setQuantity,
      removeLine,
      clearCart,
      replaceLines,
      toggleWishlist,
      setGift,
      cartOpen,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}

export type ResolvedLine = {
  line: CartLine;
  product: Product;
  variant: ProductVariant;
  lineTotal: Money;
};

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) return [];
    return [
      {
        line,
        product,
        variant,
        lineTotal: {
          amount: variant.price.amount * line.quantity,
          currency: variant.price.currency,
        },
      },
    ];
  });
}

export function cartSubtotal(resolved: ResolvedLine[]): Money {
  return {
    amount: resolved.reduce((sum, r) => sum + r.lineTotal.amount, 0),
    currency: resolved[0]?.lineTotal.currency ?? "INR",
  };
}
