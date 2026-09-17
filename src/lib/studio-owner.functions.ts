import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * The studio owner's own edit surface for the real, flat columns that exist today:
 * studios.hourly_rate_paise, .operating_hours, .cancellation_policy, and each
 * studio_rooms.hourly_rate_paise. No tiers, add-ons or per-day schedule exist yet — those need
 * new schema, so the screens that used to show them only edit what's real.
 * RLS: "Owners write their own" on both studios and studio_rooms (20260914180000_catalog.sql).
 */

export type MyStudio = {
  id: string;
  slug: string;
  name: string;
  hourly_rate_paise: number | null;
  operating_hours: string | null;
  cancellation_policy: string | null;
  rooms: { id: string; name: string; hourly_rate_paise: number | null }[];
};

export const getMyStudio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyStudio | null> => {
    const { data, error } = await context.supabase
      .from("studios" as never)
      .select(
        "id, slug, name, hourly_rate_paise, operating_hours, cancellation_policy, rooms:studio_rooms(id, name, hourly_rate_paise)",
      )
      .eq("owner_profile_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as unknown as MyStudio | null;
  });

export const updateMyStudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        hourly_rate_paise: z.number().int().min(0).optional().nullable(),
        operating_hours: z.string().max(500).optional().nullable(),
        cancellation_policy: z.string().max(2000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    const { error } = await context.supabase
      .from("studios" as never)
      .update(patch as never)
      .eq("owner_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateStudioRoomRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ roomId: z.string().uuid(), hourly_rate_paise: z.number().int().min(0) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    // studio_rooms has no owner column of its own — scope the write through the owner's studio.
    const { data: studio, error: studioError } = await context.supabase
      .from("studios" as never)
      .select("id")
      .eq("owner_profile_id", context.userId)
      .maybeSingle();
    if (studioError) throw new Error(studioError.message);
    const studioId = (studio as { id: string } | null)?.id;
    if (!studioId) throw new Error("You don't have a studio yet.");
    const { error } = await context.supabase
      .from("studio_rooms" as never)
      .update({ hourly_rate_paise: data.hourly_rate_paise } as never)
      .eq("id", data.roomId)
      .eq("studio_id", studioId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
