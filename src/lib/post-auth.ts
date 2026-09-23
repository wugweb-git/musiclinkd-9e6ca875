import { useEffect, useState } from "react";

/** Where a signed-in user lands. Every sign-in path returns to `/`, and the splash decides. */
export type PostAuthTarget = "/discover" | "/onboarding" | "/onboarding/resume";

type OnboardingState = {
  onboarding_complete?: boolean | null;
  onboarding_step?: string | null;
  onboarding_draft?: unknown;
} | null;

export function postAuthTarget(profile: OnboardingState): PostAuthTarget {
  // No row at all = genuinely the first sign-in, before the signup trigger has (or ever will)
  // create a profile — the only case that still forces onboarding.
  if (!profile) return "/onboarding";
  // Any existing profile row — complete or not — is a returning user: land on Discover,
  // every time. Onboarding used to re-gate every sign-in until the profile was finished, which is
  // what sent a real returning user back to a "Welcome back, 0 of 7 completed" resume screen
  // instead of into the app (owner call, 23 Sep). Finishing a profile is now something a user
  // opts into from inside the app (e.g. a CTA to /onboarding/resume), not a forced redirect.
  return "/discover";
}

export type ProviderState = "checking" | "on" | "off";

/**
 * Whether phone (SMS) sign-in is switched on for this project. Read from the auth server's public
 * settings, so turning the provider on needs no code change. Unknown counts as available: the phone
 * screen reports the server's own error if a request fails.
 */
export function usePhoneSignIn(): ProviderState {
  const [state, setState] = useState<ProviderState>("checking");

  useEffect(() => {
    const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
    if (!url || !key) return;
    let active = true;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { external?: { phone?: boolean } } | null) => {
        if (active && s?.external) setState(s.external.phone ? "on" : "off");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return state;
}
