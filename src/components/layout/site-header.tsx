import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, ChevronDown } from "lucide-react";

import { AnnouncementBar } from "./announcement-bar";
import { primaryNav, serviceNav } from "@/data/site";
import { logos } from "@/data/brand";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { toLink, toRoute } from "@/lib/routes";
import { useShop } from "@/lib/store";

function Wordmark() {
  return (
    <Link to="/" className="block" aria-label="Oasis Baklawa — home">
      <img
        src={logos.horizontal.src}
        alt={logos.horizontal.alt}
        width={320}
        height={80}
        className="h-9 w-auto sm:h-10"
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}

function UtilityIcons({ className }: { className?: string }) {
  const { cartCount, setCartOpen, wishlist } = useShop();

  return (
    <div className={cn("flex items-center", className)}>
      <Link
        to="/search"
        className="grid size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium"
        aria-label="Search"
      >
        <Search className="size-[1.125rem]" />
      </Link>
      <Link
        to="/contact"
        className="hidden size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium sm:grid"
        aria-label="Contact us"
      >
        <User className="size-[1.125rem]" />
      </Link>
      <Link
        to="/wishlist"
        className="relative hidden size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium sm:grid"
        aria-label={`Saved items, ${wishlist.length} saved`}
      >
        <Heart className="size-[1.125rem]" />
        {wishlist.length > 0 ? (
          <span
            className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-gold"
            aria-hidden="true"
          />
        ) : null}
      </Link>
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="relative grid size-11 place-items-center rounded-sm text-foreground transition-colors hover:bg-premium"
        aria-label={`Bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
      >
        <ShoppingBag className="size-[1.125rem]" />
        {cartCount > 0 ? (
          <span className="absolute right-0.5 top-1 min-w-4 rounded-full bg-espresso px-1 text-[0.625rem] font-medium leading-4 text-background tabular-nums">
            {cartCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function MegaMenu({ item }: { item: (typeof primaryNav)[number] }) {
  return (
    <div className="group relative">
      <Link
        to={toRoute(item.to)}
        className="inline-flex h-14 items-center gap-1 whitespace-nowrap px-1 text-[0.6875rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:text-earth xl:text-[0.78125rem]"
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
                        {...toLink(link.to)}
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
                                      {...toLink(link.to)}
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
              <div className="border-t border-border py-6">
                <Link
                  to="/search"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-2 text-[0.875rem] text-muted-foreground"
                >
                  <Search className="size-4" /> Search the range
                </Link>
                <ul className="mt-2">
                  {serviceNav.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={toRoute(link.to)}
                        onClick={() => setOpen(false)}
                        className="flex min-h-11 items-center text-[0.875rem] text-muted-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 justify-self-center">
          <Wordmark />
        </div>

        <UtilityIcons className="-mr-2 justify-self-end" />
      </div>

      <div className="hidden lg:block">
        <div className="container-oasis grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div />
          <div className="justify-self-center">
            <Wordmark />
          </div>
          <UtilityIcons className="-mr-2 justify-self-end" />
        </div>

        <nav
          aria-label="Primary"
          className="container-oasis flex flex-wrap items-center justify-center gap-x-3 gap-y-0 border-t border-border xl:gap-x-7"
        >
          {primaryNav.map((item) =>
            item.columns ? (
              <MegaMenu key={item.label} item={item} />
            ) : (
              <Link
                key={item.label}
                to={toRoute(item.to)}
                className="link-underline inline-flex h-14 items-center whitespace-nowrap px-1 text-[0.6875rem] uppercase tracking-[0.12em] text-foreground xl:text-[0.78125rem]"
                activeProps={{ className: "text-earth" }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
