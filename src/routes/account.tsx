import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MapPin, Package, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INDIAN_STATES,
  loadAddresses,
  loadConsents,
  loadOrderRefs,
  newAddressId,
  removeAddress,
  saveAddresses,
  saveConsents,
  upsertAddress,
  validateAddress,
  type AddressErrors,
  type ConsentPreferences,
  type SavedAddress,
  type SavedOrderRef,
} from "@/lib/account";
import { useShop } from "@/lib/store";
import { products } from "@/data/catalog";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Your Oasis Baklawa account area: delivery addresses, recent orders, saved gifts and contact preferences.";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account — Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Your Account — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AccountPage,
});

const emptyDraft = (): SavedAddress => ({
  id: newAddressId(),
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  pincode: "",
  country: "IN",
  isDefault: false,
});

function AccountPage() {
  const { wishlist, addToCart, setCartOpen } = useShop();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<SavedOrderRef[]>([]);
  const [consents, setConsents] = useState<ConsentPreferences>({
    newsletter: false,
    offers: false,
    orderUpdates: true,
  });
  const [draft, setDraft] = useState<SavedAddress | null>(null);
  const [errors, setErrors] = useState<AddressErrors>({});

  useEffect(() => {
    setAddresses(loadAddresses());
    setOrders(loadOrderRefs());
    setConsents(loadConsents());
  }, []);

  function persist(next: SavedAddress[]) {
    setAddresses(next);
    saveAddresses(next);
  }

  function submitDraft(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const found = validateAddress(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    persist(upsertAddress(addresses, draft));
    setDraft(null);
    toast.success("Address saved on this device");
  }

  const saved = products.filter((product) => wishlist.includes(product.id));

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Account" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="Account"
          title="Your details"
          intro="Signing in isn’t available yet, so you can order as a guest and everything below is kept on this device for your convenience. Your orders themselves are always looked up securely with your reference and contact details."
          action={
            <Button asChild variant="outline">
              <Link to="/track-order">Track an order</Link>
            </Button>
          }
        />
      </section>

      <section className="container-oasis mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: UserRound, label: "Guest checkout", value: "Always available" },
          { icon: MapPin, label: "Saved addresses", value: `${addresses.length}` },
          { icon: Package, label: "Recent orders", value: `${orders.length}` },
          { icon: Heart, label: "Saved gifts", value: `${saved.length}` },
        ].map((tile) => (
          <div key={tile.label} className="border border-border p-6">
            <tile.icon className="size-4 text-gold" aria-hidden="true" />
            <p className="eyebrow mt-4">{tile.label}</p>
            <p className="mt-1 font-display text-xl">{tile.value}</p>
          </div>
        ))}
      </section>

      {/* Addresses ------------------------------------------------------- */}
      <section className="container-oasis mt-16" aria-labelledby="addresses-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="addresses-heading" className="font-display text-2xl">
            Delivery addresses
          </h2>
          {draft ? null : (
            <Button variant="outline" onClick={() => setDraft(emptyDraft())}>
              Add an address
            </Button>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-[0.875rem] text-muted-foreground">
          Addresses are stored in this browser so checkout is quicker next time. They are not shared
          with anyone until you place an order.
        </p>

        {draft ? (
          <form onSubmit={submitDraft} className="mt-6 border border-border bg-utility p-6" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["label", "Label (Home, Office…)", "off"],
                  ["name", "Full name", "name"],
                  ["phone", "Mobile number", "tel"],
                  ["email", "Email (optional)", "email"],
                  ["line1", "Flat, building and street", "address-line1"],
                  ["line2", "Area or landmark (optional)", "address-line2"],
                  ["city", "City", "address-level2"],
                  ["pincode", "PIN code", "postal-code"],
                ] as const
              ).map(([field, label, autoComplete]) => (
                <div key={field} className={field === "line1" ? "sm:col-span-2" : undefined}>
                  <Label htmlFor={`addr-${field}`}>{label}</Label>
                  <Input
                    id={`addr-${field}`}
                    className="mt-2 h-11"
                    autoComplete={autoComplete}
                    value={(draft[field] as string | undefined) ?? ""}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? `addr-${field}-error` : undefined}
                    onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  />
                  {errors[field] ? (
                    <p id={`addr-${field}-error`} role="alert" className="mt-1 text-[0.8125rem] text-truffle">
                      {errors[field]}
                    </p>
                  ) : null}
                </div>
              ))}
              <div>
                <Label htmlFor="addr-state">State</Label>
                <select
                  id="addr-state"
                  className="mt-2 h-11 w-full border border-input bg-transparent px-3 text-[0.9375rem]"
                  value={draft.state}
                  aria-invalid={Boolean(errors.state)}
                  onChange={(event) => setDraft({ ...draft, state: event.target.value })}
                >
                  <option value="">Select a state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state ? (
                  <p role="alert" className="mt-1 text-[0.8125rem] text-truffle">
                    {errors.state}
                  </p>
                ) : null}
              </div>
              <label className="flex items-center gap-3 self-end text-[0.875rem]">
                <Checkbox
                  checked={draft.isDefault}
                  onCheckedChange={(checked) => setDraft({ ...draft, isDefault: checked === true })}
                />
                Use as my default address
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="submit">Save address</Button>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn("border p-6", address.isDefault ? "border-foreground bg-premium" : "border-border")}
            >
              <p className="eyebrow">{address.label || "Address"}</p>
              <p className="mt-2 font-display text-lg">{address.name}</p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.pincode}
                <br />
                {address.phone}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="ghost"
                  className="px-0"
                  onClick={() => {
                    setDraft(address);
                    setErrors({});
                  }}
                >
                  Edit
                </Button>
                {address.isDefault ? null : (
                  <Button
                    variant="ghost"
                    className="px-0"
                    onClick={() => persist(upsertAddress(addresses, { ...address, isDefault: true }))}
                  >
                    Make default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="px-0 text-truffle"
                  onClick={() => persist(removeAddress(addresses, address.id))}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {addresses.length === 0 && !draft ? (
          <div className="mt-6">
            <EmptyState
              title="No addresses saved yet"
              description="Add one now, or simply fill in your address at checkout."
              action={<Button onClick={() => setDraft(emptyDraft())}>Add an address</Button>}
            />
          </div>
        ) : null}
      </section>

      {/* Orders ---------------------------------------------------------- */}
      <section className="container-oasis mt-16" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="font-display text-2xl">
          Recent orders
        </h2>
        <p className="mt-2 max-w-2xl text-[0.875rem] text-muted-foreground">
          References from orders placed in this browser. Open one to see its current status.
        </p>
        {orders.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No orders yet"
              description="Once you place an order, its reference appears here for quick tracking."
              action={
                <Button asChild>
                  <Link to="/shop">Browse the range</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li key={order.reference} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div>
                  <p className="font-display text-lg tabular-nums">{order.reference}</p>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    Saved {new Date(order.savedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/order/$reference" params={{ reference: order.reference }}>
                    View order
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Saved gifts ------------------------------------------------------ */}
      <section className="container-oasis mt-16" aria-labelledby="saved-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="saved-heading" className="font-display text-2xl">
            Saved gifts
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/wishlist">Open full list</Link>
          </Button>
        </div>
        {saved.length === 0 ? (
          <p className="mt-3 text-[0.875rem] text-muted-foreground">
            Nothing saved yet — tap the heart on any product to keep it here.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {saved.slice(0, 5).map((product) => (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <Link to="/product/$slug" params={{ slug: product.slug }} className="link-underline font-display text-lg">
                  {product.name}
                </Link>
                {product.variants[0] ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToCart(product.id, product.variants[0]!.id, 1);
                      setCartOpen(true);
                    }}
                  >
                    Add to bag
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Preferences ------------------------------------------------------ */}
      <section className="container-oasis mt-16" aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" className="font-display text-2xl">
          Contact preferences
        </h2>
        <div className="mt-6 max-w-xl space-y-4 border border-border p-6">
          {(
            [
              ["orderUpdates", "Order and delivery updates"],
              ["newsletter", "Seasonal letter: new arrivals and gifting notes"],
              ["offers", "Occasional offers and festival previews"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-start gap-3 text-[0.9375rem]">
              <Checkbox
                checked={consents[key]}
                onCheckedChange={(checked) => {
                  const next = { ...consents, [key]: checked === true };
                  setConsents(next);
                  saveConsents(next);
                }}
              />
              {label}
            </label>
          ))}
          <p className="text-[0.8125rem] text-muted-foreground">
            Preferences are remembered on this device and applied when you next give us your email.
          </p>
        </div>
      </section>
    </div>
  );
}
