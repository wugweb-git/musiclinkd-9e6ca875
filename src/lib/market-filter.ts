import type { Listing } from "@/data/market";

/*
 * What Market's filter sheet narrows by, and the one function every list applies it with (the
 * hub, a category, search). Instruments and equipment only: sale or rental, category, condition,
 * a rental's rate, how it changes hands, price and verified sellers.
 */
export type MarketFilter = {
  type: "All" | "For sale" | "For rent";
  categories: string[];
  conditions: string[];
  rates: string[];
  fulfilment: string[];
  prices: string[];
  verifiedOnly: boolean;
};

export const emptyMarketFilter: MarketFilter = {
  type: "All",
  categories: [],
  conditions: [],
  rates: [],
  fulfilment: [],
  prices: [],
  verifiedOnly: false,
};

export const priceBands: { label: string; min: number; max: number }[] = [
  { label: "Under ₹10k", min: 0, max: 10_000 },
  { label: "₹10k–50k", min: 10_000, max: 50_000 },
  { label: "₹50k–1L", min: 50_000, max: 100_000 },
  { label: "Above ₹1L", min: 100_000, max: Infinity },
];

export const rateOptions = [
  { label: "Per day", value: "day" },
  { label: "Per week", value: "week" },
  { label: "Per month", value: "month" },
];

const rupeesOf = (l: Listing) => Number((l.price.amount ?? "").replace(/[^0-9]/g, "")) || 0;

export function filterCount(f: MarketFilter) {
  return (
    (f.type === "All" ? 0 : 1) +
    f.categories.length +
    f.conditions.length +
    f.rates.length +
    f.fulfilment.length +
    f.prices.length +
    (f.verifiedOnly ? 1 : 0)
  );
}

export function applyMarketFilter(items: Listing[], f: MarketFilter): Listing[] {
  return items.filter((l) => {
    if (f.type === "For sale" && l.type !== "product") return false;
    if (f.type === "For rent" && l.type !== "rental") return false;
    if (f.categories.length && !f.categories.includes(l.gear ?? "")) return false;
    if (f.conditions.length && !f.conditions.includes(l.condition ?? "")) return false;
    if (f.rates.length && l.type === "rental" && !f.rates.includes(l.price.unit ?? ""))
      return false;
    if (f.fulfilment.length) {
      const ok =
        (f.fulfilment.includes("Pickup") && l.pickup) ||
        (f.fulfilment.includes("Delivery") && l.deliverable);
      if (!ok) return false;
    }
    if (f.prices.length) {
      const r = rupeesOf(l);
      if (!priceBands.some((b) => f.prices.includes(b.label) && r >= b.min && r < b.max))
        return false;
    }
    if (f.verifiedOnly && !l.owner?.verified) return false;
    return true;
  });
}
