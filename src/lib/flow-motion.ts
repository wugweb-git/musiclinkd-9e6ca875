import type { ParsedLocation } from "@tanstack/react-router";
import { steps } from "@/data/onboarding";

/**
 * Page motion for the registration flow (splash → auth → onboarding → Home). The order below is the
 * order a new user travels, so a navigation to a later screen slides forward and to an earlier one
 * slides back, whether it came from a button, a link or the Android back gesture. The keyframes
 * live in styles.css under "page motion".
 */
const ORDER = [
  "/welcome",
  "/auth",
  "/auth/phone",
  "/auth/otp",
  "/auth/verify-email",
  "/onboarding",
  ...steps.map((s) => `/onboarding/step/${s.id}`),
  "/onboarding/preview",
  "/onboarding/complete",
  "/onboarding/done",
];

/** Flow screens that sit outside the linear order: they cross-fade rather than slide. */
const SIDE = new Set(["/", "/onboarding/skip", "/onboarding/resume", "/auth/forgot", "/feed"]);

const clean = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

export function flowTransitionTypes({
  fromLocation,
  toLocation,
  pathChanged,
}: {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
  pathChanged: boolean;
}): string[] | false {
  if (!fromLocation || !pathChanged) return false;
  // A hidden document (app in the background, a prerender) rejects startViewTransition.
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;
  const from = clean(fromLocation.pathname);
  const to = clean(toLocation.pathname);
  const a = ORDER.indexOf(from);
  const b = ORDER.indexOf(to);
  if (a >= 0 && b >= 0) return [b > a ? "forward" : "back"];
  const inFlow = (p: string) => ORDER.includes(p) || SIDE.has(p);
  // Home to Home-adjacent screens is everyday navigation, not the flow: no transition.
  if (from === "/feed" && !ORDER.includes(to)) return false;
  return inFlow(from) && inFlow(to) ? ["fade"] : false;
}
