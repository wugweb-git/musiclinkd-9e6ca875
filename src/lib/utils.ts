import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "a · b" from whichever parts are present, so an empty field leaves no stray separator. */
export function joinParts(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ");
}

/*
 * A rate is two values: the amount and the unit it is charged in. They are stored apart
 * (`*_paise` + `*_unit`) and rendered apart by kit's `Rate` — a small grey unit line under the
 * amount — so nothing joins them into "₹1,500 / hr". `unit` is absent when there is none.
 */
export type RateValue = { amount: string; unit?: string | undefined };

/** Long unit names for the short forms the database stores. */
const rateUnits: Record<string, string> = {
  hr: "per hour",
  hour: "per hour",
  day: "per day",
  night: "per night",
  song: "per song",
  track: "per track",
  show: "per show",
  week: "per week",
  month: "per month",
  session: "per session",
  project: "per project",
};

/** A stored amount in paise as a rate. No amount means no rate, so the note stands alone. */
export function paiseRate(
  paise: number | null,
  unit?: string | null,
  note?: string | null,
): RateValue | null {
  if (paise == null) return note ? { amount: note } : null;
  const amount = `₹${(paise / 100).toLocaleString("en-IN")}`;
  const label = unit ? (rateUnits[unit] ?? `per ${unit}`) : note;
  return label ? { amount, unit: label } : { amount };
}
