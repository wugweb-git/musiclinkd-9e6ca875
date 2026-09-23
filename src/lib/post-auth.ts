import { useEffect, useState } from "react";

/** Where a signed-in user lands. Every sign-in path returns to `/`, and the splash decides. */
export type PostAuthTarget = "/discover" | "/onboarding" | "/onboarding/resume";

type OnboardingState = {
  onboarding_complete?: boolean | null;
  onboarding_step?: string | null;
  onboarding_draft?: unknown;
} | null;

export function postAuthTarget(profile: OnboardingState): PostAuthTarget {
  if (profile?.onboarding_complete) return "/discover";
  const draft = profile?.onboarding_draft;
  const started =
    Boolean(profile?.onboarding_step) ||
    (typeof draft === "object" && draft !== null && Object.keys(draft).length > 0);
  return started ? "/onboarding/resume" : "/onboarding";
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
