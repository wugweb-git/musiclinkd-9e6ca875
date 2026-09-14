import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/*
 * Username availability against the database. profiles.username is UNIQUE, and RLS hides
 * non-public profiles from other users, so the check runs through the SECURITY DEFINER function
 * public.username_available(text), which also treats your own current username as available.
 * "unknown" means the check could not run (offline, or the function is not deployed): the field
 * makes no claim either way and the profile save is the final word.
 */
export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "unknown";

const cache = new Map<string, Exclude<UsernameStatus, "idle" | "checking">>();

async function check(username: string): Promise<Exclude<UsernameStatus, "idle" | "checking">> {
  const hit = cache.get(username);
  if (hit && hit !== "unknown") return hit;
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: boolean | null; error: Error | null }>;
  const { data, error } = await rpc.call(supabase, "username_available", {
    p_username: username,
  });
  const status = error || data === null ? "unknown" : data ? "available" : "taken";
  cache.set(username, status);
  return status;
}

/** Debounced availability for a username that already passes the format rules. */
export function useUsernameAvailability(username: string, formatOk: boolean): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>("idle");

  useEffect(() => {
    if (!formatOk) {
      setStatus("idle");
      return;
    }
    const known = cache.get(username);
    if (known && known !== "unknown") {
      setStatus(known);
      return;
    }
    setStatus("checking");
    let active = true;
    const t = window.setTimeout(() => {
      check(username)
        .then((s) => active && setStatus(s))
        .catch(() => active && setStatus("unknown"));
    }, 400);
    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [username, formatOk]);

  return status;
}
