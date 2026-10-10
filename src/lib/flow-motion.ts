import { useEffect, useState } from "react";
import type { ParsedLocation } from "@tanstack/react-router";
import { steps } from "@/data/onboarding";

/**
 * Page motion. The registration flow (splash → auth → onboarding → Discover) follows the order below;
 * everything else follows `appTransition`. In the flow, the order below is the
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
  ...steps.map((s) => `/setup/${s.id}`),
  // The new user's first work (`?from=onboarding`), between the last question and Review profile.
  "/portfolio",
  "/portfolio/new/$kind",
  "/portfolio/$id",
  "/onboarding/preview",
  "/onboarding/complete",
  "/onboarding/done",
];

/** One beat of the arrival choreography: block n of a screen lands n beats after the first. */
const BEAT_MS = 90;
export const beat = (n: number) => ({ animationDelay: `${n * BEAT_MS}ms` });

const played = new Set<string>();
/**
 * True the first time a screen mounts in this page load, so an arrival plays once and not again on
 * Back. The server never records a play, so its render matches the client's first one.
 */
export function useArrival(key: string) {
  const [play] = useState(() => !played.has(key));
  useEffect(() => {
    played.add(key);
  }, [key]);
  return play;
}

/** Flow screens that sit outside the linear order: they cross-fade rather than slide. */
const SIDE = new Set(["/", "/onboarding/skip", "/onboarding/resume", "/auth/forgot", "/discover"]);

const clean = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

/** The flow's name for a location: work pages collapse to their pattern inside the first-work stretch. */
const flowPath = (loc: ParsedLocation) => {
  const p = clean(loc.pathname);
  if (p.startsWith("/portfolio/new/")) return "/portfolio/new/$kind";
  const fromOnboarding = (loc.search as { from?: unknown }).from === "onboarding";
  if (fromOnboarding && /^\/portfolio\/[^/]+$/.test(p)) {
    return "/portfolio/$id";
  }
  return p;
};

const position = (loc: ParsedLocation) => ORDER.indexOf(flowPath(loc));

export function flowTransitionTypes({
  fromLocation,
  toLocation,
  pathChanged,
}: {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
  pathChanged: boolean;
}): string[] | false {
  if (!fromLocation) return false;
  // A hidden document (app in the background, a prerender) rejects startViewTransition.
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;
  const from = flowPath(fromLocation);
  const to = flowPath(toLocation);
  const a = position(fromLocation);
  const b = position(toLocation);
  // Same screen, other question: slide like a screen change. Any other same-path change: none.
  if (!pathChanged) return a >= 0 && b >= 0 && a !== b ? [b > a ? "forward" : "back"] : false;
  if (a >= 0 && b >= 0) return [b > a ? "forward" : "back"];
  const inFlow = (p: string) => ORDER.includes(p) || SIDE.has(p);
  if (inFlow(from) && inFlow(to) && !(from === "/discover" && !ORDER.includes(to))) return ["fade"];
  return appTransition(from, to);
}

const TAB_ROOTS = new Set(["/discover", "/inbox", "/marketplace", "/profile"]);

/**
 * Everyday navigation, Android style: between tabs cross-fades; into a screen pushes forward;
 * out of it (a parent path or a tab) pops back; sideways between pushed screens pushes.
 */
function appTransition(from: string, to: string): string[] {
  if (TAB_ROOTS.has(from) && TAB_ROOTS.has(to)) return ["fade"];
  if (TAB_ROOTS.has(to) || from.startsWith(`${to}/`)) return ["back"];
  return ["forward"];
}
