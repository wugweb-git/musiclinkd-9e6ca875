import type { CapacitorConfig } from "@capacitor/cli";

/*
 * The Android wrap.
 *
 * Capacitor normally bundles a folder of static HTML into the app. This app cannot work that way:
 * every route is server-rendered by Nitro and nothing is prerendered, so `bun run build` produces
 * assets and a server, and not one `.html` file. The shell therefore loads the live site over
 * https (`server.url`) rather than carrying a copy of it.
 *
 * What that means in practice:
 *   - the app needs a connection to start; there is no offline first paint yet
 *   - shipping a web change reaches the app the moment it is deployed, with no store release
 *   - `webDir` still has to point somewhere real, so it points at the built assets
 *
 * `appId` is permanent once the app is published to Play, and cannot be changed afterwards.
 */
const config: CapacitorConfig = {
  appId: "com.musiclinkd.app",
  appName: "MusicLinkd",
  webDir: ".output/public",
  server: {
    url: "https://app.musiclinkd.com",
    hostname: "app.musiclinkd.com",
    // https so the webview's origin matches the site's, which keeps the existing session,
    // storage and cookies working rather than starting from a capacitor:// origin.
    androidScheme: "https",
  },
  android: {
    // --background from styles.css, so the window behind the page matches the page.
    backgroundColor: "#ECECF1",
  },
  plugins: {
    SplashScreen: {
      // The same brand ground the web splash uses, so the two do not flash different colours.
      backgroundColor: "#EA4C89",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
