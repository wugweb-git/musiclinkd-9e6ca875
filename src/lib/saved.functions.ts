import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * The /saved screen's shortlist (public.saved_items, 20260918120000_saved_items.sql). Owner-only:
 * every function here reads or writes only the signed-in user's own rows.
 */

export type SavedTargetType = "talent" | "band" | "studio" | "business" | "event";

export type SavedCard = {
  id: string;
  targetType: SavedTargetType;
  targetId: string;
  savedAt: string;
  name: string;
  subtitle: string | null;
  photo: string | null;
};

const targetType = z.enum(["talent", "band", "studio", "business", "event"]);

// The generated types predate this table.
const savedTable = (client: unknown) =>
  (client as SupabaseClient).from("saved_items" as never) as unknown as ReturnType<
    SupabaseClient["from"]
  >;

/** Just the ids for one type — cheap enough to call from any listing screen's own loader. */
export const listMySavedIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ targetType }).parse(d))
  .handler(async ({ context, data }): Promise<string[]> => {
    const { data: rows, error } = await savedTable(context.supabase)
      .select("target_id")
      .eq("user_id", context.userId)
      .eq("target_type", data.targetType);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as { target_id: string }[]).map((r) => r.target_id);
  });

export const saveTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ targetType, targetId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await savedTable(context.supabase).upsert(
      {
        user_id: context.userId,
        target_type: data.targetType,
        target_id: data.targetId,
      } as never,
      { onConflict: "user_id,target_type,target_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unsaveTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ targetType, targetId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await savedTable(context.supabase)
      .delete()
      .eq("user_id", context.userId)
      .eq("target_type", data.targetType)
      .eq("target_id", data.targetId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type SavedRow = { id: string; target_type: SavedTargetType; target_id: string; created_at: string };

/** Every saved item, grouped by type, with just enough to render a row — one call for the screen. */
export const listMySaved = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Record<SavedTargetType, SavedCard[]>> => {
    const empty: Record<SavedTargetType, SavedCard[]> = {
      talent: [],
      band: [],
      studio: [],
      business: [],
      event: [],
    };
    const { data: saved, error } = await savedTable(context.supabase)
      .select("id, target_type, target_id, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (saved ?? []) as SavedRow[];
    if (!rows.length) return empty;

    const idsOf = (t: SavedTargetType) => rows.filter((r) => r.target_type === t).map((r) => r.target_id);
    const savedAtOf = (t: SavedTargetType, id: string) =>
      rows.find((r) => r.target_type === t && r.target_id === id)!.created_at;
    const cardIdOf = (t: SavedTargetType, id: string) =>
      rows.find((r) => r.target_type === t && r.target_id === id)!.id;

    const talentIds = idsOf("talent");
    const bandIds = idsOf("band");
    const studioIds = idsOf("studio");
    const businessIds = idsOf("business");
    const eventIds = idsOf("event");

    const [talentRows, bandRows, studioRows, businessRows, eventRows] = await Promise.all([
      talentIds.length
        ? context.supabase
            .from("profiles")
            .select("id, display_name, username, headline, avatar_url")
            .in("id", talentIds)
        : Promise.resolve({ data: [], error: null }),
      bandIds.length
        ? context.supabase
            .from("bands" as never)
            .select("id, name, city, avatar_url")
            .in("id", bandIds)
        : Promise.resolve({ data: [], error: null }),
      studioIds.length
        ? context.supabase
            .from("studios" as never)
            .select("id, name, location, slug")
            .in("id", studioIds)
        : Promise.resolve({ data: [], error: null }),
      businessIds.length
        ? context.supabase
            .from("profiles")
            .select("id, display_name, username, headline, avatar_url")
            .in("id", businessIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length
        ? context.supabase
            .from("profile_events" as never)
            .select("id, title, event_date, venue_name")
            .in("id", eventIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    for (const r of [talentRows, bandRows, studioRows, businessRows, eventRows]) {
      if (r.error) throw new Error(r.error.message);
    }

    return {
      talent: (talentRows.data as never[]).map((p: never) => {
        const row = p as { id: string; display_name: string | null; username: string | null; headline: string | null; avatar_url: string | null };
        return {
          id: cardIdOf("talent", row.id),
          targetType: "talent",
          targetId: row.id,
          savedAt: savedAtOf("talent", row.id),
          name: row.display_name ?? row.username ?? "Unnamed",
          subtitle: row.headline,
          photo: row.avatar_url,
        };
      }),
      band: (bandRows.data as never[]).map((b: never) => {
        const row = b as { id: string; name: string; city: string | null; avatar_url: string | null };
        return {
          id: cardIdOf("band", row.id),
          targetType: "band",
          targetId: row.id,
          savedAt: savedAtOf("band", row.id),
          name: row.name,
          subtitle: row.city,
          photo: row.avatar_url,
        };
      }),
      studio: (studioRows.data as never[]).map((s: never) => {
        const row = s as { id: string; name: string; location: string | null };
        return {
          id: cardIdOf("studio", row.id),
          targetType: "studio",
          targetId: row.id,
          savedAt: savedAtOf("studio", row.id),
          name: row.name,
          subtitle: row.location,
          photo: null,
        };
      }),
      business: (businessRows.data as never[]).map((p: never) => {
        const row = p as { id: string; display_name: string | null; username: string | null; headline: string | null; avatar_url: string | null };
        return {
          id: cardIdOf("business", row.id),
          targetType: "business",
          targetId: row.id,
          savedAt: savedAtOf("business", row.id),
          name: row.display_name ?? row.username ?? "Unnamed",
          subtitle: row.headline,
          photo: row.avatar_url,
        };
      }),
      event: (eventRows.data as never[]).map((e: never) => {
        const row = e as { id: string; title: string; event_date: string | null; venue_name: string | null };
        return {
          id: cardIdOf("event", row.id),
          targetType: "event",
          targetId: row.id,
          savedAt: savedAtOf("event", row.id),
          name: row.title,
          subtitle: [row.event_date, row.venue_name].filter(Boolean).join(" · ") || null,
          photo: null,
        };
      }),
    };
  });
