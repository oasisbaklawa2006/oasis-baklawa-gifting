/**
 * MARKETING RUNTIME
 *
 * Holds consent state for the app, gates tag loading, captures attribution and
 * installs the server bridge used for Meta CAPI / Klaviyo mirroring.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { consentConfig } from "@/config/marketing";

import { captureAttribution } from "./attribution";
import {
  allows,
  consentDecided,
  decide,
  defaultConsent,
  permissiveConsent,
  readConsent,
  writeConsent,
  type ConsentCategory,
  type ConsentState,
} from "./consent";
import { setConsentState, setServerBridge, track } from "./dispatch";
import type { CanonicalEvent } from "./events";
import { dispatchMarketingEvent } from "./marketing.functions";
import { loadMarketingScripts, updateConsentMode } from "./scripts";

type ConsentContextValue = {
  consent: ConsentState;
  decided: boolean;
  allows: (category: ConsentCategory) => boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choice: { analytics: boolean; marketing: boolean }) => void;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function MarketingProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(
    consentConfig.required ? defaultConsent : permissiveConsent,
  );
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const bridged = useRef(false);

  // Hydration-safe: read stored consent only after mount.
  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    setConsentState(stored);
    if (consentDecided(stored) || !consentConfig.required) loadMarketingScripts(stored);
    else updateConsentMode(stored);
  }, []);

  // Attribution is first-party and necessary for order/lead handoff accuracy.
  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    if (bridged.current) return;
    bridged.current = true;
    setServerBridge((event: CanonicalEvent) => {
      void dispatchMarketingEvent({ data: { event } }).catch(() => undefined);
    });
    return () => setServerBridge(null);
  }, []);

  const apply = useCallback((next: ConsentState) => {
    setConsent(next);
    setConsentState(next);
    writeConsent(next);
    loadMarketingScripts(next);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      decided: consentDecided(consent),
      allows: (category) => allows(consent, category),
      acceptAll: () => apply(decide({ analytics: true, marketing: true })),
      rejectAll: () => apply(decide({ analytics: false, marketing: false })),
      save: (choice) => apply(decide(choice)),
      preferencesOpen,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
    }),
    [consent, apply, preferencesOpen],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within MarketingProvider");
  return ctx;
}

export { track };
