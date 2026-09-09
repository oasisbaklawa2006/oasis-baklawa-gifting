import { MapPin, Clock, Phone } from "lucide-react";

import type { Store, Testimonial } from "@/data/types";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col justify-between border border-border bg-background p-6 md:p-8">
      <blockquote className="font-display text-lg leading-relaxed text-foreground">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-6">
        <span className="gold-rule block" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium">{testimonial.attribution}</p>
        <p className="text-[0.75rem] text-muted-foreground">{testimonial.context}</p>
      </figcaption>
    </figure>
  );
}

export function StoreCard({ store }: { store: Store }) {
  return (
    <article className="flex h-full flex-col border border-border bg-background p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h3 className="min-w-0 font-display text-xl leading-snug">{store.name}</h3>
        <span className="shrink-0 rounded-xs border border-gold/70 px-2 py-1 text-[0.625rem] uppercase tracking-[0.14em] text-earth">
          {store.status === "open" ? "Open" : "Opening soon"}
        </span>
      </div>

      <dl className="mt-5 space-y-3 text-[0.8125rem] text-muted-foreground">
        <div className="flex gap-3">
          <dt className="sr-only">Address</dt>
          <MapPin className="mt-0.5 size-4 shrink-0 text-driftwood" aria-hidden="true" />
          <dd className="min-w-0">
            {store.addressLines.join(", ")}
            <br />
            {store.city}, {store.region}
            {store.postalCode ? ` ${store.postalCode}` : ""}
          </dd>
        </div>
        {store.hours ? (
          <div className="flex gap-3">
            <dt className="sr-only">Hours</dt>
            <Clock className="mt-0.5 size-4 shrink-0 text-driftwood" aria-hidden="true" />
            <dd>{store.hours}</dd>
          </div>
        ) : null}
        {store.phone ? (
          <div className="flex gap-3">
            <dt className="sr-only">Phone</dt>
            <Phone className="mt-0.5 size-4 shrink-0 text-driftwood" aria-hidden="true" />
            <dd>{store.phone}</dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-auto flex flex-wrap gap-2 pt-6">
        {store.services.map((service) => (
          <li
            key={service}
            className="rounded-full border border-border px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-driftwood"
          >
            {service}
          </li>
        ))}
      </ul>
    </article>
  );
}
