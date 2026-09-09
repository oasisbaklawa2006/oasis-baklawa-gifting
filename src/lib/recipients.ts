/**
 * MULTI-RECIPIENT LIST IMPORT
 *
 * Real, dependency-free CSV parsing and row-level validation for corporate
 * bulk gifting. Runs entirely in the browser so a buyer can correct their file
 * before anything is submitted. It creates no order and touches no operational
 * system: the validated result is handed to the enquiry/order connector.
 */

export type RecipientRow = {
  /** 1-based row number in the uploaded file (excluding the header). */
  row: number;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  pincode: string;
  quantity: number;
  giftMessage?: string;
};

export type RowIssue = {
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type ImportResult = {
  valid: RecipientRow[];
  issues: RowIssue[];
  /** Rows that parsed but failed validation, kept so the buyer can correct them. */
  rejected: { row: number; raw: Record<string, string> }[];
  /** Rows whose name + address + pincode match an earlier row. */
  duplicates: number[];
  totalRows: number;
  totalQuantity: number;
};

export const RECIPIENT_TEMPLATE_HEADERS = [
  "name",
  "company",
  "phone",
  "email",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "pincode",
  "quantity",
  "gift_message",
];

export function recipientTemplateCsv(): string {
  return `${RECIPIENT_TEMPLATE_HEADERS.join(",")}\n`;
}

const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  "recipient name": "name",
  "full name": "name",
  company: "company",
  organisation: "company",
  organization: "company",
  phone: "phone",
  mobile: "phone",
  "contact number": "phone",
  email: "email",
  "e-mail": "email",
  address: "addressLine1",
  address1: "addressLine1",
  "address line 1": "addressLine1",
  address_line_1: "addressLine1",
  address2: "addressLine2",
  "address line 2": "addressLine2",
  address_line_2: "addressLine2",
  city: "city",
  town: "city",
  state: "state",
  region: "state",
  pincode: "pincode",
  pin: "pincode",
  "postal code": "pincode",
  postcode: "pincode",
  zip: "pincode",
  quantity: "quantity",
  qty: "quantity",
  boxes: "quantity",
  "gift message": "giftMessage",
  gift_message: "giftMessage",
  message: "giftMessage",
};

/** RFC4180-ish CSV parser: handles quotes, escaped quotes and embedded newlines. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE_RE = /^[1-9][0-9]{5}$/;
const PHONE_RE = /^(\+?91[-\s]?)?[6-9][0-9]{9}$/;

export const GIFT_MESSAGE_LIMIT = 250;

/**
 * Validates a parsed recipient list.
 * @param maxQuantityPerRow Governed cap; rows above it are flagged, never silently trimmed.
 */
export function validateRecipients(csvText: string, maxQuantityPerRow = 500): ImportResult {
  const rows = parseCsv(csvText);
  const issues: RowIssue[] = [];
  const valid: RecipientRow[] = [];
  const rejected: { row: number; raw: Record<string, string> }[] = [];
  const duplicates: number[] = [];
  const seen = new Map<string, number>();

  if (rows.length === 0) {
    return {
      valid,
      issues: [{ row: 0, field: "file", message: "The file is empty.", severity: "error" }],
      rejected,
      duplicates,
      totalRows: 0,
      totalQuantity: 0,
    };
  }

  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const mapped = header.map((h) => HEADER_ALIASES[h] ?? HEADER_ALIASES[h.replace(/_/g, " ")] ?? "");

  for (const required of ["name", "addressLine1", "city", "pincode"]) {
    if (!mapped.includes(required)) {
      issues.push({
        row: 0,
        field: "header",
        message: `Missing required column for "${required}". Use the template header row.`,
        severity: "error",
      });
    }
  }

  if (issues.some((i) => i.severity === "error")) {
    return {
      valid,
      issues,
      rejected,
      duplicates,
      totalRows: Math.max(0, rows.length - 1),
      totalQuantity: 0,
    };
  }

  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r] ?? [];
    const rowNumber = r;
    const raw: Record<string, string> = {};
    mapped.forEach((key, index) => {
      if (key) raw[key] = (cells[index] ?? "").trim();
    });

    const rowIssues: RowIssue[] = [];
    const push = (field: string, message: string, severity: RowIssue["severity"] = "error") =>
      rowIssues.push({ row: rowNumber, field, message, severity });

    const name = raw["name"] ?? "";
    const addressLine1 = raw["addressLine1"] ?? "";
    const city = raw["city"] ?? "";
    const pincode = (raw["pincode"] ?? "").replace(/\s/g, "");
    const email = raw["email"] ?? "";
    const phone = (raw["phone"] ?? "").replace(/\s/g, "");
    const quantityRaw = (raw["quantity"] ?? "1").trim();
    const giftMessage = raw["giftMessage"] ?? "";

    if (!name) push("name", "Recipient name is required.");
    if (!addressLine1) push("address_line_1", "Address line 1 is required.");
    if (!city) push("city", "City is required.");
    if (!pincode) push("pincode", "PIN code is required.");
    else if (!PINCODE_RE.test(pincode))
      push("pincode", "PIN code must be 6 digits and cannot start with 0.");

    if (email && !EMAIL_RE.test(email)) push("email", "Email address is not valid.");
    if (phone && !PHONE_RE.test(phone))
      push("phone", "Phone number is not a valid Indian mobile number.");
    if (!email && !phone)
      push(
        "phone",
        "Add a phone number or an email so the courier can reach the recipient.",
        "warning",
      );

    const quantity = Number.parseInt(quantityRaw || "1", 10);
    if (!Number.isFinite(quantity) || quantity < 1)
      push("quantity", "Quantity must be a whole number of 1 or more.");
    else if (quantity > maxQuantityPerRow)
      push("quantity", `Quantity above ${maxQuantityPerRow} per recipient needs a manual quote.`);

    if (giftMessage.length > GIFT_MESSAGE_LIMIT) {
      push(
        "gift_message",
        `Gift message is ${giftMessage.length} characters; the limit is ${GIFT_MESSAGE_LIMIT}.`,
      );
    }

    const key = `${name.toLowerCase()}|${addressLine1.toLowerCase()}|${pincode}`;
    if (name && addressLine1 && pincode) {
      const first = seen.get(key);
      if (first !== undefined) {
        duplicates.push(rowNumber);
        push(
          "name",
          `Looks like a duplicate of row ${first}. Confirm both should be shipped.`,
          "warning",
        );
      } else {
        seen.set(key, rowNumber);
      }
    }

    issues.push(...rowIssues);

    if (rowIssues.some((i) => i.severity === "error")) {
      rejected.push({ row: rowNumber, raw });
      continue;
    }

    valid.push({
      row: rowNumber,
      name,
      ...(raw["company"] ? { company: raw["company"] } : {}),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      addressLine1,
      ...(raw["addressLine2"] ? { addressLine2: raw["addressLine2"] } : {}),
      city,
      ...(raw["state"] ? { state: raw["state"] } : {}),
      pincode,
      quantity: Number.isFinite(quantity) ? quantity : 1,
      ...(giftMessage ? { giftMessage } : {}),
    });
  }

  return {
    valid,
    issues,
    rejected,
    duplicates,
    totalRows: rows.length - 1,
    totalQuantity: valid.reduce((sum, row) => sum + row.quantity, 0),
  };
}
