import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import craftImage from "@/assets/craft-filo.jpg";
import giftImage from "@/assets/product-giftbox.jpg";

/** Editorial two-column story module — reusable across home and about. */
export function EditorialModule({
  eyebrow,
  title,
  body,
  points,
  image,
  imageAlt,
  reverse = false,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points?: string[];
  image: string;
  imageAlt: string;
  reverse?: boolean;
  cta?: {
    label: string;
    to:
      | "/shop"
      | "/about"
      | "/business"
      | "/stores"
      | "/baklawa"
      | "/luxury-gifts"
      | "/gourmet-food"
      | "/world-of-oasis";
  };
}) {
  return (
    <section className="container-oasis section-y">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={reverse ? "lg:order-2" : undefined}>
          <div className="overflow-hidden rounded-sm bg-premium">
            <div className="aspect-[4/3]">
              <img
                src={image}
                alt={imageAlt}
                width={1400}
                height={1050}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
        <div className={reverse ? "lg:order-1" : undefined}>
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            {eyebrow}
          </p>
          <h2 className="mt-4 text-3xl leading-tight md:text-[2.5rem]">{title}</h2>
          <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            {body}
          </p>
          {points ? (
            <ul className="mt-8 space-y-4 border-t border-border pt-8">
              {points.map((point) => (
                <li
                  key={point}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-[0.9375rem]"
                >
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {cta ? (
            <Button asChild variant="outline" className="mt-9">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CraftsmanshipModule() {
  return (
    <EditorialModule
      eyebrow="Craftsmanship"
      title="An old craft, presented for today"
      body="Baklawa is a patient craft: sheets of filo rolled thin, brushed with clarified butter and layered before the nuts go in. We keep that method and change only the presentation — clean formats, considered packaging and a lighter finish."
      points={[
        "Pastry laid and cut by hand in small batches",
        "Nuts and butter selected for the house recipes",
        "Contemporary, restrained presentation",
      ]}
      image={craftImage}
      imageAlt="Hands brushing clarified butter across a thin sheet of filo pastry on a marble worktop"
      cta={{ label: "Our story", to: "/about" }}
    />
  );
}

/** Corporate & B2B split CTA surface. */
export function BusinessSplit() {
  const panels = [
    {
      eyebrow: "Corporate gifting",
      title: "Gifting programmes for clients and teams",
      body: "Consistent presentation across volume, with card insert options and coordinated delivery.",
      to: "/business" as const,
      label: "Corporate gifting",
    },
    {
      eyebrow: "Wholesale & business",
      title: "Supply for retail, hospitality and distribution",
      body: "Repeat formats, case packing options and specification sheets on request.",
      to: "/business" as const,
      label: "Wholesale enquiries",
    },
  ];

  return (
    <section className="border-y border-border bg-premium">
      <div className="container-oasis grid gap-px py-0 md:grid-cols-2">
        {panels.map((panel, i) => (
          <div
            key={panel.eyebrow}
            className={
              i === 0
                ? "py-12 md:border-r md:border-border md:pr-12 lg:py-20"
                : "border-t border-border py-12 md:border-t-0 md:pl-12 lg:py-20"
            }
          >
            <p className="eyebrow">{panel.eyebrow}</p>
            <h3 className="mt-4 max-w-md text-2xl leading-snug md:text-[1.75rem]">{panel.title}</h3>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
              {panel.body}
            </p>
            <Link
              to={panel.to}
              className="link-underline mt-7 inline-flex items-center gap-2 text-[0.8125rem] uppercase tracking-[0.14em] text-earth"
            >
              {panel.label}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GiftingModule() {
  return (
    <EditorialModule
      reverse
      eyebrow="Gifting"
      title="Chosen for the occasion, not the aisle"
      body="Boxed selections sized for festivals, hosting and thank-yous. Each format is packed in a rigid box with an inner tray so pieces arrive as they left the kitchen."
      points={["Festive selections", "Hosting formats", "Thank-you boxes", "Corporate programmes"]}
      image={giftImage}
      imageAlt="A sand-coloured gift box finished with a ribbon on a warm ivory surface"
      cta={{ label: "Shop gifting", to: "/shop" }}
    />
  );
}
