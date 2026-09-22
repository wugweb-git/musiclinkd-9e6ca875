import { useSyncExternalStore } from "react";

/**
 * The one `prefers-reduced-motion` read for the whole app. Defaults to `true` on the server/first
 * paint (SSR has no `matchMedia`) — the same fail-safe the charts' own copy of this hook already
 * used, generalized here so every consumer shares one subscription instead of re-querying
 * `matchMedia` per component.
 */
function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function snapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
