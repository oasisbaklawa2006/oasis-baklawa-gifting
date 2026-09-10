import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { products } from "@/data/catalog";
import { collections } from "@/data/catalog";
import { articles } from "@/data/journal";

import { siteUrl } from "@/lib/site-url";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/luxury-gifts", changefreq: "weekly", priority: "0.9" },
          { path: "/baklawa", changefreq: "weekly", priority: "0.9" },
          { path: "/gourmet-food", changefreq: "weekly", priority: "0.9" },
          { path: "/wedding-gifting", changefreq: "monthly", priority: "0.8" },
          { path: "/world-of-oasis", changefreq: "monthly", priority: "0.7" },
          { path: "/rewards", changefreq: "monthly", priority: "0.6" },
          { path: "/shop", changefreq: "weekly", priority: "0.9" },
          { path: "/collections", changefreq: "weekly", priority: "0.8" },
          { path: "/gifting", changefreq: "monthly", priority: "0.8" },
          { path: "/build-your-box", changefreq: "monthly", priority: "0.8" },
          { path: "/build-a-gift", changefreq: "monthly", priority: "0.8" },
          { path: "/corporate", changefreq: "monthly", priority: "0.8" },
          { path: "/payment-options", changefreq: "monthly", priority: "0.5" },
          { path: "/journal", changefreq: "weekly", priority: "0.7" },
          { path: "/shipping", changefreq: "monthly", priority: "0.6" },
          { path: "/business", changefreq: "monthly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/stores", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/faq", changefreq: "monthly", priority: "0.5" },
          { path: "/search", changefreq: "monthly", priority: "0.3" },
          ...collections.map((collection) => ({
            path: `/collections/${collection.slug}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
          ...articles.map((article) => ({
            path: `/journal/${article.slug}`,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
          ...products.map((product) => ({
            path: `/product/${product.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${siteUrl(e.path, request.url)}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
