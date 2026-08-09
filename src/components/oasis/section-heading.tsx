import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  intro?: string;
  action?: ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  align = "start",
  as: Tag = "h2",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end",
        align === "center" && "md:grid-cols-1 md:justify-items-center md:text-center",
        className,
      )}
    >
      <div className={cn("min-w-0 max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <Tag className="mt-3 text-3xl leading-[1.15] md:text-[2.5rem]">{title}</Tag>
        {intro ? <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">{intro}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
