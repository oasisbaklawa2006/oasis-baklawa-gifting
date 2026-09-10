import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLeadForm } from "@/lib/marketing/use-lead-form";

/**
 * Newsletter sign-up. The address is stored through the single lead service;
 * a confirmation is only shown once the server confirms it was saved.
 */
export function NewsletterModule() {
  const lead = useLeadForm({
    kind: "newsletter",
    source: "footer-newsletter",
    event: "newsletter_signup",
    successMessage: "Thank you — you’re on the list.",
    failureMessage: "We couldn’t save your address just now. Please try again shortly.",
  });

  return (
    <section className="border-t border-border bg-premium">
      <div className="container-oasis grid gap-10 py-14 md:grid-cols-2 md:items-center lg:py-20">
        <div className="max-w-lg">
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            Keep in touch
          </p>
          <h2 className="mt-3 text-3xl md:text-[2.25rem]">New collections, quietly announced</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Occasional notes on seasonal collections, gifting formats and store openings. No noise.
          </p>
        </div>

        <form onSubmit={lead.onSubmit} className="w-full max-w-md md:justify-self-end">
          <Label
            htmlFor="newsletter-email"
            className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood"
          >
            Email address
          </Label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input
              id="newsletter-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 rounded-sm border-border bg-background"
            />
            <Button type="submit" size="lg" className="sm:w-auto" disabled={lead.pending}>
              {lead.pending ? "Saving…" : "Sign up"}
            </Button>
          </div>
          <p aria-live="polite" className="mt-3 text-[0.75rem] text-muted-foreground">
            {lead.statusMessage ?? "We will only use your address to send these updates."}
          </p>
        </form>
      </div>
    </section>
  );
}
