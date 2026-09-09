import { describe, expect, it } from "vitest";

import { parseCsv, validateRecipients } from "../recipients";

const header = "name,phone,email,address_line_1,city,pincode,quantity,gift_message";

describe("parseCsv", () => {
  it("handles quoted fields, escaped quotes and embedded commas", () => {
    const rows = parseCsv('a,b\n"x, y","he said ""hi"""');
    expect(rows).toEqual([
      ["a", "b"],
      ["x, y", 'he said "hi"'],
    ]);
  });

  it("drops fully blank lines", () => {
    expect(parseCsv("a,b\n\n1,2")).toHaveLength(2);
  });
});

describe("validateRecipients", () => {
  it("accepts a well-formed row", () => {
    const result = validateRecipients(
      `${header}\nAsha Rao,9876543210,asha@example.com,12 Green Park,New Delhi,110016,2,Happy Diwali`,
    );
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]?.quantity).toBe(2);
    expect(result.totalQuantity).toBe(2);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("reports a missing required column instead of guessing", () => {
    const result = validateRecipients("name,city\nAsha,Delhi");
    expect(result.valid).toHaveLength(0);
    expect(result.issues[0]?.field).toBe("header");
  });

  it("flags an invalid pincode and keeps the row for correction", () => {
    const result = validateRecipients(
      `${header}\nAsha Rao,9876543210,asha@example.com,12 Green Park,New Delhi,01100,1,`,
    );
    expect(result.valid).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.issues.some((i) => i.field === "pincode")).toBe(true);
  });

  it("flags an invalid email and phone", () => {
    const result = validateRecipients(
      `${header}\nAsha Rao,12345,not-an-email,12 Green Park,New Delhi,110016,1,`,
    );
    expect(result.issues.some((i) => i.field === "email")).toBe(true);
    expect(result.issues.some((i) => i.field === "phone")).toBe(true);
  });

  it("detects duplicate recipients as a warning, not a silent merge", () => {
    const row = "Asha Rao,9876543210,asha@example.com,12 Green Park,New Delhi,110016,1,";
    const result = validateRecipients(`${header}\n${row}\n${row}`);
    expect(result.duplicates).toEqual([2]);
    expect(result.valid).toHaveLength(2);
  });

  it("rejects an over-long gift message", () => {
    const result = validateRecipients(
      `${header}\nAsha Rao,9876543210,asha@example.com,12 Green Park,New Delhi,110016,1,${"x".repeat(260)}`,
    );
    expect(result.issues.some((i) => i.field === "gift_message")).toBe(true);
  });

  it("warns when neither phone nor email is present", () => {
    const result = validateRecipients(`${header}\nAsha Rao,,,12 Green Park,New Delhi,110016,1,`);
    expect(result.valid).toHaveLength(1);
    expect(result.issues.some((i) => i.severity === "warning")).toBe(true);
  });
});
