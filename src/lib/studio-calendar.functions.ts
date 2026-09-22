import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";
import {
  WEEKDAYS,
  hoursLine,
  insideNotice,
  isBlackout,
  parseBlackouts,
  parseWeeklyHours,
  type BlackoutRange,
  type BusyInterval,
  type WeeklyHours,
} from "@/lib/studio-slots";

/*
 * A studio's booking calendar: its weekly hours, and the times taken or closed between two dates
 * (studio_busy(), which never says who booked or why). The owner edits the hours and closes times.
 * Before 20260921110000_studio_calendar.sql is applied every read comes back empty, so studios keep
 * the plain request flow.
 */

const db = (client: unknown) => client as unknown as SupabaseClient;
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type StudioCalendar = {
  weeklyHours: WeeklyHours;
  busy: BusyInterval[];
  /** Hours of notice the studio needs before a session; 0 for none. */
  noticeHours: number;
  /** Whole days the studio is closed. */
  blackouts: BlackoutRange[];
};

/** The notice and blackout days, or none before 20260922280000_booking_rules.sql is applied. */
async function readRules(client: SupabaseClient, studioId: string) {
  const { data, error } = await client
    .from("studios")
    .select("notice_hours, blackout_dates")
    .eq("id", studioId)
    .maybeSingle();
  const row = (error ? null : data) as { notice_hours: number; blackout_dates: unknown } | null;
  return {
    noticeHours: row?.notice_hours ?? 0,
    blackouts: parseBlackouts(row?.blackout_dates),
  };
}

/**
 * Refuses a session the studio doesn't take: on a blackout day, or starting inside its notice.
 * Shared by the request and reschedule functions, so the rule holds whatever screen sent it.
 */
export async function assertStudioTakes(
  client: SupabaseClient,
  studioId: string,
  date: string,
  startTime: string | null | undefined,
) {
  const rules = await readRules(client, studioId);
  if (isBlackout(date, rules.blackouts)) throw new Error("The studio is closed that day.");
  if (insideNotice(date, startTime, rules.noticeHours))
    throw new Error(
      `The studio needs ${noticeLabel(rules.noticeHours)} notice. Pick a later time.`,
    );
}

/** 24 → "24 hours", 72 → "3 days". */
export function noticeLabel(hours: number) {
  if (hours % 24 === 0 && hours >= 48) return `${hours / 24} days`;
  return `${hours} hours`;
}

/** Postgres "2026-09-25 18:00:00" as "2026-09-25T18:00:00", which every browser parses as local. */
const local = (ts: string) => ts.replace(" ", "T").slice(0, 19);

/** The weekly hours, and with a date range the busy times inside it. Public. */
export const getStudioCalendar = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({ slug: z.string().min(1).max(120), from: DATE.optional(), to: DATE.optional() })
      .parse(d),
  )
  .handler(async ({ data }): Promise<StudioCalendar> => {
    const client = db(await anonClient());
    const { data: row, error } = await client
      .from("studios")
      .select("id, weekly_hours")
      .eq("slug", data.slug)
      .maybeSingle();
    // No column yet (migration not applied) or no studio: no calendar.
    if (error || !row) return { weeklyHours: {}, busy: [], noticeHours: 0, blackouts: [] };
    const { id, weekly_hours } = row as { id: string; weekly_hours: unknown };
    const weeklyHours = parseWeeklyHours(weekly_hours);
    const rules = await readRules(client, id);
    if (!data.from || !data.to) return { weeklyHours, busy: [], ...rules };

    const { data: busy, error: busyError } = await client.rpc("studio_busy", {
      p_studio: id,
      p_from: data.from,
      p_to: data.to,
    });
    // Without the busy times a slot could look free when it is not, so a failed read is an error.
    if (busyError) throw new Error(busyError.message);
    return {
      weeklyHours,
      ...rules,
      busy: ((busy ?? []) as { room_id: string | null; starts_at: string; ends_at: string }[]).map(
        (b) => ({ roomId: b.room_id, start: local(b.starts_at), end: local(b.ends_at) }),
      ),
    };
  });

const SPAN = z.object({
  open: z.string().regex(/^([01]\d|2[0-4]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-4]):[0-5]\d$/),
});

/** The owner's weekly hours. Written through the "Owners write their own" policy on studios. */
export const updateMyWeeklyHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        weeklyHours: z.object(
          Object.fromEntries(WEEKDAYS.map((day) => [day, z.array(SPAN).max(4).optional()])),
        ),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    // One set of hours: the calendar's weekly hours also write the line the studio page and the
    // business profile show.
    const weekly = parseWeeklyHours(data.weeklyHours);
    const line = hoursLine(weekly);
    const { error } = await db(context.supabase)
      .from("studios")
      .update({ weekly_hours: weekly, operating_hours: line } as never)
      .eq("owner_profile_id", context.userId);
    if (error) throw new Error(error.message);
    const { error: businessError } = await db(context.supabase)
      .from("profile_business")
      .update({ operating_hours: line } as never)
      .eq("profile_id", context.userId);
    if (businessError) throw new Error(businessError.message);
    return { ok: true };
  });

/** The owner's notice and blackout days. Either may be sent alone; the other is left as it is. */
export const updateMyBookingRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        noticeHours: z.number().int().min(0).max(720).optional(),
        blackouts: z
          .array(z.object({ from: DATE, to: DATE }).refine((r) => r.from <= r.to))
          .max(100)
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const patch = {
      ...(data.noticeHours === undefined ? {} : { notice_hours: data.noticeHours }),
      ...(data.blackouts === undefined ? {} : { blackout_dates: parseBlackouts(data.blackouts) }),
    };
    const { error } = await db(context.supabase)
      .from("studios")
      .update(patch as never)
      .eq("owner_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type StudioBlock = {
  id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

/** The owner's own studio id, which every block and equipment write is scoped through. */
export async function myStudioId(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("studios")
    .select("id")
    .eq("owner_profile_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const id = (data as { id: string } | null)?.id;
  if (!id) throw new Error("You don't have a studio yet.");
  return id;
}

/** The times the owner has closed, from today on. Empty before the table exists. */
export const listMyStudioBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudioBlock[]> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    const { data, error } = await client
      .from("studio_blocks")
      .select("id, room_id, starts_at, ends_at, reason")
      .eq("studio_id", studioId)
      .gte("ends_at", new Date().toISOString().slice(0, 10))
      .order("starts_at", { ascending: true });
    if (error) return [];
    return ((data ?? []) as StudioBlock[]).map((b) => ({
      ...b,
      starts_at: local(b.starts_at),
      ends_at: local(b.ends_at),
    }));
  });

export const addMyStudioBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        roomId: z.string().uuid().nullable(),
        startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
        endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
        reason: z.string().max(200).optional(),
      })
      .refine((v) => v.endsAt > v.startsAt, "The end has to be after the start.")
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = db(context.supabase);
    const studioId = await myStudioId(client, context.userId);
    const { data: row, error } = await client
      .from("studio_blocks")
      .insert({
        studio_id: studioId,
        room_id: data.roomId,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        reason: data.reason?.trim() || null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string };
  });

export const removeMyStudioBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    // RLS keeps this to the owner's own studio.
    const { error } = await db(context.supabase).from("studio_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
