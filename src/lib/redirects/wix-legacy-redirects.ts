// Generated from docs/website/wix-legacy-redirect-map.json. Regenerate, do not hand-edit.
// Exact Wix legacy path -> live Gifting route. Keyword and catch-all rules are below.

export const EXACT_WIX_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/questions": "/faq",
  "/copy-of-new-landing": "/",
  "/you-are-invited-you-for-aahar-by-oasis-baklawa": "/business",
  "/new-corporate": "/corporate",
  "/blank-7": "/",
  "/copy-of-aboutus": "/about",
  "/loyalty": "/rewards",
  "/offers-scheme": "/shop",
  "/copy-of-corporate-gifting": "/corporate",
  "/blank": "/",
  "/weddings": "/wedding-gifting",
  "/recipes": "/journal",
  "/home": "/",
  "/blank-6": "/",
  "/items": "/shop",
  "/online-ordering": "/shop",
  "/blank-3": "/support",
  "/all-products": "/shop",
  "/about-3": "/about",
  "/refer-friends": "/rewards",
  "/services-5": "/business",
  "/weddinggifting": "/wedding-gifting",
  "/locateus": "/stores",
  "/blank-5": "/stores",
  "/projects-7-1": "/shop",
  "/blank-1": "/faq",
  "/services": "/corporate",
  "/recipes-1": "/journal",
  "/turkish-baklava": "/baklawa",
  "/portfolio": "/luxury-gifts",
  "/copy-of-contact-us": "/contact",
  "/corporates": "/corporate",
  "/you-are-invited-to-join-aahar-by-oasis-baklawa": "/business",
  "/everyday": "/shop",
  "/refer-terms-conditions": "/terms",
  "/blank-4": "/about",
  "/aahar": "/business",
  "/product-page/assorted-baklawa-with-rosello-collection-box": "/product/rosello-25",
};

export const WIX_PRODUCT_PAGE_PREFIX = "/product-page/";
export const WIX_PRODUCT_CATCH_ALL = "/shop";
export const WIX_PRODUCT_KEYWORD_RULES: ReadonlyArray<{ pattern: RegExp; to: string }> = [
  { pattern: /baklaw|baklav/i, to: "/baklawa" },
  { pattern: /hamper|gift/i, to: "/luxury-gifts" },
];
export const WIX_QUICK_SHOP_PATTERN = /^\/quick-shop\/[^/]+$/;

/** Returns the 301 target for a Wix legacy pathname, or null when the request should not be redirected. */
export function resolveWixLegacyRedirect(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (Object.prototype.hasOwnProperty.call(EXACT_WIX_LEGACY_REDIRECTS, path)) {
    return EXACT_WIX_LEGACY_REDIRECTS[path] ?? null;
  }
  if (WIX_QUICK_SHOP_PATTERN.test(path)) return "/shop";
  if (path.startsWith(WIX_PRODUCT_PAGE_PREFIX) && path.length > WIX_PRODUCT_PAGE_PREFIX.length) {
    const slug = path.slice(WIX_PRODUCT_PAGE_PREFIX.length);
    const keyword = WIX_PRODUCT_KEYWORD_RULES.find((rule) => rule.pattern.test(slug));
    return keyword ? keyword.to : WIX_PRODUCT_CATCH_ALL;
  }
  return null;
}
