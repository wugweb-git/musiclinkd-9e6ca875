import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/native-auth";

/*
 * Android's back button, and the one stack of things it can close.
 *
 * Back-to-dismiss is the universal Android reflex, and until now nothing in the app answered it:
 * the sheet listened for Escape only, which a WebView never synthesises from the hardware button.
 * Pressing back over an open drawer popped history instead — the user left the screen and lost
 * whatever they had typed into the sheet. With every "+ new" now a drawer, that is most of the app.
 *
 * Every overlay pushes its close function here while it is open, so the newest one is last. Back
 * closes the top of the stack; only when the stack is empty does it reach navigation.
 *
 * A stack, not a single handler, because overlays genuinely nest — a picker sheet opens over the
 * create-listing sheet — and back should peel them one at a time in the order they appeared.
 */
const stack: (() => void)[] = [];

/** Register an open overlay. Returns the unregister, which must run when it closes. */
export function pushDismiss(close: () => void) {
  stack.push(close);
  const web = typeof window !== "undefined" && !isNativeApp();
  // On the web (a phone browser), the back gesture is a history pop: give the overlay its own
  // history entry, so back closes it instead of leaving the screen.
  const mark = ++marks;
  if (web) {
    startWebBack();
    window.history.pushState({ ...(window.history.state ?? {}), mlSheet: mark }, "");
  }
  return () => {
    const i = stack.lastIndexOf(close);
    if (i !== -1) stack.splice(i, 1);
    // Closed by a tap, not by back: drop our entry — only if it is still the current one, so a
    // menu item that navigated is never undone.
    if (web && window.history.state?.mlSheet === mark) {
      ignoreNextPop = true;
      window.history.back();
    }
  };
}

let marks = 0;
let ignoreNextPop = false;
let webBackStarted = false;
function startWebBack() {
  if (webBackStarted) return;
  webBackStarted = true;
  window.addEventListener("popstate", () => {
    if (ignoreNextPop) {
      ignoreNextPop = false;
      return;
    }
    const top = stack.pop();
    top?.();
  });
}

/**
 * Close the topmost overlay, if there is one. Exported for the Escape key, so the keyboard and the
 * hardware button go through the same path rather than drifting apart.
 */
export function dismissTop() {
  const top = stack.pop();
  if (!top) return false;
  top();
  return true;
}

/**
 * Start answering the hardware back button. A no-op on the web, so calling it unconditionally at
 * app start is safe. Returns an unsubscribe.
 *
 * Adding a `backButton` listener replaces Capacitor's default handling outright, so this has to
 * cover the ordinary cases too: go back through history when there is history, and exit at the
 * root rather than sitting on a screen the button appears to have stopped working on.
 */
export function startBackButton() {
  if (!isNativeApp()) return () => {};

  const pending = App.addListener("backButton", ({ canGoBack }) => {
    if (dismissTop()) return;
    if (canGoBack) {
      window.history.back();
      return;
    }
    void App.exitApp();
  });

  return () => {
    void pending.then((h) => h.remove()).catch(() => {});
  };
}
