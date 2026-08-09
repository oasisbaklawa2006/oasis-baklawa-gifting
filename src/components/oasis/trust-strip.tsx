import { trustPoints } from "@/data/site";

export function TrustStrip() {
  return (
    <section aria-label="Why Oasis Baklawa" className="border-y border-border bg-premium">
      <div className="container-oasis grid gap-x-8 gap-y-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:py-12">
        {trustPoints.map((point) => (
          <div key={point.title} className="min-w-0">
            <span className="gold-rule block" aria-hidden="true" />
            <h3 className="mt-4 font-display text-lg">{point.title}</h3>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">{point.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
