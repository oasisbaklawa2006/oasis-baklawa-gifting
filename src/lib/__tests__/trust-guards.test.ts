import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { adapterStatus, getAdapter } from "@/adapters";
import { isIndexableSitePath } from "../site-url";

const SRC = join(__dirname, "..", "..");

function read(rel: string): string {
  return readFileSync(join(SRC, rel), "utf8");
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      sourceFiles(full, out);
    } else if (
      /\.(ts|tsx)$/.test(name) &&
      !/\.test\.(ts|tsx)$/.test(name) &&
      name !== "routeTree.gen.ts"
    ) {
      out.push(full);
    }
  }
  return out;
}

describe("trust guards (current head)", () => {
  it("keeps shipping unavailable: Shiprocket is not-configured and the payment webhook answers 503", () => {
    expect(adapterStatus(getAdapter("shipping:shiprocket")!)).toBe("not-configured");
    const webhook = read("routes/api/public/payments.webhook.ts");
    expect(webhook).toContain("status: 503");
    expect(webhook).toContain("Payment webhook not configured");
  });

  it("does not show an online delivery promise on the shipping surface", () => {
    const estimator = read("components/oasis/delivery-estimator.tsx");
    expect(estimator).toContain("not yet available online");
    expect(estimator).not.toMatch(/free (delivery|shipping)|delivered (in|by)|arrives/i);
  });

  it("ships zero percentage-discount banners in storefront source", () => {
    const offenders: string[] = [];
    const banner = /\b\d{1,3}\s?%\s?(off|discount)\b|\bsave\s+\d{1,3}\s?%|\bflat\s+\d{1,3}\s?%/i;
    for (const file of sourceFiles(SRC)) {
      const text = readFileSync(file, "utf8");
      if (banner.test(text)) offenders.push(file.slice(SRC.length + 1));
    }
    expect(offenders).toEqual([]);
  });

  it("marks /shipping noindex on the route itself", () => {
    const route = read("routes/shipping.tsx");
    expect(route).toMatch(/name:\s*"robots",\s*content:\s*"noindex, follow"/);
  });

  it("excludes /shipping from the sitemap via the indexability filter", () => {
    expect(isIndexableSitePath("/shipping")).toBe(false);
    const sitemap = read("routes/sitemap[.]xml.ts");
    expect(sitemap).toContain(".filter((entry) => isIndexableSitePath(entry.path))");
  });
});
