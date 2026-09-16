import { useSyncExternalStore } from "react";
function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function snapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function useChartReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
