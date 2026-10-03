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
      // The same ink ground the web splash uses (29ff7bb), so the two do not flash different colours.
      backgroundColor: "#0D0D0D",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      /*
       * The shell loads the live site over the network, so first paint waits on an SSR fetch.
       * With the default 500ms auto-hide the splash went away first and left a flat #ECECF1
       * window for the rest of it. The app hides the splash itself once React has mounted
       * (src/routes/__root.tsx), which is the only moment that actually means "ready".
       */
      launchAutoHide: false,
      launchShowDuration: 0,
    },
    StatusBar: {
      // The plugin was installed and never configured, so the bar kept the OS default and could
      // put light icons on the app's light ground. The page draws under it (viewport-fit=cover),
      // so the bar is transparent and its content is dark.
      style: "LIGHT",
      backgroundColor: "#00000000",
      overlaysWebView: true,
    },
  },
};

export default config;
