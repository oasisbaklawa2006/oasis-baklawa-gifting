import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/oasis/section-heading";
import { partnershipTracks, referralProgramme } from "@/data/marketing";

/** Partnership + referral module: the routes through which Oasis earns coverage. */
export function PartnershipModule() {
  return (
    <section className="border-t border-border bg-background">
      <div className="container-oasis section-y">
        <SectionHeading
          eyebrow="Work with us"
          title="Partnerships, press and referrals"
          intro="Four ways to collaborate with Oasis Baklawa. Every arrangement is confirmed in writing before anything is published."
          action={
            <Button asChild variant="outline">
              <Link to="/contact">Start an enquiry</Link>
            </Button>
          }
        />

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {partnershipTracks.map((track) => (
            <div key={track.id} className="min-w-0">
              <span className="gold-rule block" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg">{track.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {track.summary}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 border-t border-border pt-10 md:grid-cols-[1.4fr_auto] md:items-center">
          <div className="max-w-xl">
            <p className="eyebrow">{referralProgramme.eyebrow}</p>
            <h3 className="mt-3 text-2xl md:text-[1.75rem]">{referralProgramme.title}</h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {referralProgramme.body}
            </p>
          </div>
          <Button asChild size="lg" className="md:justify-self-end">
            <Link to="/contact">Register interest</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
