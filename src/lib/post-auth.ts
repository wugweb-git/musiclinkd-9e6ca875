import { useEffect, useState } from "react";

/** Where a signed-in user lands. Every sign-in path returns to `/`, and the splash decides. */
export type PostAuthTarget = "/home" | "/onboarding" | "/onboarding/resume";

type OnboardingState = {
  onboarding_complete?: boolean | null;
  onboarding_step?: string | null;
  onboarding_draft?: unknown;
} | null;

/*
 * `onboarding_draft` is NOT NULL with a default of `{}`, so every row has one from the moment the
 * signup trigger writes it. Only a draft with something in it means onboarding was started; the
 * bare `{}` read as "started" sent every new signup to Discover (owner, 4 Oct 2026).
 */
function hasAnswers(draft: unknown): boolean {
  if (draft == null) return false;
  if (typeof draft === "object") return Object.keys(draft).length > 0;
  return Boolean(draft);
}

export function postAuthTarget(profile: OnboardingState): PostAuthTarget {
  // No row at all: the first sign-in, before the signup trigger has created a profile.
  if (!profile) return "/onboarding";

  /*
   * A brand-new account: the trigger made the row, but nobody has answered a single question yet
   * — no step reached, no draft, not complete. That is a signup, and a signup goes to onboarding.
   *
   * This case was missing (owner, 29 Sep 2026: "sign up is leading me to discovery"). The rule
   * used to be "any row at all means a returning user", which is true a minute after signup and
   * false at the moment of it: the trigger writes the row *during* signup, so every new account
   * was routed straight past onboarding into Discover and never saw it.
   */
  const started = Boolean(profile.onboarding_step) || hasAnswers(profile.onboarding_draft);
  if (!profile.onboarding_complete && !started) return "/onboarding";

  /*
   * Everyone else lands on Discover, including someone who began onboarding and walked away.
   * Onboarding used to re-gate every sign-in until the profile was finished, which sent a real
   * returning user back to a "Welcome back, 0 of 7 completed" resume screen instead of into the
   * app (owner call, 23 Sep). Finishing a half-done profile stays something you opt into from
   * inside the app, via a CTA to /onboarding/resume.
   */
  // Home is the default screen (owner, 10 Oct 2026).
  return "/home";
}

/**
 * Where an emailed link (sign-up confirmation, sign-in link) returns to: the splash, which picks up
 * the session from the URL and routes it — a new account to onboarding.
 */
export function emailLinkTarget(): string {
  return `${window.location.origin}/`;
}

export type ProviderState = "checking" | "on" | "off";

/**
 * Whether a sign-in provider is switched on for this project, read from the auth server's own
 * public settings. Turning one on or off is then a project setting and needs no code change, and
 * the app never offers a way in that the server will refuse.
 *
 * Unknown counts as available: a failed request should not hide a working button, and the screen
 * behind it reports the server's own error if it comes to that.
 */
export function useAuthProvider(provider: "phone" | "google" | "linkedin_oidc"): ProviderState {
  const [state, setState] = useState<ProviderState>("checking");

  useEffect(() => {
    const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
    if (!url || !key) return;
    let active = true;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { external?: Record<string, boolean | undefined> } | null) => {
        if (active && s?.external) setState(s.external[provider] ? "on" : "off");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [provider]);

  return state;
}

/** Whether phone (SMS) sign-in is switched on. */
export function usePhoneSignIn(): ProviderState {
  return useAuthProvider("phone");
}
