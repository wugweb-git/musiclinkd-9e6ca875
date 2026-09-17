import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Device/session management reads and revokes rows in auth.sessions directly — Supabase's own
 * session store, not a table we made up. Needs the service-role client since PostgREST doesn't
 * expose the auth schema to a user's own key. Two-step verification itself (enroll/challenge/
 * verify/unenroll) runs entirely client-side against supabase.auth.mfa — no server function needed.
 */

export type MySession = {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
};

/** The signed-in account's own active sessions, most recently active first. */
export const listMySessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MySession[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const { data, error } = await admin
      .schema("auth")
      .from("sessions")
      .select("id, created_at, updated_at, user_agent, ip")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MySession[];
  });

/** Sign a single one of the account's own sessions out. */
export const revokeMySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const { error } = await admin
      .schema("auth")
      .from("sessions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
