
/** Paths used by mock navigation data, narrowed to real router routes. */
const known = [
  "/",
  "/shop",
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
] as const;

type KnownPath = (typeof known)[number];

export function toRoute(path: string): KnownPath {
  return (known as readonly string[]).includes(path) ? (path as KnownPath) : "/";
}

