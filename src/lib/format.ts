import type { Money } from "@/data/types";

const symbols: Record<Money["currency"], string> = {
  INR: "₹",
  AED: "AED ",
  USD: "$",
};

/** Mock price formatting — swap for locale/currency service later. */
export function formatMoney(money: Money) {
  return `${symbols[money.currency]}${money.amount.toLocaleString("en-IN")}`;
}
