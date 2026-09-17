import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Booking requests: someone asks a studio for a room at a time, the studio answers. No money is
 * involved — MusicLinkd takes no payments, so the two of them settle that between themselves.
 * Schema: supabase/migrations/20260918100000_bookings.sql
 */

/** The generated types cover two tables; every other table is read through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

export type BookingStatus =
  "requested" | "reviewing" | "confirmed" | "declined" | "cancelled" | "completed";

export type BookingRequest = {
  id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  hours: number | null;
  people: number | null;
  purpose: string | null;
  notes: string | null;
  reply: string | null;
  status: BookingStatus;
  created_at: string;
  studio: { id: string; slug: string; name: string; location: string | null } | null;
  room: { id: string; name: string } | null;
  requester: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

const SELECT = `id, session_date, start_time, end_time, hours, people, purpose, notes, reply, status, created_at,
  studio:studios(id, slug, name, location),
  room:studio_rooms(id, name),
  requester:profiles!booking_requests_requester_profile_id_fkey(id, username, display_name, avatar_url)`;

/** Ask a studio for a session. The studio is addressed by slug, the way its screens do. */
export const requestBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        studioSlug: z.string().min(1).max(120),
        roomId: z.string().uuid().optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        endTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        hours: z.number().int().min(1).max(24).optional(),
        people: z.number().int().min(1).max(200).optional(),
        purpose: z.string().max(120).optional(),
        notes: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = db(context.supabase);
    const { data: studio, error: studioError } = await client
      .from("studios")
      .select("id")
      .eq("slug", data.studioSlug)
      .maybeSingle();
    if (studioError) throw new Error(studioError.message);
    const studioId = (studio as { id: string } | null)?.id;
    if (!studioId) throw new Error("That studio is not taking requests yet.");

    // A studio with no rooms of its own is asked as a whole: the screens then carry the studio's
    // id where a room id would be, so it is only stored when it really is one of that studio's rooms.
    let roomId: string | null = null;
    if (data.roomId) {
      const { data: room } = await client
        .from("studio_rooms")
        .select("id")
        .eq("id", data.roomId)
        .eq("studio_id", studioId)
        .maybeSingle();
      roomId = (room as { id: string } | null)?.id ?? null;
    }

    const { data: row, error } = await client
      .from("booking_requests")
      .insert({
        studio_id: studioId,
        room_id: roomId,
        requester_profile_id: context.userId,
        session_date: data.date,
        start_time: data.startTime ?? null,
        end_time: data.endTime ?? null,
        hours: data.hours ?? null,
        people: data.people ?? null,
        purpose: data.purpose ?? null,
        notes: data.notes ?? null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string };
  });

/** The requests this account has sent, newest first. */
export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BookingRequest[]> => {
    const { data, error } = await db(context.supabase)
      .from("booking_requests")
      .select(SELECT)
      .eq("requester_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as BookingRequest[];
  });

/** One request, for the detail screen. Readable by the requester and the studio. */
export const getBookingRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<BookingRequest | null> => {
    const { data: row, error } = await db(context.supabase)
      .from("booking_requests")
      .select(SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as BookingRequest | null;
  });

/** The requests made to studios this account owns. */
export const listStudioBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BookingRequest[]> => {
    const client = db(context.supabase);
    const { data: studios, error: studioError } = await client
      .from("studios")
      .select("id")
      .eq("owner_profile_id", context.userId);
    if (studioError) throw new Error(studioError.message);
    const ids = ((studios ?? []) as { id: string }[]).map((s) => s.id);
    if (!ids.length) return [];
    const { data, error } = await client
      .from("booking_requests")
      .select(SELECT)
      .in("studio_id", ids)
      .order("session_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as BookingRequest[];
  });

/** The studio answers: reviewing, confirmed or declined, with a line back. */
export const answerBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["reviewing", "confirmed", "declined", "completed"]),
        reply: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("booking_requests")
      .update({
        status: data.status,
        ...(data.reply === undefined ? {} : { reply: data.reply }),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { status: data.status };
  });

/** The requester pulls out. The row stays, so the studio sees what happened. */
export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("booking_requests")
      .update({ status: "cancelled" } as never)
      .eq("id", data.id)
      .eq("requester_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { status: "cancelled" as const };
  });
