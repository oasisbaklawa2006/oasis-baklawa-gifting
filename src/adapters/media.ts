/**
 * MEDIA / CDN ADAPTER
 *
 * Oasis Wix media stays authoritative. Original packaging and logo pixels are
 * never regenerated, recompressed or redrawn by this layer: transforms are
 * limited to the delivery parameters the source host already supports, and any
 * asset marked immutable is returned untouched.
 */

import { registerAdapter, resolveAdapter } from "./registry";

export type MediaAsset = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Packaging shots, logos and artwork must be delivered at original fidelity. */
  immutableOriginal?: boolean;
};

export type TransformRequest = { width?: number; height?: number; quality?: number };

export interface MediaAdapter {
  readonly provider: string;
  supportsTransform: boolean;
  url(asset: MediaAsset, transform?: TransformRequest): string;
  srcSet(asset: MediaAsset, widths: number[]): string | undefined;
}

const isWix = (src: string) => /wixstatic\.com|wix\.com/.test(src);

export const wixMedia: MediaAdapter = {
  provider: "wix",
  supportsTransform: true,
  url(asset, transform) {
    if (asset.immutableOriginal || !transform?.width || !isWix(asset.src)) return asset.src;
    // Wix serves width hints via its own query contract; unknown hosts are untouched.
    const separator = asset.src.includes("?") ? "&" : "?";
    return `${asset.src}${separator}w=${Math.round(transform.width)}`;
  },
  srcSet(asset, widths) {
    if (asset.immutableOriginal || !isWix(asset.src)) return undefined;
    return widths.map((width) => `${this.url(asset, { width })} ${width}w`).join(", ");
  },
};

const passthrough = (provider: string): MediaAdapter => ({
  provider,
  supportsTransform: false,
  url: (asset) => asset.src,
  srcSet: () => undefined,
});

registerAdapter({
  id: "media:wix",
  domain: "media",
  provider: "wix",
  label: "Oasis Wix media (authoritative)",
  capabilities: ["source-url", "width-hints", "alt-text", "immutable-originals"],
  requiredEnv: [],
  fallback: "Always available; originals are served untouched when transforms are unavailable.",
  isFallback: true,
});

registerAdapter({
  id: "media:cloudinary",
  domain: "media",
  provider: "cloudinary",
  label: "Cloudinary (optional)",
  capabilities: ["responsive-transform", "format-negotiation"],
  requiredEnv: ["VITE_CLOUDINARY_CLOUD_NAME"],
  fallback: "Wix media URLs.",
});

registerAdapter({
  id: "media:s3",
  domain: "media",
  provider: "s3",
  label: "S3 / CDN origin (optional)",
  capabilities: ["origin-hosting", "immutable-originals"],
  requiredEnv: ["MEDIA_CDN_BASE_URL"],
  fallback: "Wix media URLs.",
});

export function mediaAdapter(): MediaAdapter {
  const provider = resolveAdapter("media")?.provider ?? "wix";
  return provider === "wix" ? wixMedia : passthrough(provider);
}
