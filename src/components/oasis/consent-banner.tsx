/**
 * Consent banner + preferences panel.
 *
 * Quiet, restrained and symmetrical: accept and decline carry equal weight,
 * nothing is pre-ticked beyond strictly necessary, and no overlay blocks the
 * page. Marketing and analytics scripts load only after a decision.
 */

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useConsent } from "@/lib/marketing/runtime";
import { consentConfig } from "@/config/marketing";

function PreferencesPanel({ onClose }: { onClose: () => void }) {
  const { consent, save } = useConsent();
  const [analytics, setAnalytics] = useState(consent.analytics);
  const [marketing, setMarketing] = useState(consent.marketing);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-prefs-title"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-espresso/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 shadow-lg">
        <h2 id="consent-prefs-title" className="font-display text-2xl">
          Privacy preferences
        </h2>
        <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">
          You choose what we may measure. Your choice is stored on this device and can be changed at
          any time from the footer.
        </p>

        <ul className="mt-6 space-y-5">
          <li className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[0.9375rem]">Strictly necessary</p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                Basket, checkout and security. Always on.
              </p>
            </div>
            <Switch checked disabled aria-label="Strictly necessary — always on" />
          </li>
          <li className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[0.9375rem]">Analytics</p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                Anonymous measurement of which pages and products are useful.
              </p>
            </div>
            <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics" />
          </li>
          <li className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[0.9375rem]">Marketing</p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                Personalised offers, reminders about a saved basket and relevant advertising.
              </p>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing" />
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              save({ analytics, marketing });
              onClose();
            }}
          >
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ConsentManager() {
  const { decided, acceptAll, rejectAll, preferencesOpen, openPreferences, closePreferences } =
    useConsent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const showBanner = consentConfig.required && !decided;

  return (
    <>
      {showBanner ? (
        <div
          role="region"
          aria-label="Privacy choices"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-premium/95 backdrop-blur"
        >
          <div className="container-oasis flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-[0.8125rem] leading-relaxed text-muted-foreground">
              We use strictly necessary cookies to run the basket and checkout. With your
              permission we also measure how the site is used and show relevant Oasis offers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={openPreferences}>
                Preferences
              </Button>
              <Button variant="outline" onClick={rejectAll}>
                Decline
              </Button>
              <Button onClick={acceptAll}>Accept</Button>
            </div>
          </div>
        </div>
      ) : null}

      {preferencesOpen ? <PreferencesPanel onClose={closePreferences} /> : null}
    </>
  );
}

/** Footer entry point so a decision can always be revisited. */
export function PrivacyPreferencesLink({ className }: { className?: string }) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences} className={className}>
      Privacy preferences
    </button>
  );
}
