/**
 * Google Merchant Center / shopping feed.
 *
 * Emits only public-safe, approved catalogue fields. Products still carrying
 * unverified placeholder data are excluded rather than published with invented
 * attributes.
 */

import { createFileRoute } from "@tanstack/react-router";

import { products } from "@/data/catalog";
import { siteUrl } from "@/lib/site-url";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const Route = createFileRoute("/feed/products.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const items = products
          .filter((product) => !product.isMock)
          .flatMap((product) => {
            const variant = product.variants[0];
            if (!variant) return [];
            const link = siteUrl(`/product/${product.slug}`, request.url);
            return [
              `    <item>
      <g:id>${escape(variant.id)}</g:id>
      <g:title>${escape(product.name)}</g:title>
      <g:description>${escape(product.shortDescription || product.name)}</g:description>
      <g:link>${escape(link)}</g:link>
      <g:price>${variant.price.amount} ${variant.price.currency}</g:price>
      <g:brand>Oasis Baklawa</g:brand>
      <g:condition>new</g:condition>
    </item>`,
            ];
          });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Oasis Baklawa</title>
    <link>${escape(siteUrl("/", request.url))}</link>
    <description>Approved Oasis Baklawa products</description>
${items.join("\n")}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
