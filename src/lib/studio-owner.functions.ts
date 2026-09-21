import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { myStudioId } from "@/lib/studio-calendar.functions";
import { removeSubjectPhotos } from "@/lib/studio-photos.functions";

/*
 * The studio owner's own edit surface for the real, flat columns that exist today:
 * studios.hourly_rate_paise, .operating_hours, .cancellation_policy, and each
 * studio_rooms.hourly_rate_paise. The weekly booking hours and closed times are edited through
 * src/lib/studio-calendar.functions.ts, and the equipment list below.
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
        /** studio_amenities slugs: what the place has (Live Room, Parking, Wi-Fi). */
        amenities: z
          .array(z.string().regex(/^[a-z0-9_]{2,40}$/))
          .max(40)
          .optional(),
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

/*
 * The studio's equipment list (studio_equipment), shown on the studio page and the business
 * profile. Categories are equipment_categories slugs from taxonomy_options; a row may have none.
 * RLS: "Owners write their own" on studio_equipment, so every write is also scoped to the owner's
 * studio here.
 */

export type StudioEquipment = {
  id: string;
  name: string;
  /** An equipment_categories slug, or an instrument's slug (the gear list Market uses). */
  category: string | null;
  quantity: number | null;
  /** Part of the booking, or at extra cost. */
  included: boolean;
};

export type MyStudioEquipment = {
  items: StudioEquipment[];
  categories: { slug: string; label: string }[];
};

const db = (client: unknown) => client as unknown as SupabaseClient;

/** The owner's equipment in page order, and the published categories in picker order. */
export const getMyStudioEquipment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyStudioEquipment> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    const [items, categories] = await Promise.all([
      client
        .from("studio_equipment")
        .select("id, name, category, quantity, included")
        .eq("studio_id", studioId)
        .order("sort_order")
        .order("name"),
      client
        .from("taxonomy_options")
        .select("slug, label")
        .eq("category_key", "equipment_categories")
        .order("sort_order"),
    ]);
    if (items.error) throw new Error(items.error.message);
    return {
      items: (items.data ?? []) as StudioEquipment[],
      // Without categories the picker offers none; the name alone still saves.
      categories: categories.error
        ? []
        : ((categories.data ?? []) as MyStudioEquipment["categories"]),
    };
  });

const EQUIPMENT = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().max(60).nullable(),
  quantity: z.number().int().min(1).max(999).nullable(),
  included: z.boolean().optional(),
});

/** Adds an item after the last one, or with an id changes that item. */
export const saveMyStudioEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => EQUIPMENT.extend({ id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    const fields = {
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      ...(data.included === undefined ? {} : { included: data.included }),
    };
    if (data.id) {
      const { error } = await client
        .from("studio_equipment")
        .update(fields as never)
        .eq("id", data.id)
        .eq("studio_id", studioId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: last } = await client
      .from("studio_equipment")
      .select("sort_order")
      .eq("studio_id", studioId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: row, error } = await client
      .from("studio_equipment")
      .insert({
        ...fields,
        studio_id: studioId,
        sort_order: ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string };
  });

export const removeMyStudioEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    const { error } = await client
      .from("studio_equipment")
      .delete()
      .eq("id", data.id)
      .eq("studio_id", studioId);
    if (error) throw new Error(error.message);
    // Its photos go with it; studio_photos has no foreign key to the item (subject_id is text).
    await removeSubjectPhotos(client, studioId, "equipment", data.id);
    return { ok: true };
  });
