import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { earliestBookingDate } from "@/lib/bookable-slots";
import { assertBookableTakes } from "@/lib/bookable-calendar.functions";

/*
 * Booking requests: someone books a service for a time, and whoever offers it answers — a
 * business's bookable, or a talent with no bookable (owner, 3 Oct 2026: people book a service, and
 * every service is bookable). No money is involved — MusicLinkd takes no payments, so the two of
 * them settle that between themselves.
 * Schema: supabase/migrations/20260918100000_bookings.sql, 20261004100000 (service_id).
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
  studio: {
    id: string;
    slug: string;
    name: string;
    location: string | null;
    owner_profile_id?: string | null;
  } | null;
  /** Copied when the booking is made, so the history reads after the studio or person is gone. */
  bookable_name: string | null;
  requester_name: string | null;
  room: { id: string; name: string } | null;
  /** The service booked, with who offers it; null for older bookings or a paused service. */
  service: {
    id: string;
    name: string;
    profile_id: string;
    provider: { display_name: string | null; username: string | null } | null;
  } | null;
  /** True when the signed-in account is the one asked: it owns the bookable or the service. */
  asked_of_me?: boolean;
  requester: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

const SELECT = `id, session_date, start_time, end_time, hours, people, purpose, notes, reply, status, created_at,
  bookable_name, requester_name,
  studio:bookables(id, slug, name, location, owner_profile_id),
  room:bookable_rooms(id, name),
  service:profile_services(id, name, profile_id,
    provider:profiles!profile_services_profile_id_fkey(display_name, username)),
  requester:profiles!booking_requests_requester_profile_id_fkey(id, username, display_name, avatar_url)`;

/** Who was asked: the bookable's name, the copy kept on the row, or the service's provider. */
export function askedName(b: BookingRequest) {
  return (
    b.studio?.name ??
    b.bookable_name ??
    b.service?.provider?.display_name ??
    b.service?.provider?.username ??
    null
  );
}

const withMine = (row: BookingRequest, userId: string): BookingRequest => ({
  ...row,
  asked_of_me: row.studio?.owner_profile_id === userId || row.service?.profile_id === userId,
});

/**
 * Book a service. A business's bookable is addressed by slug, the way its screens do, and the
 * service, when picked, must be one of its owner's. A service with no bookable (a talent's, or a
 * business without a place) is booked on its own: a dated request its owner accepts or declines.
 */
export const requestBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        studioSlug: z.string().min(1).max(120).optional(),
        serviceId: z.string().uuid().optional(),
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
      .refine((v) => v.studioSlug || v.serviceId, "Pick a service to book.")
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    if (data.date < earliestBookingDate()) throw new Error("Pick a day from tomorrow onwards.");
    const client = db(context.supabase);

    let service: { id: string; name: string; profile_id: string } | null = null;
    if (data.serviceId) {
      const { data: row, error } = await client
        .from("profile_services")
        .select("id, name, profile_id, status")
        .eq("id", data.serviceId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const sv = row as { id: string; name: string; profile_id: string; status: string } | null;
      if (!sv || sv.status !== "active") throw new Error("This service isn't taking bookings.");
      if (sv.profile_id === context.userId) throw new Error("You can't book your own service.");
      service = sv;
    }

    let studioId: string | null = null;
    if (data.studioSlug) {
      const { data: studio, error: studioError } = await client
        .from("bookables")
        .select("id, owner_profile_id")
        .eq("slug", data.studioSlug)
        .maybeSingle();
      if (studioError) throw new Error(studioError.message);
      const found = studio as { id: string; owner_profile_id: string } | null;
      if (!found) throw new Error("That studio is not taking requests yet.");
      if (service && service.profile_id !== found.owner_profile_id)
        throw new Error("That service isn't offered here.");
      studioId = found.id;
      await assertBookableTakes(client, studioId, data.date, data.startTime);
    }

    // A studio with no rooms of its own is asked as a whole: the screens then carry the studio's
    // id where a room id would be, so it is only stored when it really is one of that studio's rooms.
    let roomId: string | null = null;
    if (studioId && data.roomId) {
      const { data: room } = await client
        .from("bookable_rooms")
        .select("id")
        .eq("id", data.roomId)
        .eq("bookable_id", studioId)
        .maybeSingle();
      roomId = (room as { id: string } | null)?.id ?? null;
    }

    const { data: row, error } = await client
      .from("booking_requests")
      .insert({
        bookable_id: studioId,
        room_id: roomId,
        service_id: service?.id ?? null,
        requester_profile_id: context.userId,
        session_date: data.date,
        start_time: data.startTime ?? null,
        end_time: data.endTime ?? null,
        hours: data.hours ?? null,
        people: data.people ?? null,
        purpose: data.purpose ?? service?.name ?? null,
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

/** One request, for the detail screen. Readable by the requester and whoever was asked. */
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
    return row ? withMine(row as unknown as BookingRequest, context.userId) : null;
  });

/** The requests made to this account: to the bookables it owns, or for its services. */
export const listBookableBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BookingRequest[]> => {
    const client = db(context.supabase);
    const [studios, services] = await Promise.all([
      client.from("bookables").select("id").eq("owner_profile_id", context.userId),
      client.from("profile_services").select("id").eq("profile_id", context.userId),
    ]);
    if (studios.error) throw new Error(studios.error.message);
    if (services.error) throw new Error(services.error.message);
    const ids = ((studios.data ?? []) as { id: string }[]).map((s) => s.id);
    const serviceIds = ((services.data ?? []) as { id: string }[]).map((s) => s.id);
    if (!ids.length && !serviceIds.length) return [];
    const scope = [
      ids.length ? `bookable_id.in.(${ids.join(",")})` : "",
      serviceIds.length ? `service_id.in.(${serviceIds.join(",")})` : "",
    ]
      .filter(Boolean)
      .join(",");
    const { data, error } = await client
      .from("booking_requests")
      .select(SELECT)
      .or(scope)
      .order("session_date", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as BookingRequest[]).map((r) => withMine(r, context.userId));
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
    // Only whoever was asked answers: the bookable's owner or the service's. The requester can
    // update their own row too (to cancel), so without this they could confirm their own request.
    const client = db(context.supabase);
    const { data: row, error: readError } = await client
      .from("booking_requests")
      .select(SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    const booking = row ? withMine(row as unknown as BookingRequest, context.userId) : null;
    if (!booking?.asked_of_me) throw new Error("Only the one asked can answer this request.");
    const { data: updated, error } = await client
      .from("booking_requests")
      .update({
        status: data.status,
        ...(data.reply === undefined ? {} : { reply: data.reply }),
      } as never)
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!(updated as unknown[] | null)?.length) {
      throw new Error("Only the one asked can answer this request.");
    }
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

/**
 * The requester asks for a different time. A confirmed session goes back to "requested" — the
 * studio agreed to the old slot, not this one, so it has to answer again.
 */
export const rescheduleBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
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
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    if (data.date < earliestBookingDate()) throw new Error("Pick a day from tomorrow onwards.");
    const { data: current } = await db(context.supabase)
      .from("booking_requests")
      .select("bookable_id")
      .eq("id", data.id)
      .maybeSingle();
    const studioId = (current as { bookable_id: string | null } | null)?.bookable_id;
    if (studioId)
      await assertBookableTakes(db(context.supabase), studioId, data.date, data.startTime);
    const { error } = await db(context.supabase)
      .from("booking_requests")
      .update({
        session_date: data.date,
        start_time: data.startTime ?? null,
        end_time: data.endTime ?? null,
        hours: data.hours ?? null,
        status: "requested",
        reply: null,
      } as never)
      .eq("id", data.id)
      .eq("requester_profile_id", context.userId)
      .in("status", ["requested", "reviewing", "confirmed"]);
    if (error) throw new Error(error.message);
    return { status: "requested" as const };
  });
