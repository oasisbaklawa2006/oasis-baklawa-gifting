import { describe, expect, it } from "vitest";

import {
  isValidGstin,
  removeAddress,
  upsertAddress,
  validateAddress,
  type SavedAddress,
} from "@/lib/account";

const base: SavedAddress = {
  id: "a1",
  label: "Home",
  name: "Aisha Rahman",
  phone: "9876543210",
  line1: "12 Rosewood Avenue",
  city: "New Delhi",
  state: "Delhi",
  pincode: "110015",
  country: "IN",
  isDefault: false,
};

describe("address validation", () => {
  it("accepts a complete Indian address", () => {
    expect(validateAddress(base)).toEqual({});
  });

  it("flags bad phone, PIN and short street lines", () => {
    const errors = validateAddress({ ...base, phone: "12345", pincode: "011015", line1: "x" });
    expect(errors.phone).toBeTruthy();
    expect(errors.pincode).toBeTruthy();
    expect(errors.line1).toBeTruthy();
  });

  it("validates GSTIN format without claiming registry verification", () => {
    expect(isValidGstin("07AABCU9603R1ZM")).toBe(true);
    expect(isValidGstin("07AABCU9603R1ZM1")).toBe(false);
    expect(isValidGstin("not-a-gstin")).toBe(false);
  });
});

describe("address book", () => {
  it("makes the first saved address the default", () => {
    expect(upsertAddress([], base)[0]!.isDefault).toBe(true);
  });

  it("keeps exactly one default when another is promoted", () => {
    const list = upsertAddress([], base);
    const second = upsertAddress(list, { ...base, id: "a2", isDefault: true });
    expect(second.filter((a) => a.isDefault)).toHaveLength(1);
    expect(second.find((a) => a.isDefault)?.id).toBe("a2");
  });

  it("re-assigns the default when the default is removed", () => {
    const list = upsertAddress(upsertAddress([], base), { ...base, id: "a2", isDefault: true });
    const pruned = removeAddress(list, "a2");
    expect(pruned).toHaveLength(1);
    expect(pruned[0]!.isDefault).toBe(true);
  });
});
