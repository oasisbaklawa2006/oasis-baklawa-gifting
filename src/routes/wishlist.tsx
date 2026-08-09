import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { ProductCard } from "@/components/oasis/product-card";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { products } from "@/data/catalog";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Saved Items — Oasis Baklawa" },
      {
        name: "description",
        content: "The baklawa, assortments and gift boxes you have saved from the Oasis Baklawa range.",
      },
      { property: "og:title", content: "Saved Items — Oasis Baklawa" },
      { property: "og:description", content: "Your saved Oasis Baklawa selection." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, ready } = useShop();
  const saved = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="container-oasis py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Saved" }]} />
      <h1 className="mt-6 text-3xl md:text-[2.5rem]">Saved items</h1>
      <p className="mt-3 max-w-xl text-[0.9375rem] text-muted-foreground">
        Saved items are kept on this device only. Accounts are not connected in this build.
      </p>

      {ready && saved.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No saved items yet"
            description="Tap the heart on any product to keep it here for later."
            action={
              <Button asChild>
                <Link to="/shop">Browse the range</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {saved.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
