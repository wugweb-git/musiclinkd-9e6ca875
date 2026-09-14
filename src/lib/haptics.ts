/**
 * Light haptic feedback. Android browsers honour `navigator.vibrate`; iOS and desktop ignore it, so
 * this is progressive. When the app is wrapped with Capacitor, swap the body for @capacitor/haptics
 * here and every call site follows. Skipped when the user asks for reduced motion.
 */
export type HapticKind = "select" | "confirm" | "error";

const patterns: Record<HapticKind, number | number[]> = {
  select: 8,
  confirm: 14,
  error: [24, 48, 24],
};

export function haptic(kind: HapticKind) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    /* blocked without a user gesture — nothing to do */
  }
}
