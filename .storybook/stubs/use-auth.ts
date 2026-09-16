// Storybook-only stand-in for "@/hooks/use-auth" (aliased in .storybook/vite.config.ts).
//
// The real hook calls supabase.auth.getSession() on mount, a live network request against
// the production Supabase project — unnecessary latency for a component story, and it makes
// a story's rendered state depend on whatever session happens to be cached in this browser.
// Every story renders signed-out, deterministically, with no network call.
export function useAuth() {
  return { session: null, user: null, loading: false, signedIn: false };
}
