import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Where a push can reach someone: the Firebase Cloud Messaging registration token for each device
 * they are signed in on (public.push_tokens). One row per device, keyed by the token itself.
 *
 * The token is not a secret the way a password is, but it is an address for a specific handset, so
 * the table is owner-only and these are the only ways in or out of it.
 */

/**
 * Register this device against the signed-in account. Called on every launch, because FCM reissues
 * a token whenever it likes — the same device coming back is an upsert on the token, never a
 * second row, and the token moving to a different account reassigns it rather than leaving the
 * previous owner addressable on a handset that is no longer theirs.
 */
export const saveMyPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().trim().min(16).max(4096),
        platform: z.enum(["android", "ios", "web"]).default("android"),
        device: z.string().trim().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client.from("push_tokens").upsert(
      {
        profile_id: context.userId,
        token: data.token,
        platform: data.platform,
        ...(data.device ? { device: data.device } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Stop this device receiving pushes — signing out, or turning notifications off. */
export const removeMyPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().trim().min(16).max(4096) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client.from("push_tokens").delete().eq("token", data.token);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
