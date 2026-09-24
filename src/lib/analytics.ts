/*
 * Google Analytics 4, off unless two things are both true: the project has a measurement id, and
 * the person has said yes.
 *
 * Nothing loads Google's script on first paint. A measurement id arrives through
 * VITE_GA_MEASUREMENT_ID, so a build without one never reaches for the network at all, and consent
 * is this device's answer, kept on this device. Default is off: analytics that a person has not
 * agreed to is not a default anyone should inherit, and the Cookie Policy page is still empty
 * (cms_pages.legal-cookies has no body), so nothing has been disclosed to agree to yet.
 *
 * Only page paths are sent. No profile id, no username, no search text — a MusicLinkd URL can
 * carry a person's handle, so the path is stripped of anything that names somebody before it goes.
 */

const CONSENT_KEY = "ml.analytics.consent";
const measurementId = import.meta.env["VITE_GA_MEASUREMENT_ID"] as string | undefined;

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** Whether this build could report at all — a missing id is not a misconfiguration, it is "off". */
export function analyticsConfigured() {
  return Boolean(measurementId);
}

/** This device's answer. Unset counts as no. */
export function analyticsConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "yes";
  } catch {
    // Private window, or storage blocked: treat as no rather than guessing yes.
    return false;
  }
}

/**
 * Record the answer. Saying no after saying yes stops further reporting immediately and clears
 * Google's own cookies for this site, so the answer takes effect now rather than at next launch.
 */
export function setAnalyticsConsent(granted: boolean) {
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? "yes" : "no");
  } catch {
    /* storage may be unavailable */
  }
  if (granted) void startAnalytics();
  else stopAnalytics();
}

let started = false;

/** Load gtag.js, once, and only with an id and a yes. */
export async function startAnalytics(): Promise<void> {
  if (started || !measurementId || !analyticsConsent()) return;
  started = true;

  window.dataLayer = window.dataLayer ?? [];
  const gtag: Gtag = (...args) => {
    window.dataLayer?.push(args);
  };
  window.gtag = gtag;

  await new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    // A blocked script is an ordinary outcome, not an error worth surfacing to anyone.
    s.onload = () => resolve();
    s.onerror = () => {
      started = false;
      resolve();
    };
    document.head.appendChild(s);
  });

  gtag("js", new Date());
  // send_page_view off: the router reports paths itself, so a client-side route change counts
  // once rather than the first screen counting twice and the rest not at all.
  gtag("config", measurementId, { send_page_view: false, anonymize_ip: true });
}

/** Stop reporting and drop Google's cookies for this site. */
export function stopAnalytics() {
  started = false;
  if (window.gtag && measurementId) {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim() ?? "";
    if (name === "_ga" || name.startsWith("_ga_")) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}

/**
 * A path with anything identifying taken out: `/@meher.kaur` and `/profile/meher.kaur` both report
 * as the shape of the page, never as the person on it. Query strings are dropped whole, because a
 * search term is the person's own words.
 */
export function safePath(pathname: string): string {
  return pathname
    .replace(/^\/@[^/]+/, "/@:handle")
    .replace(/^\/profile\/(?!edit$|insights$)[^/]+/, "/profile/:username")
    .replace(
      /^\/(bands|collab|business|opportunities|portfolio|services|booking|marketplace\/l|marketplace\/seller|conversation|reviews)\/[^/]+/,
      "/$1/:id",
    );
}

/** One page view, already stripped. Silent when analytics is off. */
export function trackPageview(pathname: string) {
  if (!started || !window.gtag || !measurementId) return;
  window.gtag("event", "page_view", {
    page_path: safePath(pathname),
    page_location: `${window.location.origin}${safePath(pathname)}`,
  });
}
