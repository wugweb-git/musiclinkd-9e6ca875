import type { Listing } from "@/data/market";

/*
 * What Market's filter sheet narrows by, and the one function every list applies it with (the
 * hub, a category, search). Instruments and equipment only: sale or rental, category, condition,
 * a rental's rate, how it changes hands, price and verified sellers.
 */
export type MarketFilter = {
  types: string[];
  categories: string[];
  conditions: string[];
  rates: string[];
  fulfilment: string[];
  prices: string[];
  verifiedOnly: boolean;
};

export const emptyMarketFilter: MarketFilter = {
  types: [],
  categories: [],
  conditions: [],
  rates: [],
  fulfilment: [],
  prices: [],
  verifiedOnly: false,
};

export const priceBands: { key: string; label: string; min: number; max: number }[] = [
  { key: "under_10k", label: "Under ₹10k", min: 0, max: 10_000 },
  { key: "10k_50k", label: "₹10k–50k", min: 10_000, max: 50_000 },
  { key: "50k_1l", label: "₹50k–1L", min: 50_000, max: 100_000 },
  { key: "above_1l", label: "Above ₹1L", min: 100_000, max: Infinity },
];

/** Filter values are keys; what the chips say lives beside them (market.tsx). */
export const typeOptions = [
  { label: "For sale", value: "sale" },
  { label: "For rent", value: "rent" },
];
export const conditionOptions = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like_new" },
  { label: "Used", value: "used" },
];
export const fulfilmentOptions = [
  { label: "Pickup", value: "pickup" },
  { label: "Delivery", value: "delivery" },
];

/** A listing's condition as a filter key; conditions the filter doesn't offer match nothing. */
const CONDITION_KEY: Partial<Record<NonNullable<Listing["condition"]>, string>> = {
  New: "new",
  "Like New": "like_new",
  Used: "used",
};

export const rateOptions = [
  { label: "Per day", value: "day" },
  { label: "Per week", value: "week" },
  { label: "Per month", value: "month" },
];

const rupeesOf = (l: Listing) => Number((l.price.amount ?? "").replace(/[^0-9]/g, "")) || 0;

export function filterCount(f: MarketFilter) {
  return (
    f.types.length +
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
    if (f.types.length && !f.types.includes(l.type === "rental" ? "rent" : "sale")) return false;
    if (f.categories.length && !f.categories.includes(l.gear ?? "")) return false;
    if (
      f.conditions.length &&
      !f.conditions.includes((l.condition && CONDITION_KEY[l.condition]) ?? "")
    )
      return false;
    if (f.rates.length && l.type === "rental" && !f.rates.includes(l.price.unit ?? ""))
      return false;
    if (f.fulfilment.length) {
      const ok =
        (f.fulfilment.includes("pickup") && l.pickup) ||
        (f.fulfilment.includes("delivery") && l.deliverable);
      if (!ok) return false;
    }
    if (f.prices.length) {
      const r = rupeesOf(l);
      if (!priceBands.some((b) => f.prices.includes(b.key) && r >= b.min && r < b.max))
        return false;
    }
    if (f.verifiedOnly && !l.owner?.verified) return false;
    return true;
  });
}
