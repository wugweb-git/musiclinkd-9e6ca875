import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/*
 * One session, shared by every caller.
 *
 * This used to be a plain hook holding its own state: each of the 91 call sites ran its own
 * `getSession()` and opened its own `onAuthStateChange` subscription, so a single sign-in produced
 * 91 round trips' worth of listeners and 91 separate re-renders with 91 new object identities —
 * and `BottomNav` is one of them, in the shell that stays mounted across every navigation.
 *
 * A module-level store rather than a React context, deliberately: the hook's signature does not
 * change, nothing needs a provider above it, and it keeps working in Storybook and in any tree
 * rendered outside the app root. The subscription is opened on the first subscriber and closed
 * when the last one leaves.
 *
 * The snapshot object is cached and only replaced when the session actually changes, because
 * `useSyncExternalStore` compares snapshots by identity — returning a fresh object each read
 * would loop forever.
 */
type AuthSnapshot = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signedIn: boolean;
};

const LOADING: AuthSnapshot = { session: null, user: null, loading: true, signedIn: false };

let snapshot: AuthSnapshot = LOADING;
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | null = null;

function publish(session: Session | null) {
  const user = session?.user ?? null;
  // Same session, same object: skip the render entirely.
  if (!snapshot.loading && snapshot.session?.access_token === session?.access_token) return;
  snapshot = { session, user, loading: false, signedIn: Boolean(user) };
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void supabase.auth.getSession().then(({ data }) => publish(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => publish(next));
    unsubscribe = () => data.subscription.unsubscribe();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      unsubscribe?.();
      unsubscribe = null;
      // The next mount re-reads the session rather than trusting a snapshot from a torn-down tree.
      snapshot = LOADING;
    }
  };
}

const getSnapshot = () => snapshot;
/* On the server there is no session to read, and every consumer already handles `loading`. */
const getServerSnapshot = () => LOADING;

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
