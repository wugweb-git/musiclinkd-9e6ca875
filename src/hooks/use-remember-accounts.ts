import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/portfolio.functions";
import { isMyAccountBusiness } from "@/lib/profile-groups.functions";
import { rememberSession } from "@/lib/saved-accounts";

/**
 * Keeps the signed-in account on this device's account list (src/lib/saved-accounts.ts): its
 * session every time it is issued or refreshed, and its name, photo and kind once per sign-in.
 */
export function useRememberAccounts(userId: string | undefined) {
  const loadProfile = useServerFn(getMyProfile);
  const loadIsBusiness = useServerFn(isMyAccountBusiness);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) rememberSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void Promise.all([loadProfile(), loadIsBusiness()])
      .then(async ([profile, isBusiness]) => {
        const { data } = await supabase.auth.getSession();
        if (!active || !data.session || data.session.user.id !== userId) return;
        const p = profile as {
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
        } | null;
        rememberSession(data.session, {
          username: p?.username ?? null,
          name: p?.display_name ?? null,
          avatarUrl: p?.avatar_url ?? null,
          kind: isBusiness ? "business" : "talent",
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId, loadProfile, loadIsBusiness]);
}
