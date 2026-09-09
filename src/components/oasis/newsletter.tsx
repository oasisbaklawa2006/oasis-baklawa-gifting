import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** UI only — no submission endpoint is wired in this build. */
export function NewsletterModule() {
  const [email, setEmail] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setEmail("");
    toast.success("Thank you", { description: "Sign-up is a UI placeholder in this build." });
  }

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

        <form onSubmit={onSubmit} className="w-full max-w-md md:justify-self-end">
          <Label
            htmlFor="newsletter-email"
            className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood"
          >
            Email address
          </Label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-sm border-border bg-background"
            />
            <Button type="submit" size="lg" className="sm:w-auto">
              Sign up
            </Button>
          </div>
          <p className="mt-3 text-[0.75rem] text-muted-foreground">
            We will only use your address to send these updates.
          </p>
        </form>
      </div>
    </section>
  );
}
