import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, ChevronDown } from "lucide-react";

import { AnnouncementBar } from "./announcement-bar";
import { primaryNav } from "@/data/site";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const routeMap = {
  "/shop": "/shop",
  "/about": "/about",
  "/business": "/business",
  "/stores": "/stores",
  "/search": "/search",
} as const;

type KnownRoute = keyof typeof routeMap;

const toRoute = (path: string) => routeMap[path as KnownRoute] ?? "/";

function Wordmark() {
  return (
    <Link
      to="/"
      className="font-display text-xl tracking-[0.02em] sm:text-[1.375rem]"
      aria-label="Oasis Baklawa — home"
    >
      Oasis <span className="text-driftwood">Baklawa</span>
    </Link>
  );
}

function UtilityIcons({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <Link
        to="/search"
        className="grid size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium"
        aria-label="Search"
      >
        <Search className="size-[1.125rem]" />
      </Link>
      <button
        type="button"
        className="hidden size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium sm:grid"
        aria-label="Account (placeholder)"
      >
        <User className="size-[1.125rem]" />
      </button>
      <button
        type="button"
        className="hidden size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium sm:grid"
        aria-label="Wishlist (placeholder)"
      >
        <Heart className="size-[1.125rem]" />
      </button>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium"
        aria-label="Cart, 0 items (placeholder)"
      >
        <ShoppingBag className="size-[1.125rem]" />
      </button>
    </div>
  );
}

function MegaMenu({ item }: { item: (typeof primaryNav)[number] }) {
  return (
    <div className="group relative">
      <Link
        to={toRoute(item.to)}
        className="inline-flex h-16 items-center gap-1.5 text-[0.8125rem] uppercase tracking-[0.14em] text-foreground transition-colors hover:text-earth"
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown className="size-3.5 text-driftwood transition-transform duration-300 group-hover:rotate-180" />
      </Link>

      <div className="invisible absolute left-1/2 top-full z-40 w-[46rem] -translate-x-1/2 opacity-0 transition-[opacity,visibility] duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="mt-0 border border-border bg-background p-8 shadow-lifted">
          <div className="grid grid-cols-3 gap-8">
            {item.columns?.map((column) => (
              <div key={column.title}>
                <h3 className="eyebrow">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.items.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={toRoute(link.to)}
                        className="link-underline text-[0.875rem] text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-[6px]">
      <AnnouncementBar />

      <div className="container-oasis grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="grid size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-background p-0">
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="font-display text-lg">Menu</SheetTitle>
            </SheetHeader>
            <nav className="px-5 py-2" aria-label="Mobile">
              <Accordion type="single" collapsible>
                {primaryNav.map((item) =>
                  item.columns ? (
                    <AccordionItem key={item.label} value={item.label} className="border-border">
                      <AccordionTrigger className="py-4 text-[0.9375rem] uppercase tracking-[0.12em] hover:no-underline">
                        {item.label}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-5">
                          {item.columns.map((column) => (
                            <div key={column.title}>
                              <h3 className="eyebrow">{column.title}</h3>
                              <ul className="mt-3 space-y-1">
                                {column.items.map((link) => (
                                  <li key={link.label}>
                                    <Link
                                      to={toRoute(link.to)}
                                      onClick={() => setOpen(false)}
                                      className="flex min-h-11 items-center text-[0.9375rem] text-muted-foreground"
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    <div key={item.label} className="border-b border-border">
                      <Link
                        to={toRoute(item.to)}
                        onClick={() => setOpen(false)}
                        className="flex min-h-14 items-center text-[0.9375rem] uppercase tracking-[0.12em]"
                      >
                        {item.label}
                      </Link>
                    </div>
                  ),
                )}
              </Accordion>
              <div className="py-6">
                <Link
                  to="/search"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-2 text-[0.875rem] text-muted-foreground"
                >
                  <Search className="size-4" /> Search the range
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 justify-self-center">
          <Wordmark />
        </div>

        <UtilityIcons className="-mr-2 justify-self-end" />
      </div>

      <div className="container-oasis hidden h-16 grid-cols-[1fr_auto_1fr] items-center gap-6 lg:grid">
        <nav aria-label="Primary" className="flex items-center gap-6 xl:gap-7">
          {primaryNav.slice(0, 3).map((item) =>
            item.columns ? (
              <MegaMenu key={item.label} item={item} />
            ) : (
              <Link
                key={item.label}
                to={toRoute(item.to)}
                className="link-underline whitespace-nowrap text-[0.8125rem] uppercase tracking-[0.14em] text-foreground"
                activeProps={{ className: "text-earth" }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="justify-self-center">
          <Wordmark />
        </div>

        <div className="flex items-center justify-end gap-6 xl:gap-7">
          <nav aria-label="Secondary" className="flex items-center gap-6 xl:gap-7">
            {primaryNav.slice(3).map((item) => (
              <Link
                key={item.label}
                to={toRoute(item.to)}
                className="link-underline whitespace-nowrap text-[0.8125rem] uppercase tracking-[0.14em] text-foreground"
                activeProps={{ className: "text-earth" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <UtilityIcons className="-mr-2" />
        </div>
      </div>
    </header>
  );
}
