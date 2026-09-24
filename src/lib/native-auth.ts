import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/*
 * Signing in from the Android wrap.
 *
 * Google refuses to run OAuth inside an embedded webview — it answers `disallowed_useragent` — and
 * the wrap is exactly that. So on a device the consent screen opens in a Chrome Custom Tab, which
 * is the real browser, and comes back to the app through a private scheme.
 *
 * The scheme is private rather than an https App Link because an App Link must be proved by an
 * assetlinks.json served from app.musiclinkd.com carrying the app's signing fingerprint, which
 * cannot exist before the app is signed. This works from the first debug build.
 *
 * On the web none of this runs: `isNativeApp()` is false in a browser, and the existing sign-in
 * path is untouched.
 */

/** Where Google returns to. This exact string has to be allowed in the auth project's redirect list. */
export const NATIVE_REDIRECT = "com.musiclinkd.app://auth/callback";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/**
 * Open Google's consent screen in a Custom Tab.
 *
 * `skipBrowserRedirect` stops supabase-js navigating the webview itself — the whole point is that
 * this leg happens outside the webview. Resolving here only means the tab opened; the session
 * arrives later, through the listener below.
 */
export async function signInWithGoogleNative(): Promise<{ error: Error | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) return { error };
  if (!data?.url) return { error: new Error("Google didn't return a sign-in link.") };
  await Browser.open({ url: data.url, presentationStyle: "popover" });
  return { error: null };
}

/**
 * Pull whatever the return carries out of the URL.
 *
 * Not `new URL()`: a private scheme is a non-special URL, and browsers disagree about whether its
 * query and fragment are parsed at all. Reading the string directly behaves the same everywhere.
 */
function partsOf(url: string): { code?: string; error?: string } {
  const query = url.includes("?") ? (url.slice(url.indexOf("?") + 1).split("#")[0] ?? "") : "";
  const read = (s: string, key: string) => new URLSearchParams(s).get(key) ?? undefined;
  const code = read(query, "code");
  // An implicit-flow project returns tokens in the fragment rather than a code. Nothing is read
  // from it here: supabase-js takes them off the URL itself, so that return falls through to the
  // session check below, which is the same answer by a shorter route.
  const error = read(query, "error_description") ?? read(query, "error");
  return { ...(code ? { code } : {}), ...(error ? { error } : {}) };
}

/**
 * Listen for the Custom Tab coming back and turn what it carries into a session.
 *
 * Returns an unsubscribe. A no-op on the web, so calling it unconditionally at app start is safe.
 */
export function listenForAuthReturn(onResult: (ok: boolean, message?: string) => void) {
  if (!isNativeApp()) return () => {};

  const pending = App.addListener("appUrlOpen", ({ url }) => {
    if (!url.startsWith("com.musiclinkd.app://")) return;
    void (async () => {
      // Close the tab first, whatever happened, so nobody is left staring at a spent consent page.
      await Browser.close().catch(() => {});
      const { code, error } = partsOf(url);
      if (error) {
        onResult(false, error);
        return;
      }
      if (code) {
        const { error: exchange } = await supabase.auth.exchangeCodeForSession(code);
        onResult(!exchange, exchange?.message);
        return;
      }
      // Implicit flow, or a return with nothing on it: trust the session the client already has.
      const { data } = await supabase.auth.getSession();
      onResult(Boolean(data.session));
    })();
  });

  return () => {
    void pending.then((h) => h.remove()).catch(() => {});
  };
}
