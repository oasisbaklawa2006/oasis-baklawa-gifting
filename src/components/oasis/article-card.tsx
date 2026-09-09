import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { Article } from "@/data/journal";

export function ArticleCard({
  article,
  className,
  priority = false,
}: {
  article: Article;
  className?: string;
  priority?: boolean;
}) {
  return (
    <article className={cn("group flex h-full flex-col", className)}>
      <Link
        to="/journal/$slug"
        params={{ slug: article.slug }}
        className="block overflow-hidden rounded-sm bg-premium focus-visible:outline-offset-4"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="aspect-[4/3]">
          <img
            src={article.image.src}
            alt={article.image.alt}
            width={1200}
            height={900}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="mt-5 flex flex-1 flex-col">
        <p className="eyebrow">{article.category}</p>
        <h3 className="mt-2 font-display text-xl leading-snug md:text-[1.4rem]">
          <Link
            to="/journal/$slug"
            params={{ slug: article.slug }}
            className="focus-visible:outline-offset-4 hover:text-truffle"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>
        <p className="mt-4 text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
          {article.readingMinutes} min read
        </p>
      </div>
    </article>
  );
}
