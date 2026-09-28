import { SplashScreen } from "@capacitor/splash-screen";
import { isNativeApp } from "@/lib/native-auth";

/*
 * Hide the native splash once the app has actually mounted.
 *
 * The plugin was configured natively and nothing ever called it. With the default 500ms auto-hide
 * the splash disappeared long before the page arrived — the shell loads the live site over the
 * network, so first paint waits on an SSR round trip — and the user watched a flat #ECECF1 window
 * for the rest of it. `launchAutoHide: false` now holds the brand ground until this runs.
 *
 * A no-op on the web, and it never throws: a splash that fails to hide would be a black screen,
 * so the failure path is logged and swallowed rather than allowed to reach an error boundary.
 */
export async function hideSplash() {
  if (!isNativeApp()) return;
  try {
    await SplashScreen.hide();
  } catch {
    // Nothing to hide, or the plugin is unavailable in this build.
  }
}
