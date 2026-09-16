---
doc: SPEC-platform-android-pwa
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: not yet checked against the app repo (manifest.json, index.html viewport meta,
  service worker) — this documents the stated requirement, not what's currently implemented
folder: specs
originally: new
---

# Issue 4 — platform target: app.musiclinkd.com, Android, PWA now / Capacitor later

## Domain

`app.musiclinkd.com` — current and final. Whatever manifest/service-worker scope, canonical
URLs, and OAuth redirect URIs (relevant to Feature 1's Spotify connect) get set up should target
this domain, not a staging or preview subdomain.

## Platform sequence

1. **Now:** PWA, Android-first.
2. **Later:** wrapped with Capacitor for Android (native shell around the same web app).

This matters for what "full-screen and gesture access" can actually mean at each stage — see
below.

## Full-screen / edge-to-edge

"Full screen access with padding on top and bottom" = edge-to-edge display, content drawn behind
the status bar and the gesture nav bar, with safe-area padding so nothing sits under them.
Concretely, for the PWA stage:

- `manifest.json`: `"display": "standalone"` (or `"fullscreen"` if the status bar itself should
  be hidden — standalone is the usual choice, keeps the status bar visible but out of the app's
  own chrome).
- `viewport-fit=cover` in the viewport meta tag — required before `env(safe-area-inset-*)` does
  anything on Android Chrome.
- Top and bottom safe-area padding via `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`
  in CSS, applied to whatever the outermost app shell/layout container is — not per-screen,
  or it'll be inconsistent.
- `theme-color` in the manifest (and a matching `<meta name="theme-color">`) so the status bar
  area matches the app's own background instead of defaulting to browser chrome color.

## Android gesture navigation

Modern Android uses edge swipe gestures for back/home/recents, including predictive back
(swipe-to-preview, Android 13+). This needs an explicit decision, not just "enable it":

- Anything MusicLinkd does with edge swipes of its own (e.g. a swipeable card stack, a
  side-drawer opened by an edge swipe) **will conflict** with the system's back gesture unless
  it's deliberately scoped away from the gesture-capture zone at the screen edges. Flag which
  MusicLinkd screens (if any) use edge swipes — that's the actual conflict surface, not a
  general "turn gestures on" toggle.
- On the web/PWA stage, gesture nav is the browser/OS's, not something the app enables — there's
  nothing to configure beyond not fighting it (see above). Real control over back-gesture
  behavior (intercepting it, custom predictive-back animations) is a **Capacitor-stage
  capability**, not available to a plain PWA.

## "Android drawers and other tools" — what's actually available at each stage

Being precise here because it changes what Claude Code can promise:

- **PWA stage (now):** access is whatever the browser exposes to a web app — standard Web APIs
  (notifications, clipboard, share sheet via the Web Share API, camera/mic via getUserMedia,
  etc.), nothing beyond that. No access to native Android system drawers (quick settings,
  notification shade content, native share targets beyond Web Share) — those aren't reachable
  from a web page regardless of manifest settings.
- **Capacitor stage (later):** this is where real native access comes in — Capacitor plugins for
  status bar control, safe-area, haptics, native share sheet, filesystem, and any native Android
  API via a custom plugin if needed. This is the stage to plan actual "Android drawer" access
  for, not the PWA stage.

## One correction — "webkit"

Android's in-app browser/WebView is **Chromium-based** (Android System WebView / Chrome), not
WebKit. WebKit is Apple's engine (Safari, iOS WKWebView). If MusicLinkd only targets Android for
now, the relevant engine to build/test against is Chromium's WebView, not WebKit — worth getting
right now since it decides which CSS/JS features and devtools apply. If iOS is on the roadmap
later, that's a separate WebKit compatibility pass when it comes up, not something to build for
today.

## What this doesn't decide

Whether `display` should be `standalone` or `fullscreen`, which specific screens (if any) use
edge swipes that need gesture-conflict handling, and the Capacitor migration timeline/plugin
list — those are implementation calls for Claude Code once this is picked up, and product calls
for Vedanshu where they affect UX (e.g. status bar hidden vs visible).
