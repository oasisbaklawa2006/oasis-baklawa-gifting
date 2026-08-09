import type { LinkProps } from "@tanstack/react-router";

/** Paths used by mock navigation data, narrowed to real router routes. */
const known = [
  "/",
  "/shop",
  "/collections",
  "/gifting",
  "/about",
  "/business",
  "/stores",
  "/search",
  "/contact",
  "/faq",
  "/cart",
  "/wishlist",
] as const;

type KnownPath = (typeof known)[number];

export function toRoute(path: string): KnownPath {
  return (known as readonly string[]).includes(path) ? (path as KnownPath) : "/";
}

