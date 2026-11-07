/**
 * Customer-safe catalogue read boundary. Tokens and Supabase credentials are
 * accessed exclusively in the server-side CONNECT-2 adapter.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const paging = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).max(100_000).default(0),
});

export const readGovernedPublicCatalogue = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => paging.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { readCoreCataloguePage } = await import("./core-connect2.server");
    return await readCoreCataloguePage(data);
  });
