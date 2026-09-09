/**
 * SHIPPING & DELIVERY — mock logistics model for UI work.
 * Zones, cut-offs and service levels are placeholders. Replace with the real
 * carrier/rate configuration (or an API) before launch. No guarantees are
 * implied by this data.
 */

export type ServiceLevelId = "standard" | "express" | "same-day" | "freight";

export type ServiceLevel = {
  id: ServiceLevelId;
  name: string;
  summary: string;
  /** Placeholder fee copy — not a live rate. */
  feeNote: string;
  /** Extra working days added on top of the zone transit time. */
  transitAdjustment: number;
  /** Local cut-off hour (24h) for same-day dispatch. */
  cutoffHour: number;
  availability: string;
};

export type ShippingZone = {
  id: string;
  name: string;
  blurb: string;
  /** Leading PIN code digits routed to this zone (mock routing table). */
  pincodePrefixes: string[];
  minDays: number;
  maxDays: number;
  /** Which service levels can be offered in this zone. */
  services: ServiceLevelId[];
};

export const serviceLevels: ServiceLevel[] = [
  {
    id: "standard",
    name: "Standard delivery",
    summary: "Insulated box, tracked, delivered by our courier partner.",
    feeNote: "Fee shown at checkout (placeholder)",
    transitAdjustment: 0,
    cutoffHour: 15,
    availability: "Available across all serviceable zones",
  },
  {
    id: "express",
    name: "Express delivery",
    summary: "Priority handling and the earliest available courier slot.",
    feeNote: "Surcharge applies (placeholder)",
    transitAdjustment: -1,
    cutoffHour: 13,
    availability: "Selected metro PIN codes",
  },
  {
    id: "same-day",
    name: "Same-day city delivery",
    summary: "Hand-packed and dispatched from the nearest counter.",
    feeNote: "Flat city fee (placeholder)",
    transitAdjustment: -2,
    cutoffHour: 12,
    availability: "Within our store cities only",
  },
  {
    id: "freight",
    name: "Bulk & corporate freight",
    summary: "Scheduled palletised or multi-box dispatch for large orders.",
    feeNote: "Quoted per consignment",
    transitAdjustment: 2,
    cutoffHour: 11,
    availability: "Arranged with the corporate team",
  },
];

export const shippingZones: ShippingZone[] = [
  {
    id: "zone-city",
    name: "Zone A — Our store cities",
    blurb: "Cities where we operate a counter. Fastest handling and same-day options.",
    pincodePrefixes: ["11", "40", "56"],
    minDays: 0,
    maxDays: 1,
    services: ["same-day", "express", "standard", "freight"],
  },
  {
    id: "zone-metro",
    name: "Zone B — Metro & major cities",
    blurb: "Well-connected metros served by our express courier partners.",
    pincodePrefixes: ["12", "20", "38", "41", "50", "60", "70"],
    minDays: 1,
    maxDays: 2,
    services: ["express", "standard", "freight"],
  },
  {
    id: "zone-regional",
    name: "Zone C — Regional & tier-2",
    blurb: "Standard tracked delivery on our regular dispatch schedule.",
    pincodePrefixes: ["13", "14", "18", "21", "24", "30", "34", "42", "44", "45", "48", "52", "57", "62", "68", "72", "75"],
    minDays: 2,
    maxDays: 4,
    services: ["standard", "freight"],
  },
  {
    id: "zone-extended",
    name: "Zone D — Extended network",
    blurb: "Remote and low-frequency routes. Longer transit, still fully tracked.",
    pincodePrefixes: [],
    minDays: 4,
    maxDays: 6,
    services: ["standard"],
  },
];

export const getServiceLevel = (id: ServiceLevelId) => serviceLevels.find((s) => s.id === id);

/**
 * Routing table lookup. A structurally invalid PIN code returns null so the UI
 * never shows a delivery promise for an address that cannot exist; valid but
 * unlisted prefixes fall back to the extended network zone.
 */
export function findZoneByPincode(pincode: string): ShippingZone | null {
  const digits = pincode.replace(/\D/g, "");
  if (!/^[1-9][0-9]{5}$/.test(digits)) return null;
  const prefix = digits.slice(0, 2);
  const match = shippingZones.find((z) => z.pincodePrefixes.includes(prefix));
  return match ?? shippingZones[shippingZones.length - 1] ?? null;
}

const isWorkingDay = (d: Date) => d.getDay() !== 0; // Sunday: no dispatch (placeholder rule)

function addWorkingDays(from: Date, days: number): Date {
  const date = new Date(from);
  let remaining = Math.max(0, days);
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (isWorkingDay(date)) remaining -= 1;
  }
  while (!isWorkingDay(date)) date.setDate(date.getDate() + 1);
  return date;
}

export type DeliveryEstimate = {
  zone: ShippingZone;
  service: ServiceLevel;
  /** Date the order leaves the kitchen. */
  dispatchDate: Date;
  earliest: Date;
  latest: Date;
  /** True when the order still makes today's dispatch run. */
  madeCutoff: boolean;
  cutoffLabel: string;
};

export function estimateDelivery(
  pincode: string,
  serviceId: ServiceLevelId = "standard",
  now: Date = new Date(),
): DeliveryEstimate | null {
  const zone = findZoneByPincode(pincode);
  const service = getServiceLevel(serviceId);
  if (!zone || !service) return null;
  if (!zone.services.includes(service.id)) return null;

  const madeCutoff = now.getHours() < service.cutoffHour && isWorkingDay(now);
  const dispatchDate = madeCutoff ? new Date(now) : addWorkingDays(now, 1);

  const min = Math.max(0, zone.minDays + service.transitAdjustment);
  const max = Math.max(min, zone.maxDays + service.transitAdjustment);

  return {
    zone,
    service,
    dispatchDate,
    earliest: min === 0 ? new Date(dispatchDate) : addWorkingDays(dispatchDate, min),
    latest: max === 0 ? new Date(dispatchDate) : addWorkingDays(dispatchDate, max),
    madeCutoff,
    cutoffLabel: `${String(service.cutoffHour).padStart(2, "0")}:00`,
  };
}

export const formatDeliveryDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/* ---------------------------------------------------------------- tracking */

export type TrackingStage = {
  id: string;
  label: string;
  description: string;
};

export const trackingStages: TrackingStage[] = [
  { id: "confirmed", label: "Order confirmed", description: "Your order is received and queued for the kitchen." },
  { id: "preparing", label: "Freshly prepared", description: "Trays are baked, cut and rested before boxing." },
  { id: "packed", label: "Packed & sealed", description: "Boxed with an insulated liner and tamper seal." },
  { id: "dispatched", label: "Dispatched", description: "Handed to the courier with a tracking reference." },
  { id: "out-for-delivery", label: "Out for delivery", description: "On the vehicle for its final leg." },
  { id: "delivered", label: "Delivered", description: "Signed for at the delivery address." },
];

export type TrackingEvent = {
  stageId: string;
  label: string;
  description: string;
  timestamp: Date;
  location: string;
  complete: boolean;
};

export type TrackingResult = {
  reference: string;
  status: string;
  currentStageIndex: number;
  service: ServiceLevel;
  zone: ShippingZone;
  estimatedDelivery: Date;
  events: TrackingEvent[];
  carrier: string;
};

const hash = (value: string) =>
  Array.from(value.toUpperCase()).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100000, 7);

/**
 * DEMO TRACKING — deterministic mock derived from the reference string.
 * Replace with the carrier tracking API. No real shipment is looked up.
 */
export function lookupTracking(reference: string, now: Date = new Date()): TrackingResult | null {
  const ref = reference.trim().toUpperCase();
  if (!/^OB[-]?[A-Z0-9]{4,10}$/.test(ref)) return null;

  const seed = hash(ref);
  const stageIndex = seed % trackingStages.length;
  const zone = shippingZones[seed % shippingZones.length] ?? shippingZones[0]!;
  const service = serviceLevels[seed % 2 === 0 ? 0 : 1] ?? serviceLevels[0]!;
  const locations = ["Kitchen — dispatch bay", "Origin hub", "Transit hub", "Destination hub", "Local facility", "Delivery address"];

  const events: TrackingEvent[] = trackingStages.map((stage, i) => {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - (trackingStages.length - i) * 9 + (seed % 5));
    return {
      stageId: stage.id,
      label: stage.label,
      description: stage.description,
      timestamp,
      location: locations[i] ?? "In network",
      complete: i <= stageIndex,
    };
  });

  return {
    reference: ref,
    status: trackingStages[stageIndex]?.label ?? "In transit",
    currentStageIndex: stageIndex,
    service,
    zone,
    estimatedDelivery: addWorkingDays(now, Math.max(0, zone.maxDays - stageIndex + 1)),
    events,
    carrier: "Courier partner (name to be confirmed)",
  };
}

export const sampleTrackingReference = "OB-4821KD";

/* --------------------------------------------------------- policy content */

export const packagingNotes = [
  {
    title: "Insulated, food-safe boxes",
    body: "Every order ships in a rigid box with a food-safe liner so the pastry arrives in the arrangement it left in.",
  },
  {
    title: "Tamper-evident seal",
    body: "Boxes are sealed before dispatch. If a seal is broken on arrival, refuse the parcel and contact us.",
  },
  {
    title: "Gift-ready presentation",
    body: "Gift orders ship without pricing paperwork inside the box; the invoice is emailed to the buyer instead.",
  },
  {
    title: "Warm-weather handling",
    body: "During hot months we adjust dispatch timing and add protective packing on longer routes.",
  },
];

export const shippingPolicies = [
  {
    title: "Dispatch schedule",
    body: "Orders are prepared in small batches. Anything placed before the daily cut-off joins that day's dispatch run; later orders move to the next working day. There is no Sunday dispatch.",
  },
  {
    title: "Address accuracy",
    body: "Please include a landmark and a reachable phone number. Incorrect or incomplete addresses are the most common cause of delay and may require a re-dispatch fee.",
  },
  {
    title: "Failed delivery attempts",
    body: "Couriers attempt delivery more than once. If a parcel returns to us undelivered, we will contact you to arrange the next step.",
  },
  {
    title: "Damage on arrival",
    body: "Photograph the outer box and the contents and contact us within 48 hours of delivery so we can resolve it quickly.",
  },
  {
    title: "International shipping",
    body: "Not offered at this stage. Export and corporate consignments are handled case by case through the corporate team.",
  },
];

export const shippingFaqs = [
  {
    q: "How is the delivery date calculated?",
    a: "The estimate combines your PIN code zone, the service level you choose and the daily dispatch cut-off. Working days exclude Sunday. Dates shown in this build are indicative.",
  },
  {
    q: "Can I choose a delivery date for a gift?",
    a: "Scheduled gifting dates are planned. For now, add your preferred date in the order notes and we will do our best to align dispatch.",
  },
  {
    q: "Do you ship to my PIN code?",
    a: "Use the delivery estimator above. Unlisted PIN codes route to the extended network with a longer transit window.",
  },
  {
    q: "Where do I find my tracking reference?",
    a: "It is emailed at dispatch and begins with OB-. You can enter it on the order tracking page.",
  },
  {
    q: "Can you deliver a large corporate order to multiple addresses?",
    a: "Yes — multi-address corporate runs are arranged through the corporate team so packing and dispatch can be scheduled together.",
  },
];
