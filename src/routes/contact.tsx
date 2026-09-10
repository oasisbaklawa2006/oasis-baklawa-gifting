import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLeadForm } from "@/lib/marketing/use-lead-form";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contactChannels, stores } from "@/data/site";
import { contact } from "@/data/brand";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Oasis Baklawa" },
      {
        name: "description",
        content:
          "Get in touch with Oasis Baklawa about products, orders, gifting, wholesale supply or press enquiries.",
      },
      { property: "og:title", content: "Contact — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Reach the Oasis Baklawa team for orders, gifting or supply.",
      },
    ],
  }),
  component: ContactPage,
});

const topics = [
  "Product question",
  "Order or delivery",
  "Gifting",
  "Wholesale or corporate",
  "Press",
  "Other",
];

function ContactPage() {
  const [topic, setTopic] = useState(topics[0]!);
  const lead = useLeadForm({
    kind: "contact",
    source: "contact-page",
    event: "contact",
    successMessage: "Thank you — your message is with our team and we’ll reply by email.",
    failureMessage: "We couldn’t send your message just now. Please try again, or call us.",
  });

  return (
    <div className="pb-20">
      <div className="container-oasis py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Contact" }]} />
        <SectionHeading
          as="h1"
          eyebrow="We're listening"
          title="Contact us"
          intro="Send a note and we'll come back to you. You can also call or email us directly."
          className="mt-6"
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <form
            className="grid gap-5 border border-border bg-premium p-6 md:p-8"
            onSubmit={lead.onSubmit}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="c-name">Full name</Label>
                <Input
                  id="c-name"
                  name="name"
                  autoComplete="name"
                  required
                  className="h-11 bg-background"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-email">Email</Label>
                <Input
                  id="c-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11 bg-background"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="c-phone">Phone (optional)</Label>
                <Input
                  id="c-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="h-11 bg-background"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-topic">Topic</Label>
                <input type="hidden" name="topic" value={topic} />
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger id="c-topic" className="h-11 bg-background">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="c-message">Message</Label>
              <Textarea id="c-message" name="message" rows={6} required className="bg-background" />
            </div>

            <p aria-live="polite" className="text-xs text-muted-foreground">
              {lead.statusMessage}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" disabled={lead.pending}>
                {lead.pending ? "Sending…" : "Send message"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Prefer to talk? Call
                <a href={contact.phoneHref} className="link-underline text-foreground">
                  {contact.phone}
                </a>
                .
              </p>
            </div>
          </form>

          <aside className="space-y-8">
            <div>
              <h2 className="eyebrow">Direct channels</h2>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {contactChannels.map((channel) => (
                  <li key={channel.title} className="py-4">
                    <p className="font-display text-lg">{channel.title}</p>
                    <p className="mt-1 text-[0.875rem] text-muted-foreground">{channel.detail}</p>
                    {"href" in channel && channel.href ? (
                      <a
                        href={channel.href}
                        className="link-underline mt-2 block text-[0.8125rem] text-foreground"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      <p className="mt-2 text-[0.8125rem] text-driftwood">{channel.value}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="eyebrow">Visit</h2>
              <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
                Oasis counters across Delhi NCR, Amritsar and Srinagar — {stores.length} locations
                in all.
              </p>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link to="/stores">Find a store</Link>
              </Button>
            </div>

            <div className="border border-border bg-utility p-5">
              <h2 className="font-display text-lg">Business enquiries</h2>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                Wholesale, HoReCa and corporate gifting have a dedicated enquiry form.
              </p>
              <Button className="mt-4 w-full" asChild>
                <Link to="/business">Go to business</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
