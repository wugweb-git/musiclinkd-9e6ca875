import { supabase } from "@/integrations/supabase/client";

/*
 * Remember me, on the login screen only (owner, 4 Oct 2026). Checked — the default — keeps today's
 * behaviour: the session persists and the account joins "Continue as". Unchecked, the sign-in lasts
 * until the browser or app is closed.
 *
 * The Supabase client (src/integrations/supabase/client.ts) is generated and always persists the
 * session, so an unchecked sign-in is marked instead: a flag in localStorage, and a marker in
 * sessionStorage, which the browser clears when it closes. Opening the app with the flag but no
 * marker means it was closed since, and the session is signed out on this device before anything
 * reads it.
 */
const FORGET_KEY = "ml:forget-on-close";
const ALIVE_KEY = "ml:session-alive";

export function setRememberMe(remember: boolean) {
  try {
    if (remember) {
      localStorage.removeItem(FORGET_KEY);
      sessionStorage.removeItem(ALIVE_KEY);
    } else {
      localStorage.setItem(FORGET_KEY, "1");
      sessionStorage.setItem(ALIVE_KEY, "1");
    }
  } catch {
    // Storage blocked: the sign-in simply persists, as it did before this option existed.
  }
}

/** This sign-in should not be kept: no "Continue as" entry for it. */
export function forgetsOnClose(): boolean {
  try {
    return localStorage.getItem(FORGET_KEY) === "1";
  } catch {
    return false;
  }
}

/** Signs out a "don't remember me" session left from before the browser or app was closed. */
export async function endSessionIfClosed(): Promise<void> {
  try {
    if (!forgetsOnClose() || sessionStorage.getItem(ALIVE_KEY) === "1") return;
    localStorage.removeItem(FORGET_KEY);
  } catch {
    return;
  }
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
}
