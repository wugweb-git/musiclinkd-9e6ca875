/*
 * A rate is two values: an amount and a unit (owner decision, 16 Sep 2026). They travel as parts and
 * render as two pieces, the amount with the unit line under it (`Price` in components/ml/kit.tsx).
 * Only text that cannot hold two lines (titles, meta descriptions, aria labels, share text, prose)
 * joins them, with `priceText`: "₹1,500 per day".
 */

/**
 * A price as parts. `amount` is the display amount ("₹18,000", "From ₹12,000"), or the price text
 * when there is no amount ("On request", "Royalties Split"). `unit` is a bare unit ("song", "hr");
 * `unitLabel` spells it out. `note` is extra price text that is not a unit ("+ ₹5,000 deposit").
 */
export type PriceParts = {
  amount: string;
  unit?: string | undefined;
  note?: string | undefined;
};

/** Whole rupees in Indian grouping: 150000 → "₹1,50,000". */
export const inr = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;

/**
 * Every unit the data holds, spelled out once. Keys are lower-case with spaces removed, so "hr",
 * "Hour", "halfDay" and "half day" all resolve. A unit not listed is shown as stored, lower-cased
 * ("5 sessions").
 */
const UNIT_NAMES: Record<string, string> = {
  hr: "hour",
  hrs: "hour",
  hour: "hour",
  hours: "hour",
  hourly: "hour",
  day: "day",
  days: "day",
  daily: "day",
  halfday: "half day",
  fullday: "full day",
  night: "night",
  week: "week",
  weekly: "week",
  month: "month",
  monthly: "month",
  year: "year",
  yearly: "year",
  song: "song",
  track: "track",
  show: "show",
  session: "session",
  project: "project",
  feature: "feature",
  set: "set",
  event: "event",
  film: "film",
  video: "video",
  shift: "shift",
};

/** "hr" → "hour", "Song" → "song", "per track" → "track". Empty for no unit. */
export function unitName(unit: string | null | undefined): string {
  const bare = (unit ?? "")
    .trim()
    .replace(/^(per\s+|\/\s*)/i, "")
    .toLowerCase();
  return UNIT_NAMES[bare.replace(/\s+/g, "")] ?? bare;
}

/** The unit line: "hr" → "per hour". Empty for no unit. */
export function unitLabel(unit: string | null | undefined): string {
  const name = unitName(unit);
  return name ? `per ${name}` : "";
}

/**
 * Stored paise, unit and note as parts. With no amount the note is the price ("Royalties Split").
 * Null when there is neither an amount nor a note.
 */
export function priceParts(
  paise: number | null | undefined,
  unit?: string | null,
  note?: string | null,
): PriceParts | null {
  if (paise == null) return note ? { amount: note } : null;
  return {
    amount: inr(paise / 100),
    ...(unit ? { unit } : {}),
    ...(note ? { note } : {}),
  };
}

/** Whole rupees and a unit as parts, for data that already stores the number. */
export function rupeeParts(rupees: number, unit?: string | null): PriceParts {
  return { amount: inr(rupees), ...(unit ? { unit } : {}) };
}

/**
 * One line, only where two lines cannot exist (titles, meta, aria labels, share text, prose):
 * "₹1,500 per day + ₹5,000 deposit". Empty for no price.
 */
export function priceText(price: PriceParts | null | undefined): string {
  if (!price) return "";
  return [price.amount, unitLabel(price.unit), price.note].filter(Boolean).join(" ");
}
