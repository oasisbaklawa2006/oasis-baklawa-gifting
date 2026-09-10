/**
 * CONTENT / CMS ADAPTER
 *
 * Presentation content is governed: only published revisions are ever served
 * to a public surface. Drafts and previews require an explicit preview token
 * and can never leak through a public endpoint. AI Studio may supply approved
 * presentation snapshots — never operational truth.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type ContentKind = "page" | "article" | "faq" | "collection" | "block";

export type ContentStatus = "draft" | "published";

export type ContentDocument = {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  body: string;
  status: ContentStatus;
  revision: string;
  source: "local" | "ai-studio" | "cms";
  updatedAt: string;
};

export interface ContentAdapter {
  readonly provider: string;
  /** Public reads: published documents only, always. */
  listPublished(kind: ContentKind): Promise<AdapterResult<ContentDocument[]>>;
  getPublished(kind: ContentKind, slug: string): Promise<AdapterResult<ContentDocument | null>>;
  /** Preview requires a token and is never reachable from a public route. */
  getPreview(
    kind: ContentKind,
    slug: string,
    previewToken: string,
  ): Promise<AdapterResult<ContentDocument | null>>;
}

/** Guard used by every read path: drafts never reach a public surface. */
export function publishedOnly(documents: ContentDocument[]): ContentDocument[] {
  return documents.filter((document) => document.status === "published");
}

export const localContent: ContentAdapter = {
  provider: "local",
  async listPublished() {
    // Governed copy currently lives in typed modules under src/data.
    return { ok: true, provider: "local", data: [] };
  },
  async getPublished() {
    return { ok: true, provider: "local", data: null };
  },
  async getPreview(_kind, _slug, previewToken) {
    if (!previewToken) {
      return {
        ok: false,
        provider: "local",
        reason: "invalid_input",
        detail: "A preview token is required; drafts are never public.",
      };
    }
    return { ok: true, provider: "local", data: null };
  },
};

const cmsBoundary: ContentAdapter = {
  ...localContent,
  provider: "cms",
  async listPublished() {
    return notConfigured<ContentDocument[]>(
      "cms",
      "No headless CMS is configured. Required: CMS_API_URL, CMS_API_TOKEN.",
    );
  },
};

registerAdapter({
  id: "content:local",
  domain: "content",
  provider: "local",
  label: "Governed local / Wix presentation content",
  capabilities: ["published-only", "revision-metadata", "preview-token-gate"],
  requiredEnv: [],
  fallback: "Always available; routes read typed governed modules.",
  isFallback: true,
});

registerAdapter({
  id: "content:cms",
  domain: "content",
  provider: "cms",
  label: "Headless CMS (optional)",
  capabilities: ["published-only", "revisions", "preview", "editorial-blocks"],
  requiredEnv: ["CMS_API_URL", "CMS_API_TOKEN"],
  fallback: "Governed local content.",
});

export function contentAdapter(): ContentAdapter {
  return resolveAdapter("content")?.provider === "cms" ? cmsBoundary : localContent;
}
