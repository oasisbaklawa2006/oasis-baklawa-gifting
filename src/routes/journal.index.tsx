import { createFileRoute, Link } from "@tanstack/react-router";

import { ArticleCard } from "@/components/oasis/article-card";
import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import { articleCategories, articlesByDate } from "@/data/journal";

const DESCRIPTION =
  "Gift guides, ingredient spotlights and stories from the Oasis Baklawa kitchen — how to choose, serve and share Middle Eastern sweets.";

export const Route = createFileRoute("/journal/")({
  head: () => ({
    meta: [
      { title: "The Journal — Gift Guides & Ingredient Notes | Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "The Journal — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalIndex,
});

function JournalIndex() {
  const [lead, ...rest] = articlesByDate;

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Journal" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="The Journal"
          title="Guides, ingredients and stories"
          intro={DESCRIPTION}
          action={
            <Button asChild variant="outline">
              <Link to="/shop">Shop the range</Link>
            </Button>
          }
        />
      </section>

      {lead ? (
        <section className="container-oasis mt-12">
          <div className="grid items-center gap-8 border border-border bg-premium p-6 md:grid-cols-2 md:p-10">
            <img
              src={lead.image.src}
              alt={lead.image.alt}
              width={1200}
              height={900}
              loading="eager"
              decoding="async"
              className="aspect-[4/3] w-full rounded-sm object-cover"
            />
            <div className="max-w-lg">
              <p className="eyebrow">{lead.category}</p>
              <h2 className="mt-3 font-display text-2xl leading-tight md:text-[2rem]">{lead.title}</h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">{lead.excerpt}</p>
              <Button asChild className="mt-7">
                <Link to="/journal/$slug" params={{ slug: lead.slug }}>
                  Read the guide
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {articleCategories.map((category) => {
        const items = rest.filter((a) => a.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="container-oasis mt-16">
            <SectionHeading eyebrow={category} title={categoryTitles[category]} />
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="container-oasis mt-20">
        <NewsletterModule />
      </section>
    </div>
  );
}

const categoryTitles: Record<string, string> = {
  "Gift guides": "What to send, and when",
  "Ingredient spotlights": "Inside the ingredients",
  Stories: "From the souk to the counter",
};
