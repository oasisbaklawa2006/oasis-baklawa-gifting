import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandMedia, contact } from "@/data/brand";
import { canonicalUrl, siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Oasis Rewards — The Oasis Baklawa Membership" },
      {
        name: "description",
        content:
          "Oasis Rewards is our membership for regular gifting and repeat orders. Register your interest to be told first when membership opens.",
      },
      { property: "og:title", content: "Oasis Rewards" },
      {
        property: "og:description",
        content: "The Oasis Baklawa membership for regular gifting and repeat orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: siteUrl("/rewards") },
      { property: "og:image", content: brandMedia.giftBanner.src },
      { name: "twitter:image", content: brandMedia.giftBanner.src },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/rewards") }],
  }),
  component: RewardsPage,
});

/**
 * The programme shell. Earning rates, tiers and benefits are set by Oasis and
 * are not published yet, so nothing numerical is stated here.
 */
const principles = [
  {
    title: "Recognition for regular gifting",
    copy: "Membership is built for households and offices who order through the year rather than once.",
  },
  {
    title: "A record of what you sent",
    copy: "Past orders, saved recipients and repeat formats kept together in your account.",
  },
  {
    title: "First sight of new work",
    copy: "Seasonal releases and new formats shared with members before the wider list.",
  },
  {
    title: "One point of contact",
    copy: "Gifting questions answered by the same team that handles our corporate programmes.",
  },
];

function RewardsPage() {
  const [registered, setRegistered] = useState(false);

  return (
    <>
      <section className="border-b border-border bg-premium">
        <div className="container-oasis grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow flex items-center gap-3">
              <span className="gold-rule inline-block" aria-hidden="true" />
              Oasis Rewards
            </p>
            <h1 className="mt-5 text-[2.25rem] leading-[1.1] sm:text-5xl">
              A membership for those who gift often
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Oasis Rewards recognises regular gifting and repeat orders. Register your interest and
              we will write to you directly as membership opens.
            </p>
            <Button asChild size="lg" className="mt-9">
              <a href="#rewards-register">Register your interest</a>
            </Button>
          </div>
          <div className="overflow-hidden rounded-sm bg-background">
            <div className="aspect-[16/11]">
              <img
                src={brandMedia.giftBanner.src}
                alt={brandMedia.giftBanner.alt}
                width={1600}
                height={1100}
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-oasis pt-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Oasis Rewards" }]} />
      </div>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="The membership" title="What membership is for" />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {principles.map((principle) => (
            <li key={principle.title} className="border-t border-border pt-5">
              <h2 className="font-display text-xl">{principle.title}</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {principle.copy}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="rewards-register" className="border-t border-border bg-premium scroll-mt-24">
        <div className="container-oasis section-y grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="max-w-xl">
            <SectionHeading eyebrow="Register" title="Be told first" as="h2" />
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-muted-foreground">
              Leave your details and we will contact you as membership opens. If you already order
              with us, mention it and our team will connect your history to your account.
            </p>
            <p className="mt-6 text-[0.875rem] text-muted-foreground">
              Questions? Call {contact.phone} or write to {contact.email}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/account">Your account</Link>
              </Button>
              <Button asChild variant="ghost" className="px-0">
                <Link to="/luxury-gifts">Browse luxury gifts</Link>
              </Button>
            </div>
          </div>

          <form
            className="rounded-sm border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setRegistered(true);
              toast.success("Interest registered", {
                description: "We will write to you as membership opens.",
              });
            }}
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="r-name">Name</Label>
                <Input id="r-name" name="name" required autoComplete="name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-email">Email</Label>
                <Input id="r-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-phone">Phone</Label>
                <Input id="r-phone" name="phone" type="tel" autoComplete="tel" />
              </div>
              <Button type="submit" size="lg" className="mt-2">
                Register interest
              </Button>
              <p aria-live="polite" className="text-xs text-muted-foreground">
                {registered
                  ? "Thank you — your details are with our team."
                  : "We use these details only to contact you about Oasis Rewards."}
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
