import { Link } from "@tanstack/react-router";
import { footerColumns } from "@/data/site";

const routeMap = {
  "/shop": "/shop",
  "/about": "/about",
  "/business": "/business",
  "/stores": "/stores",
  "/search": "/search",
} as const;

type FooterTo = keyof typeof routeMap;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-oasis grid gap-12 py-14 lg:grid-cols-[1.4fr_2fr] lg:py-20">
        <div className="max-w-sm">
          <Link to="/" className="font-display text-2xl tracking-wide">
            Oasis <span className="text-driftwood">Baklawa</span>
          </Link>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
            A contemporary Middle Eastern confectionery house. Baklawa and Arabic sweets made in small
            batches and presented with care.
          </p>
          <span className="gold-rule mt-6 block" aria-hidden="true" />
          <p className="mt-4 text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
            Contact details to be added
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="eyebrow">{column.title}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={routeMap[link.to as FooterTo]}
                      className="link-underline text-[0.875rem] text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-oasis flex flex-col gap-2 py-6 text-[0.75rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Oasis Baklawa. All content on this build is placeholder.</p>
          <p className="text-driftwood">Consumer · Corporate · Business</p>
        </div>
      </div>
    </footer>
  );
}
