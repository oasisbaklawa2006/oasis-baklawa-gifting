import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { ArticleCard } from "@/components/oasis/article-card";
import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { ProductCard } from "@/components/oasis/product-card";
import { SectionHeading } from "@/components/oasis/section-heading";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { collections, getProductBySlug } from "@/data/catalog";
import { getArticleBySlug, type Article } from "@/data/journal";
import { articles } from "@/data/journal";
import type { Collection, Product } from "@/data/types";

type LoaderData = {
  article: Article;
  related: Product[];
  relatedCollections: Collection[];
  relatedArticles: Article[];
};

export const Route = createFileRoute("/journal/$slug")({
  loader: ({ params }): LoaderData => {
    const article = getArticleBySlug(params.slug);
    if (!article) throw notFound();
    return {
      article,
      related: article.relatedProductSlugs
        .map((s) => getProductBySlug(s))
        .filter((p): p is Product => Boolean(p)),
      relatedCollections: article.relatedCollectionSlugs
        .map((s) => collections.find((c) => c.slug === s))
        .filter((c): c is Collection => Boolean(c)),
      relatedArticles: article.relatedArticleSlugs
        .map((s) => articles.find((a) => a.slug === s))
        .filter((a): a is Article => Boolean(a)),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Article unavailable — Oasis Baklawa" }, { name: "robots", content: "noindex" }],
      };
    }
    const { article } = loaderData;
    const title = `${article.title} — Oasis Baklawa Journal`;
    return {
      meta: [
        { title },
        { name: "description", content: article.excerpt },
        { property: "og:title", content: title },
        { property: "og:description", content: article.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            datePublished: article.published,
            articleSection: article.category,
            author: { "@type": "Organization", name: "Oasis Baklawa" },
            publisher: { "@type": "Organization", name: "Oasis Baklawa" },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Journal", item: "/journal" },
              {
                "@type": "ListItem",
                position: 3,
                name: article.title,
                item: `/journal/${article.slug}`,
              },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: ArticleNotFound,
  component: ArticlePage,
});

function ArticleNotFound() {
  return (
    <div className="container-oasis py-20">
      <EmptyState
        title="Article not found"
        description="This story may have been renamed or retired."
        action={
          <Button asChild>
            <Link to="/journal">Back to the Journal</Link>
          </Button>
        }
      />
    </div>
  );
}

function InlineProductLinks({ slugs }: { slugs: string[] }) {
  const items = slugs.map((s) => getProductBySlug(s)).filter((p): p is Product => Boolean(p));
  if (items.length === 0) return null;
  return (
    <p className="mt-5 border-l-2 border-gold/60 pl-4 text-[0.875rem] leading-relaxed text-muted-foreground">
      Mentioned:{" "}
      {items.map((product, i) => (
        <span key={product.slug}>
          {i > 0 ? ", " : ""}
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="text-foreground underline decoration-gold/70 underline-offset-4 hover:decoration-foreground"
          >
            {product.name}
          </Link>
        </span>
      ))}
    </p>
  );
}

function ArticlePage() {
  const { article, related, relatedCollections, relatedArticles } = Route.useLoaderData() as LoaderData;

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Journal", to: "/journal" }, { label: article.title }]}
        />
      </div>

      <article className="container-oasis mt-6">
        <header className="mx-auto max-w-3xl">
          <p className="eyebrow">{article.category}</p>
          <h1 className="mt-3 text-3xl leading-tight md:text-[2.75rem]">{article.title}</h1>
          <p className="mt-4 font-display text-lg text-truffle">{article.kicker}</p>
          <p className="mt-5 text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
            {article.readingMinutes} min read
          </p>
        </header>

        <img
          src={article.image.src}
          alt={article.image.alt}
          width={1600}
          height={1000}
          loading="eager"
          decoding="async"
          className="mt-10 aspect-[16/10] w-full rounded-sm object-cover"
        />

        <div className="mx-auto mt-12 max-w-3xl">
          <p className="font-display text-xl leading-relaxed md:text-[1.5rem]">{article.intro}</p>

          {article.sections.map((section) => (
            <section key={section.heading} className="mt-12">
              <h2 className="font-display text-2xl leading-snug">{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {section.productSlugs ? <InlineProductLinks slugs={section.productSlugs} /> : null}
            </section>
          ))}

          {relatedCollections.length > 0 ? (
            <div className="mt-14 border-t border-border pt-8">
              <p className="eyebrow">Explore next</p>
              <ul className="mt-4 flex flex-wrap gap-3">
                {relatedCollections.map((collection) => (
                  <li key={collection.slug}>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/collections/$slug" params={{ slug: collection.slug }}>
                        {collection.name}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </article>

      {related.length > 0 ? (
        <section className="container-oasis mt-20">
          <SectionHeading
            eyebrow="Shop the story"
            title="Products in this guide"
            action={
              <Button asChild variant="outline">
                <Link to="/shop">Shop all</Link>
              </Button>
            }
          />
          <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedArticles.length > 0 ? (
        <section className="container-oasis mt-20">
          <SectionHeading eyebrow="Keep reading" title="More from the Journal" />
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2">
            {relatedArticles.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
