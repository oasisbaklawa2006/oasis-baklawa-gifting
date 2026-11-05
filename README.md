# Oasis Baklawa Gifting 

Create a new premium, production-quality master website foundation for Oasis Baklawa. This is NOT a throwaway mockup and NOT three separate websites. Build one reusable web platform whose design system and components can later serve three domains/audiences: oasisbaklawa.in = B2C ecommerce/consumer shopping; oasisbaklawa.com = corporate/brand profile; oasisbaklawa.biz = B2B acquisition and eventual entry to the B2B Buyer App. Do not connect production databases, payments, inventory, authentication, or live domains yet. Use structured local mock data only. The goal of this first build is to create a durable front-end foundation we can iterate on.

BRAND / VISUAL DIRECTION — LOCK THIS, DO NOT INVENT A GENERIC LUXURY THEME:
- Overall direction: Dubai Mall / Souk / Quiet Luxury; premium Middle Eastern confectionery house; editorial, restrained, contemporary, tactile, credible.
- Avoid: pink-heavy palettes, gradients, glassmorphism, ornate Arabic motifs, excessive gold, black-and-gold cliches, oversized rounded cards, heavy shadows, generic SaaS styling, playful candy styling, neon, stock-template feel.
- Canvas/background: #EFEFE9 warm ivory.
- Premium surfaces: #F1ECDC.
- Utility surfaces: #F8F8F8.
- Primary text: deep espresso, approximately #2E241F.
- Primary actions: restrained Oasis olive, approximately #6F7658 to #7A846A.
- Accent: antique/soft metallic gold used sparingly for key details, dividers, tiny icons, borders, premium emphasis — never large filled gold areas.
- Supporting earth neutrals may use Driftwood #8D786B, Truffle #655247, Earth Brown #5A3E2B, Sand #DCC8AF, Camel #C49A6C.
- Typography: Libre Caslon Text for editorial headings/product names where appropriate; Hanken Grotesk for functional UI, labels, prices, controls and body text. Load from a reliable web font source or use close fallbacks if unavailable.
- Spacious editorial composition, strong hierarchy, controlled asymmetry, generous whitespace, fine rules, subtle surface contrast, restrained corner radii. Premium product photography should be visually dominant.
- Interactions: refined micro-motion only; no showy animation.

FOUNDATION REQUIREMENTS:
1. Build a reusable token-driven design system: colors, typography, spacing, radii, borders, elevation, containers, breakpoints, motion. Use semantic CSS variables/tokens, not random per-component values.
2. Build reusable components for: announcement bar, desktop header, mobile header/drawer, mega menu, section heading, editorial hero, product card, category tile, collection card, CTA variants, chips/badges, price display, quantity control, wishlist button state, breadcrumb, filter controls, sort control, trust strip, testimonial card, editorial/story module, store card, newsletter/contact module, corporate/B2B enquiry teaser, footer, empty/loading/error skeleton patterns.
3. Responsive quality must be first class. Design desktop, tablet and mobile deliberately. Mobile is NOT compressed desktop. Ensure thumb-friendly touch targets, readable type, sticky actions where useful, clean navigation, no overflow.
4. Accessibility: semantic HTML, visible focus states, keyboard navigation, correct labels, sensible contrast, reduced-motion respect, alt text placeholders.
5. Performance-conscious: avoid heavy dependencies, optimize component structure, lazy-load non-critical media, reserve image aspect ratios to avoid layout shift.

ROUTES / FIRST BUILD SURFACES:
A. `/` — PREMIUM B2C-LED MASTER HOMEPAGE
Build a complete homepage using realistic Oasis Baklawa placeholder content and neutral image placeholders that can later be replaced with actual Oasis assets. Homepage hierarchy:
- Thin announcement/service bar.
- Premium header with logo wordmark placeholder and nav: Shop, Collections, Gifting, Corporate & B2B, Our Story, Stores. Search, account, wishlist, cart utility icons.
- Desktop mega-menu behavior for Shop/Collections; mobile drawer equivalent.
- Hero: editorial premium composition, one strong headline, supporting copy, primary CTA Shop Collection, secondary CTA Discover Oasis. Avoid giant full-screen text. Product imagery area should be dominant and art-directed.
- Signature Collections / Shop by Category.
- Best Sellers product rail/grid.
- Gifting editorial section with occasion-led discovery.
- Brand craftsmanship/story section — authentic Arabic sweets craftsmanship, premium ingredients, contemporary presentation.
- Corporate & B2B split CTA surface: Corporate Gifting / Wholesale & Business.
- New & noteworthy / seasonal collection.
- Trust/quality strip.
- Store discovery teaser.
- Editorial/testimonial/social proof section.
- Newsletter/contact and refined footer.

B. `/shop` — PRODUCT LISTING / CATALOGUE
- Breadcrumb.
- Editorial heading and intro.
- Category chips.
- Desktop filter sidebar or filter panel; mobile filter sheet/drawer.
- Filters: category, price, gifting/occasion, dietary placeholder, availability placeholder.
- Sort control.
- Responsive product grid.
- Product cards with image, product name, short category cue, weight/pack placeholder, price, optional compare-at price, badge, wishlist, Quick Add.
- Pagination/load-more UI.
- Strong empty state.

C. `/product/signature-pistachio-baklawa` — PDP TEMPLATE
- Breadcrumb.
- Image gallery with dominant hero image and thumbnails.
- Product title, concise premium description, price, weight/pack selector, quantity, stock/lead-time placeholder, Add to Cart and Buy Now UI, wishlist.
- Trust notes: secure payments / careful packing / delivery placeholder without making unsupported promises.
- Accordion or sections for Description, Ingredients & Allergens, Storage & Shelf Life, Shipping, Product Details.
- Editorial product story block.
- Related products.
- Mobile sticky Add to Cart treatment.

D. `/about` — CORPORATE / BRAND ENTRY
- Elegant company story page, not a generic About Us template.
- Hero, brand philosophy, craftsmanship, manufacturing/quality placeholders, timeline/heritage placeholder, leadership/company credibility area, store/footprint teaser, CTA to contact / corporate enquiries.

E. `/business` — B2B ENTRY EXPERIENCE
- Premium B2B landing page for retailers, corporate gifting buyers, hotels/restaurants/caterers, distributors/export prospects.
- Explain capabilities without fake claims/numbers.
- Sections: Wholesale & Retail Supply, Corporate Gifting, Custom/Private Business Requirements placeholder, Product Range, Process, Why Work With Oasis, enquiry form UI.
- CTAs: Request Catalogue, Speak to Sales, Existing Business Customer placeholder. The latter should later connect to the B2B Buyer App, but no auth/integration now.

F. `/stores` — store discovery UI placeholder with cards and city/location data model, but no map integration yet.

G. `/search` — search result UI with query field, suggested categories, product results and no-result state.

DATA / CONTENT MODEL:
Create structured local mock data/types for Product, Category, Collection, Store, Testimonial, NavigationItem, CorporateCapability. Keep all data easy to replace with API/CMS sources later. Do not hardwire content deep inside components.

PRODUCT MOCKS:
Use 8–12 tasteful representative Oasis-style products such as Signature Pistachio Baklawa, Assorted Baklawa, Midya Pistachio, Bulbul Pistachio, Baklawa Gift Box, Premium Arabic Sweets Assortment, Kataifi Pistachio, Corporate Gift Box. Clearly treat names/prices as UI mock data. Do not invent regulatory claims.

CODE / QUALITY:
- Use the default Lovable TypeScript + Tailwind + shadcn foundation cleanly.
- Organize code for long-term maintainability.
- Avoid huge monolithic page files; compose from reusable sections/components.
- All routes must render without errors.
- No production secrets or external backend setup.
- No checkout/payment implementation in this phase; cart actions may use local UI state/placeholders.
- No fabricated testimonials, awards, certifications, customer logos, sales claims, store counts or statistics. Use neutral placeholders where factual data is not yet supplied.
- Ensure there are no obvious TypeScript/runtime issues when done.

IMPORTANT PRODUCT PRINCIPLE:
The website should feel like a premium food/fashion retail house, not like a software dashboard. Product imagery and editorial merchandising are central. Functional controls should remain very clear and fast.

At the end, summarize the architecture, routes created, reusable components created, and any placeholders that need real Oasis content/assets later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/502df2ab-4478-4a79-9be7-cfe1ec9d5bec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
