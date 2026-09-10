/**
 * FIRST-TOUCH + LAST-TOUCH ATTRIBUTION
 *
 * Captured from the landing URL and referrer, persisted on the device and
 * attached to lead and order handoffs. Only approved, non-identifying campaign
 * fields ever leave the browser.
 */

export type TouchPoint = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  dclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  /** Pinterest click id. */
  epik?: string;
  landingPath: string;
  referrer: string;
  at: string;
};

export type AttributionSnapshot = {
  firstTouch: TouchPoint | null;
  lastTouch: TouchPoint | null;
};

export const ATTRIBUTION_STORAGE_KEY = "oasis.attribution.v1";

export const emptyAttribution: AttributionSnapshot = { firstTouch: null, lastTouch: null };

const CLICK_IDS = [
  ["gclid", "gclid"],
  ["dclid", "dclid"],
  ["fbclid", "fbclid"],
  ["msclkid", "msclkid"],
  ["ttclid", "ttclid"],
  ["epik", "epik"],
] as const;

/** Builds a touch point from a URL + referrer. Returns null when there is no campaign signal. */
export function parseTouch(href: string, referrer: string, now = new Date()): TouchPoint | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const q = url.searchParams;
  const touch: TouchPoint = {
    landingPath: url.pathname + (url.search ? url.search : ""),
    referrer: referrer || "",
    at: now.toISOString(),
  };

  let signal = false;
  const utm: [string, keyof TouchPoint][] = [
    ["utm_source", "utmSource"],
    ["utm_medium", "utmMedium"],
    ["utm_campaign", "utmCampaign"],
    ["utm_content", "utmContent"],
    ["utm_term", "utmTerm"],
  ];
  for (const [param, key] of utm) {
    const value = q.get(param);
    if (value) {
      (touch as Record<string, unknown>)[key] = value;
      signal = true;
    }
  }
  for (const [param, key] of CLICK_IDS) {
    const value = q.get(param);
    if (value) {
      (touch as Record<string, unknown>)[key] = value;
      signal = true;
    }
  }

  // An external referrer is itself a last-touch signal.
  if (!signal && referrer) {
    try {
      const ref = new URL(referrer);
      if (ref.host && ref.host !== url.host) signal = true;
    } catch {
      /* opaque referrer — ignore */
    }
  }

  return signal ? touch : null;
}

/** Pure merge: first touch is written once, last touch is replaced on every new signal. */
export function mergeAttribution(
  existing: AttributionSnapshot,
  touch: TouchPoint | null,
): AttributionSnapshot {
  if (!touch) return existing;
  return {
    firstTouch: existing.firstTouch ?? touch,
    lastTouch: touch,
  };
}

export function readAttribution(): AttributionSnapshot {
  if (typeof window === "undefined") return emptyAttribution;
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return emptyAttribution;
    const parsed = JSON.parse(raw) as Partial<AttributionSnapshot>;
    return {
      firstTouch: parsed.firstTouch ?? null,
      lastTouch: parsed.lastTouch ?? null,
    };
  } catch {
    return emptyAttribution;
  }
}

export function writeAttribution(snapshot: AttributionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* storage unavailable */
  }
}

/** Captures the current page as a touch point and persists the merged snapshot. */
export function captureAttribution(): AttributionSnapshot {
  if (typeof window === "undefined") return emptyAttribution;
  const touch = parseTouch(window.location.href, document.referrer);
  const merged = mergeAttribution(readAttribution(), touch);
  if (touch) writeAttribution(merged);
  return merged;
}

/**
 * The only attribution fields allowed to leave the browser with a lead or an
 * order. Flat, non-identifying and stable for Appverse/Central metadata.
 */
export function approvedAttributionFields(snapshot: AttributionSnapshot): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (prefix: string, touch: TouchPoint | null) => {
    if (!touch) return;
    const map: [string, string | undefined][] = [
      ["utm_source", touch.utmSource],
      ["utm_medium", touch.utmMedium],
      ["utm_campaign", touch.utmCampaign],
      ["utm_content", touch.utmContent],
      ["utm_term", touch.utmTerm],
      ["gclid", touch.gclid],
      ["dclid", touch.dclid],
      ["fbclid", touch.fbclid],
      ["msclkid", touch.msclkid],
      ["ttclid", touch.ttclid],
      ["epik", touch.epik],
      ["landing_path", touch.landingPath],
      ["referrer", touch.referrer],
      ["at", touch.at],
    ];
    for (const [key, value] of map) {
      if (value) out[`${prefix}_${key}`] = value;
    }
  };
  put("first", snapshot.firstTouch);
  put("last", snapshot.lastTouch);
  return out;
}
