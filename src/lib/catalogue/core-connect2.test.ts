import { describe, expect, it, vi } from "vitest";

import { readCoreCataloguePage, readCoreCatalogueSnapshot } from "./core-connect2.server";

const product = {
  product_id: "a3eb2e01-8432-4f4d-83c5-96f8c652ab4a",
  product_name: "Oasis Synthetic Test Baklawa",
  sku: "SYNTHETIC-NOT-FOR-SALE",
  category: "Baklawa",
  hero_image_url: "https://example.invalid/synthetic.png",
};

const config = {
  OASIS_CORE_SUPABASE_URL: "https://example.supabase.co/",
  OASIS_CORE_PUBLISHABLE_KEY: "sb_publishable_synthetic_test_only",
  OASIS_CORE_CONNECT_TOKEN: "synthetic-aaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  OASIS_CORE_CONNECT_CONSUMER_KEY: "gifting-preview-test",
  OASIS_CORE_CONNECT_ENV: "preview",
};

function envelope(rows: Record<string, unknown>[] = [product]) {
  return {
    ok: true,
    resource: "catalogue.products",
    profile_key: "website_retail_v1",
    consumer_key: "gifting-preview-test",
    environment: "preview",
    contract_version: 1,
    row_count: rows.length,
    data: rows,
  };
}

describe("Core CONNECT-2 public catalogue projection", () => {
  it("refuses to operate without a governed, server-only consumer identity", async () => {
    const transport = vi.fn();
    expect(await readCoreCataloguePage({}, {}, transport)).toMatchObject({
      status: "unavailable",
    });
    expect(transport).not.toHaveBeenCalled();
  });

  it("requests only the approved public fields, and returns no price authority", async () => {
    const transport: typeof fetch = async (url, init) => {
      expect(String(url)).toBe(
        "https://example.supabase.co/rest/v1/rpc/connect_authorize_and_project_v1",
      );
      expect(init?.method).toBe("POST");
      expect((init?.headers as Record<string, string>)["apikey"]).toBe(
        config.OASIS_CORE_PUBLISHABLE_KEY,
      );
      const request = JSON.parse(String(init?.body));
      expect(request.p_token).toBe(config.OASIS_CORE_CONNECT_TOKEN);
      expect(request.p_resource).toBe("catalogue.products");
      expect(request.p_params.fields).not.toContain("base_price");
      expect(request.p_params.fields).not.toContain("calculated_price");
      expect(request.p_params.fields).not.toContain("cost");
      return Response.json(envelope());
    };

    const result = await readCoreCataloguePage({ limit: 10 }, config, transport);
    expect(result).toMatchObject({
      status: "available",
      count: 1,
      products: [{ name: product.product_name, sku: product.sku }],
    });
    expect(JSON.stringify(result)).not.toContain("price");
  });

  it("rejects unauthorized commercial fields even if the source returns them", async () => {
    const response = envelope([{ ...product, cost: 20, calculated_price: 400 }]);
    const transport: typeof fetch = async () => Response.json(response);
    expect(await readCoreCataloguePage({}, config, transport)).toMatchObject({
      status: "unavailable",
      reason: expect.stringContaining("unauthorized fields"),
    });
  });

  it("fails on mismatched profile, tenant identity, row count or contract version", async () => {
    for (const altered of [
      { profile_key: "b2b_india_v1" },
      { consumer_key: "another-shop" },
      { environment: "production" },
      { row_count: 2 },
      { contract_version: 2 },
    ]) {
      const transport: typeof fetch = async () => Response.json({ ...envelope(), ...altered });
      expect((await readCoreCataloguePage({}, config, transport)).status).toBe("unavailable");
    }
  });

  it("rejects malformed endpoints and invalid pagination without network access", async () => {
    const transport = vi.fn();
    expect(
      await readCoreCataloguePage(
        {},
        {
          ...config,
          OASIS_CORE_SUPABASE_URL: "http://localhost:8000/",
        },
        transport,
      ),
    ).toMatchObject({ status: "unavailable" });
    expect(await readCoreCataloguePage({ limit: 501 }, config, transport)).toMatchObject({
      status: "unavailable",
    });
    expect(transport).not.toHaveBeenCalled();
  });

  it("returns a safe error without leaking the CONNECT-2 token", async () => {
    const transport: typeof fetch = async () => {
      throw new Error(config.OASIS_CORE_CONNECT_TOKEN);
    };
    const result = await readCoreCataloguePage({}, config, transport);
    expect(result.status).toBe("unavailable");
    expect(JSON.stringify(result)).not.toContain(config.OASIS_CORE_CONNECT_TOKEN);
  });
});

describe("Core CONNECT-2 bounded catalogue snapshot", () => {
  const second = {
    ...product,
    product_id: "e34c7f5e-c85a-4f7d-9679-1ed728f5d602",
    sku: "SYNTHETIC-SECOND",
  };

  it("assembles paginated pages using server-only projection", async () => {
    const offsets: number[] = [];
    const transport: typeof fetch = async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      offsets.push(request.p_params.offset);
      return Response.json(
        envelope(
          request.p_params.offset === 0 ? [product] : request.p_params.offset === 1 ? [second] : [],
        ),
      );
    };
    const result = await readCoreCatalogueSnapshot(
      { pageSize: 1, maxProducts: 3 },
      config,
      transport,
    );
    expect(result).toMatchObject({ status: "available", count: 2 });
    expect(offsets).toEqual([0, 1, 2]);
  });

  it("fails closed if a later page is rejected, without partial results", async () => {
    const transport: typeof fetch = async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      return request.p_params.offset === 0
        ? Response.json(envelope([product]))
        : new Response(null, { status: 403 });
    };
    expect(await readCoreCatalogueSnapshot({ pageSize: 1 }, config, transport)).toMatchObject({
      status: "unavailable",
    });
  });

  it("rejects duplicate product IDs and case-insensitive SKUs across pages", async () => {
    for (const duplicate of [
      product,
      { ...second, sku: product.sku.toLowerCase() },
      { ...second, product_id: product.product_id.toUpperCase() },
    ]) {
      const transport: typeof fetch = async (_url, init) => {
        const request = JSON.parse(String(init?.body));
        return Response.json(envelope([request.p_params.offset === 0 ? product : duplicate]));
      };
      expect(await readCoreCatalogueSnapshot({ pageSize: 1 }, config, transport)).toMatchObject({
        status: "unavailable",
        reason: expect.stringContaining("duplicate"),
      });
    }
  });

  it("refuses a saturated snapshot rather than claiming completeness", async () => {
    const transport: typeof fetch = async () => Response.json(envelope([product]));
    expect(
      await readCoreCatalogueSnapshot({ pageSize: 1, maxProducts: 1 }, config, transport),
    ).toMatchObject({
      status: "unavailable",
      reason: expect.stringContaining("bound"),
    });
  });

  it("rejects invalid bounds without contacting Core", async () => {
    const transport = vi.fn();
    expect(await readCoreCatalogueSnapshot({ pageSize: 101 }, config, transport)).toMatchObject({
      status: "unavailable",
    });
    expect(transport).not.toHaveBeenCalled();
  });
});
