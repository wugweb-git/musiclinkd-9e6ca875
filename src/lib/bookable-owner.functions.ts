import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureMyBookableId } from "@/lib/bookable-calendar.functions";
import { AMENITY, removeSubjectPhotos } from "@/lib/bookable-photos.functions";

/*
 * The owner's own edit surface for the bookable's flat columns: hourly_rate_paise,
 * operating_hours, cancellation_policy, add_ons. There are no rooms (owner, 3 Oct 2026:
 * people book a service). The weekly booking hours and closed times are edited through
 * src/lib/bookable-calendar.functions.ts, and the equipment list below.
 * RLS: "Owners write their own" on bookables (20260914180000_catalog.sql).
 */

export type MyBookable = {
  id: string;
  slug: string;
  name: string;
  hourly_rate_paise: number | null;
  operating_hours: string | null;
  cancellation_policy: string | null;
  /** bookables.add_ons — extras a session can have, shown on /booking/$id. */
  add_ons: BookableAddOnRow[];
};

/** One stored add-on. `unit` "hour" is charged per hour, anything else per that unit. */
export type BookableAddOnRow = {
  name: string;
  price_paise: number | null;
  unit: string | null;
  description?: string | null;
  available?: boolean;
  quantity?: boolean;
};

export const getMyBookable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyBookable | null> => {
    const { data, error } = await context.supabase
      .from("bookables" as never)
      .select("id, slug, name, hourly_rate_paise, operating_hours, cancellation_policy, add_ons")
      .eq("owner_profile_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as unknown as MyBookable;
    return { ...row, add_ons: Array.isArray(row.add_ons) ? row.add_ons : [] };
  });

const PAISE = z.number().int().min(0).max(100_000_000).nullable();

/** The studio's add-ons, replacing the stored list. */
export const updateMyBookableAddOns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        addOns: z
          .array(
            z
              .object({
                name: z.string().trim().min(1).max(120),
                price_paise: PAISE,
                unit: z.string().trim().max(30).nullable(),
              })
              .passthrough(),
          )
          .max(40),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await db(context.supabase)
      .from("bookables")
      .update({ add_ons: data.addOns } as never)
      .eq("owner_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMyBookable = createServerFn({ method: "POST" })
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
    // A business with no bookable yet gets one on its first save; an update that matched no row
    // used to report success.
    const id = await ensureMyBookableId(db(context.supabase), context.userId);
    const { data: rows, error } = await context.supabase
      .from("bookables" as never)
      .update(patch as never)
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("That didn't save. Try again.");
    return { ok: true };
  });

/*
 * What the business has (profile_business.amenities), for every business type (owner, 10 Oct
 * 2026): taxonomy amenities slugs, or labels the business typed itself. Replaces the stored list.
 */
export const updateMyAmenities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ amenities: z.array(AMENITY).max(40) }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const amenities = [...new Set(data.amenities)];
    const { data: rows, error } = await db(context.supabase)
      .from("profile_business")
      .update({ amenities } as never)
      .eq("profile_id", context.userId)
      .select("profile_id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("Only a business account can add amenities.");
    return { ok: true };
  });

/*
 * The business's equipment list (bookable_equipment), shown on its profile and booking page.
 * Every row belongs to the business by profile_id, whatever its type; no bookable is needed
 * (owner, 10 Oct 2026). A type is a Production tools slug: equipment_categories (hardware) or
 * daw_tools (software); a row may have none. RLS: "The business writes its own", so every write is
 * also scoped to the signed-in business here.
 */

export type BookableEquipment = {
  id: string;
  name: string;
  /** An equipment_categories or daw_tools slug (older rows may hold an instrument's slug). */
  category: string | null;
  quantity: number | null;
  /** Part of the booking, or at extra cost. */
  included: boolean;
};

export type MyBookableEquipment = {
  items: BookableEquipment[];
};

const db = (client: unknown) => client as unknown as SupabaseClient;

/** The signed-in business's equipment in page order. */
export const getMyBookableEquipment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyBookableEquipment> => {
    const { data, error } = await db(context.supabase)
      .from("bookable_equipment")
      .select("id, name, category, quantity, included")
      .eq("profile_id", context.userId)
      .order("sort_order")
      .order("name");
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as BookableEquipment[] };
  });

const EQUIPMENT = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().max(60).nullable(),
  quantity: z.number().int().min(1).max(999).nullable(),
  included: z.boolean().optional(),
});

/** Adds an item after the last one, or with an id changes that item. */
export const saveMyBookableEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => EQUIPMENT.extend({ id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = db(context.supabase);
    const me = context.userId;
    const fields = {
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      ...(data.included === undefined ? {} : { included: data.included }),
    };
    if (data.id) {
      const { data: rows, error } = await client
        .from("bookable_equipment")
        .update(fields as never)
        .eq("id", data.id)
        .eq("profile_id", me)
        .select("id");
      if (error) throw new Error(error.message);
      if (!rows?.length) throw new Error("That didn't save. Try again.");
      return { id: data.id };
    }
    const { data: business } = await client
      .from("profile_business")
      .select("profile_id")
      .eq("profile_id", me)
      .maybeSingle();
    if (!business) throw new Error("Only a business account can add equipment.");
    const { data: last } = await client
      .from("bookable_equipment")
      .select("sort_order")
      .eq("profile_id", me)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: row, error } = await client
      .from("bookable_equipment")
      .insert({
        ...fields,
        profile_id: me,
        sort_order: ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string };
  });

export const removeMyBookableEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = db(context.supabase);
    const { error } = await client
      .from("bookable_equipment")
      .delete()
      .eq("id", data.id)
      .eq("profile_id", context.userId);
    if (error) throw new Error(error.message);
    // Its photos go with it; bookable_photos has no foreign key to the item (subject_id is text).
    await removeSubjectPhotos(client, context.userId, "equipment", data.id);
    return { ok: true };
  });
