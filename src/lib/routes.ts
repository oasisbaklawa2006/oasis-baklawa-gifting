/** Paths used by navigation data, narrowed to real router routes. */
const known = [
  "/",
  "/shop",
  "/luxury-gifts",
  "/baklawa",
  "/gourmet-food",
  "/wedding-gifting",
  "/world-of-oasis",
  "/rewards",
  "/collections",
  "/journal",
  "/shipping",
  "/track-order",
  "/gifting",
  "/about",
  "/business",
  "/stores",
  "/search",
  "/contact",
  "/faq",
  "/cart",
  "/checkout",
  "/payment-options",
  "/build-your-box",
  "/wishlist",
  "/build-a-gift",
  "/corporate",
  "/gift-finder",
  "/account",
  "/support",
  "/returns",
  "/privacy",
  "/terms",
] as const;

type KnownPath = (typeof known)[number];

export function toRoute(path: string): KnownPath {
  const base = path.split("?")[0] ?? "/";
  return (known as readonly string[]).includes(base) ? (base as KnownPath) : "/";
}

/**
 * Splits a navigation href such as `/shop?category=chocolates` into a typed
 * route and its search params, so navigation data can stay declarative.
 */
export function toLink(path: string): { to: KnownPath; search: Record<string, string> } {
  const [base, query] = path.split("?");
  const search: Record<string, string> = {};
  if (query) {
    for (const [key, value] of new URLSearchParams(query).entries()) search[key] = value;
  }
  return { to: toRoute(base ?? "/"), search };
}
