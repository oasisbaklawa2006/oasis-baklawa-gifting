import { Link } from "@tanstack/react-router";
import { footerColumns } from "@/data/site";
import { MarketplaceRow, SocialRow } from "@/components/oasis/channel-links";
import { toLink } from "@/lib/routes";
import { brand, contact, logos } from "@/data/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-oasis grid gap-12 py-14 lg:grid-cols-[1.4fr_2fr] lg:py-20">
        <div className="max-w-sm">
          <Link to="/" className="block" aria-label="Oasis Baklawa — home">
            <img
              src={logos.horizontal.src}
              alt={logos.horizontal.alt}
              width={320}
              height={80}
              className="h-10 w-auto"
              loading="lazy"
              decoding="async"
            />
          </Link>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
            A family-owned house of baklawa, Arabic dates, artisanal chocolates and gifting,
            produced at our own unit in Kirti Nagar, New Delhi.
          </p>
          <span className="gold-rule mt-6 block" aria-hidden="true" />
          <address className="mt-4 space-y-1 text-[0.875rem] not-italic text-muted-foreground">
            {contact.headOffice.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <a href={contact.phoneHref} className="link-underline mt-2 block text-foreground">
              {contact.phone}
            </a>
            <a href={contact.emailHref} className="link-underline block text-foreground">
              {contact.email}
            </a>
          </address>
          <h2 className="eyebrow mt-8">Follow</h2>
          <SocialRow className="mt-3" />
          <h2 className="eyebrow mt-6">Also available on</h2>
          <MarketplaceRow className="mt-3" />
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="eyebrow">{column.title}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      {...toLink(link.to)}
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
          <p>
            © {new Date().getFullYear()} {brand.name}. Brand owned by {brand.legalOwner}.
          </p>
          <p className="text-driftwood">{brand.manufacturingNote}</p>
        </div>
      </div>
    </footer>
  );
}
