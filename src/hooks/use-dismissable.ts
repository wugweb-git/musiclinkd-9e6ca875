import { useEffect, useRef } from "react";
import { dismissTop, pushDismiss } from "@/lib/dismiss-stack";

/**
 * One dismiss contract for every overlay: Escape on a keyboard, the hardware button on Android.
 *
 * Both go through the same stack (`src/lib/dismiss-stack.ts`), so a nested drawer peels one layer
 * at a time and the two inputs can never disagree about which overlay is on top.
 *
 * Any overlay that can be closed should call this — sheets, modals, the full-screen pickers —
 * rather than adding a second keydown listener of its own.
 */
export function useDismissable(
  open: boolean,
  onClose: () => void,
  /**
   * Pass `escape: false` when the overlay already handles Escape itself — the Radix `Dialog` does,
   * through `onEscapeKeyDown`. It still joins the stack, because Radix knows nothing about the
   * hardware button.
   */
  { escape = true }: { escape?: boolean } = {},
) {
  // Held in a ref so a caller passing a fresh arrow function each render does not re-register the
  // overlay, which would reorder the stack under a nested drawer.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const handler = () => close.current();
    const unregister = pushDismiss(handler);
    if (!escape) return unregister;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissTop();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unregister();
    };
  }, [open, escape]);
}
