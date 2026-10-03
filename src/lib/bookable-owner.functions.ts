import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ensureMyBookableId,
  myBookableId,
  myBookableIdOrNull,
} from "@/lib/bookable-calendar.functions";
import { removeSubjectPhotos } from "@/lib/bookable-photos.functions";

/*
 * The owner's own edit surface for the bookable's flat columns: hourly_rate_paise,
 * operating_hours, cancellation_policy, add_ons, amenities. There are no rooms (owner, 3 Oct 2026:
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
        /** amenities slugs: what the place has (Live Room, Parking, Wi-Fi). */
        amenities: z
          .array(z.string().regex(/^[a-z0-9_]{2,40}$/))
          .max(40)
          .optional(),
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
 * The studio's equipment list (bookable_equipment), shown on the studio page and the business
 * profile. Categories are equipment_categories slugs from taxonomy_options; a row may have none.
 * RLS: "Owners write their own" on bookable_equipment, so every write is also scoped to the owner's
 * studio here.
 */

export type BookableEquipment = {
  id: string;
  name: string;
  /** An equipment_categories slug, or an instrument's slug (the gear list Market uses). */
  category: string | null;
  quantity: number | null;
  /** Part of the booking, or at extra cost. */
  included: boolean;
};

export type MyBookableEquipment = {
  items: BookableEquipment[];
  categories: { slug: string; label: string }[];
};

const db = (client: unknown) => client as unknown as SupabaseClient;

/** The owner's equipment in page order, and the published categories in picker order. */
export const getMyBookableEquipment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyBookableEquipment> => {
    const client = db(context.supabase);
    // No bookable yet: no items, but still the categories to pick from for the first one.
    const studioId = await myBookableIdOrNull(client, context.userId);
    const [items, categories] = await Promise.all([
      studioId
        ? client
            .from("bookable_equipment")
            .select("id, name, category, quantity, included")
            .eq("bookable_id", studioId)
            .order("sort_order")
            .order("name")
        : Promise.resolve({ data: [], error: null }),
      client
        .from("taxonomy_options")
        .select("slug, label")
        .eq("category_key", "equipment_categories")
        .order("sort_order"),
    ]);
    if (items.error) throw new Error(items.error.message);
    return {
      items: (items.data ?? []) as BookableEquipment[],
      // Without categories the picker offers none; the name alone still saves.
      categories: categories.error
        ? []
        : ((categories.data ?? []) as MyBookableEquipment["categories"]),
    };
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
    const studioId = await ensureMyBookableId(client, context.userId);
    const fields = {
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      ...(data.included === undefined ? {} : { included: data.included }),
    };
    if (data.id) {
      const { error } = await client
        .from("bookable_equipment")
        .update(fields as never)
        .eq("id", data.id)
        .eq("bookable_id", studioId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: last } = await client
      .from("bookable_equipment")
      .select("sort_order")
      .eq("bookable_id", studioId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: row, error } = await client
      .from("bookable_equipment")
      .insert({
        ...fields,
        bookable_id: studioId,
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
    const studioId = await myBookableId(client, context.userId);
    const { error } = await client
      .from("bookable_equipment")
      .delete()
      .eq("id", data.id)
      .eq("bookable_id", studioId);
    if (error) throw new Error(error.message);
    // Its photos go with it; bookable_photos has no foreign key to the item (subject_id is text).
    await removeSubjectPhotos(client, studioId, "equipment", data.id);
    return { ok: true };
  });
