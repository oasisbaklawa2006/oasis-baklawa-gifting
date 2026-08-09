import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChannelLink, UtmMedium } from "@/data/marketing";
import { discoveryLinks, marketplaceLinks, socialLinks, withUtm } from "@/data/marketing";

function ChannelItem({
  link,
  medium,
  campaign,
  className,
}: {
  link: ChannelLink;
  medium: UtmMedium;
  campaign: string;
  className?: string;
}) {
  const shared =
    "group flex min-h-11 items-center justify-between gap-3 border-b border-border py-3 text-[0.875rem]";

  if (!link.href) {
    return (
      <div className={cn(shared, "text-muted-foreground", className)}>
        <span>
          {link.label}
          <span className="ml-2 text-[0.6875rem] uppercase tracking-[0.14em] text-driftwood">
            link to be added
          </span>
        </span>
      </div>
    );
  }

  return (
    <a
      href={withUtm(link.href, { source: link.id, medium, campaign })}
      target="_blank"
      rel="noopener noreferrer me"
      className={cn(shared, "text-foreground transition-colors hover:text-earth", className)}
    >
      <span>{link.label}</span>
      <ArrowUpRight className="size-4 text-driftwood transition-transform group-hover:-translate-y-0.5" />
    </a>
  );
}

function ChannelColumn({
  title,
  intro,
  links,
  medium,
}: {
  title: string;
  intro: string;
  links: ChannelLink[];
  medium: UtmMedium;
}) {
  return (
    <div className="min-w-0">
      <h3 className="eyebrow">{title}</h3>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">{intro}</p>
      <div className="mt-5">
        {links.map((link) => (
          <ChannelItem key={link.id} link={link} medium={medium} campaign="channel_strip" />
        ))}
      </div>
    </div>
  );
}


/** "Also available on" — marketplaces, profiles and map listings. */
export function ChannelStrip() {
  return (
    <section aria-labelledby="channels-title" className="border-t border-border bg-utility">
      <div className="container-oasis section-y">
        <p className="eyebrow flex items-center gap-3">
          <span className="gold-rule inline-block" aria-hidden="true" />
          Where to find us
        </p>
        <h2 id="channels-title" className="mt-3 max-w-2xl text-3xl md:text-[2.25rem]">
          Order from Oasis wherever you already shop
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          <ChannelColumn
            title="Marketplaces"
            intro="Selected boxes are listed on the marketplaces below alongside this site."
            links={marketplaceLinks}
            medium="marketplace"
          />
          <ChannelColumn
            title="Social"
            intro="Follow the kitchen, or message us directly on the channel you prefer."
            links={socialLinks}
            medium="social"
          />
          <ChannelColumn
            title="Maps & listings"
            intro="Verified profiles for directions, hours and reviews."
            links={discoveryLinks}
            medium="listing"
          />

        </div>
      </div>
    </section>
  );
}

/** Compact inline row, used in the footer. */
export function SocialRow({ className }: { className?: string }) {
  const live = socialLinks.filter((link) => link.href);

  if (live.length === 0) {
    return (
      <p className={cn("text-[0.75rem] uppercase tracking-[0.14em] text-driftwood", className)}>
        Social profiles to be added
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {live.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer me"
            className="link-underline text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Compact marketplace row, used in the footer. */
export function MarketplaceRow({ className }: { className?: string }) {
  const live = marketplaceLinks.filter((link) => link.href);

  if (live.length === 0) {
    return (
      <p className={cn("text-[0.75rem] uppercase tracking-[0.14em] text-driftwood", className)}>
        Marketplace listings to be added
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {live.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
