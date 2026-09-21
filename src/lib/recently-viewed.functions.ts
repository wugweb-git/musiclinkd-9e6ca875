import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Recently viewed, kept with the account so every signed-in device shows the same list.
 * src/lib/device-history.ts keeps the device's own copy and merges with this one.
 * Schema: supabase/migrations/20260921240000_recently_viewed.sql.
 */

const db = (client: unknown) =>
  (client as SupabaseClient).from("recently_viewed" as never) as unknown as ReturnType<
    SupabaseClient["from"]
  >;

export type ViewRow = {
  kind: "person" | "studio" | "listing";
  handle: string;
  name: string | null;
  detail: string | null;
  avatar_url: string | null;
  viewed_at: string;
};

const view = z.object({
  kind: z.enum(["person", "studio", "listing"]),
  handle: z.string().min(1).max(200),
  name: z.string().max(200).nullable().optional(),
  detail: z.string().max(200).nullable().optional(),
  avatarUrl: z.string().max(1000).nullable().optional(),
  at: z.string().datetime({ offset: true }),
});

/** Keep one or more views (the newest time wins for each thing). */
export const recordViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ views: z.array(view).min(1).max(60) }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase).upsert(
      data.views.map((v) => ({
        profile_id: context.userId,
        kind: v.kind,
        handle: v.handle,
        name: v.name ?? null,
        detail: v.detail ?? null,
        avatar_url: v.avatarUrl ?? null,
        viewed_at: v.at,
      })) as never,
      { onConflict: "profile_id,kind,handle" },
    );
    if (error) throw new Error(error.message);
    return { kept: data.views.length };
  });

export const listMyViews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ViewRow[]> => {
    const { data, error } = await db(context.supabase)
      .select("kind, handle, name, detail, avatar_url, viewed_at")
      .eq("profile_id", context.userId)
      .order("viewed_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return (data ?? []) as ViewRow[];
  });

/** Clear the list of profiles and studios, or of Market listings. */
export const clearMyViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ scope: z.enum(["pages", "listings"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const kinds = data.scope === "listings" ? ["listing"] : ["person", "studio"];
    const { error } = await db(context.supabase)
      .delete()
      .eq("profile_id", context.userId)
      .in("kind", kinds);
    if (error) throw new Error(error.message);
    return { cleared: true };
  });
