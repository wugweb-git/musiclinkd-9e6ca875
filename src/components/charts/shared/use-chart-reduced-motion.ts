import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/** Thin re-export: charts had the first `prefers-reduced-motion` hook, now generalized. */
export function useChartReducedMotion() {
  return usePrefersReducedMotion();
}
