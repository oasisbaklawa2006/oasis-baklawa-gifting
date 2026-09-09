/**
 * ACCOUNT MODEL + LOCAL CONVENIENCE STORE
 *
 * Identity is not an in-app authority. When no identity provider is
 * configured, the account area works as a *browser convenience*: addresses and
 * order references are kept on this device only. Once an identity provider is
 * configured, the same shapes are served through the account adapter so no UI
 * changes are needed.
 */

export type SavedAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

export type SavedOrderRef = {
  reference: string;
  contact: string;
  savedAt: string;
};

export type ConsentPreferences = {
  newsletter: boolean;
  offers: boolean;
  orderUpdates: boolean;
};

export type IdentitySession =
  | { status: "guest" }
  | { status: "unavailable"; reason: string }
  | { status: "signed-in"; customerId: string; email: string };

/** Adapter contract for a future identity provider. Fails closed today. */
export interface AccountAdapter {
  readonly id: string;
  isConfigured(): boolean;
  getSession(): Promise<IdentitySession>;
  requestSignInCode(identifier: string): Promise<{ sent: boolean; reason?: string }>;
  verifySignInCode(identifier: string, code: string): Promise<IdentitySession>;
  signOut(): Promise<void>;
}

export const unconfiguredAccountAdapter: AccountAdapter = {
  id: "none",
  isConfigured: () => false,
  async getSession() {
    return { status: "unavailable", reason: "Accounts are not available yet." };
  },
  async requestSignInCode() {
    return { sent: false, reason: "Accounts are not available yet." };
  },
  async verifySignInCode() {
    return { status: "unavailable", reason: "Accounts are not available yet." };
  },
  async signOut() {
    /* nothing to sign out of */
  },
};

/* ----------------------------- validation ----------------------------- */

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type AddressErrors = Partial<Record<keyof SavedAddress, string>>;

export function validateAddress(input: Partial<SavedAddress>): AddressErrors {
  const errors: AddressErrors = {};
  if (!input.name || input.name.trim().length < 2) errors.name = "Enter the full name.";
  if (!/^[6-9]\d{9}$/.test((input.phone ?? "").replace(/\D/g, "")))
    errors.phone = "Enter a 10-digit Indian mobile number.";
  if (input.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(input.email))
    errors.email = "Enter a valid email address.";
  if (!input.line1 || input.line1.trim().length < 5)
    errors.line1 = "Enter the building and street.";
  if (!input.city || input.city.trim().length < 2) errors.city = "Enter the city.";
  if (!input.state || input.state.trim().length < 2) errors.state = "Select the state.";
  if (!/^[1-9]\d{5}$/.test((input.pincode ?? "").replace(/\D/g, "")))
    errors.pincode = "Enter a valid 6-digit PIN code.";
  return errors;
}

export function isValidGstin(value: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    value.trim().toUpperCase(),
  );
}

/* ------------------------------ local store ---------------------------- */

const ADDRESS_KEY = "oasis.addresses.v1";
const ORDERS_KEY = "oasis.orders.v1";
const CONSENT_KEY = "oasis.consents.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function loadAddresses(): SavedAddress[] {
  return read<SavedAddress[]>(ADDRESS_KEY, []);
}

export function saveAddresses(addresses: SavedAddress[]): void {
  write(ADDRESS_KEY, addresses);
}

export function upsertAddress(list: SavedAddress[], address: SavedAddress): SavedAddress[] {
  const next = list.some((a) => a.id === address.id)
    ? list.map((a) => (a.id === address.id ? address : a))
    : [...list, address];
  if (!address.isDefault) return next.length === 1 ? [{ ...address, isDefault: true }] : next;
  return next.map((a) => ({ ...a, isDefault: a.id === address.id }));
}

export function removeAddress(list: SavedAddress[], id: string): SavedAddress[] {
  const next = list.filter((a) => a.id !== id);
  if (next.length > 0 && !next.some((a) => a.isDefault)) {
    return next.map((a, index) => ({ ...a, isDefault: index === 0 }));
  }
  return next;
}

export function loadOrderRefs(): SavedOrderRef[] {
  return read<SavedOrderRef[]>(ORDERS_KEY, []);
}

export function rememberOrderRef(reference: string, contact: string): void {
  const existing = loadOrderRefs().filter((entry) => entry.reference !== reference);
  write(
    ORDERS_KEY,
    [{ reference, contact, savedAt: new Date().toISOString() }, ...existing].slice(0, 20),
  );
}

export function loadConsents(): ConsentPreferences {
  return read<ConsentPreferences>(CONSENT_KEY, {
    newsletter: false,
    offers: false,
    orderUpdates: true,
  });
}

export function saveConsents(value: ConsentPreferences): void {
  write(CONSENT_KEY, value);
}

export function newAddressId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
