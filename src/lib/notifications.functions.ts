import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Notifications. Every row is written by a trigger on the thing that happened (a connection asked
 * for, a message sent, an application answered, a session booked, a review left), so this module
 * only reads them and marks them read.
 * Schema: supabase/migrations/20260918120000_notifications.sql
 */

/** The generated types cover two tables; every other table is read through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

export type NotificationKind =
  | "connection_request"
  | "connection_accepted"
  | "message"
  | "application_received"
  | "application_status"
  | "booking_requested"
  | "booking_answered"
  | "review_received"
  | "review_reply"
  | "review_request"
  | "collab_invite"
  | "collab_joined"
  | "rental_requested"
  | "rental_answered";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
  actor: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

const SELECT = `id, kind, title, body, href, read_at, created_at,
  actor:profiles!notifications_actor_profile_id_fkey(id, username, display_name, avatar_url)`;

/** This account's notifications, newest first. */
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Notification[]> => {
    const { data, error } = await db(context.supabase)
      .from("notifications")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Notification[];
  });

/**
 * This account's rental notifications — requests, answers and cancellations — for the Alerts tab
 * of My listings. Empty rather than an error before the rental kinds exist.
 * Schema: supabase/migrations/20260918230000_section_sources.sql
 */
export const listRentalNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Notification[]> => {
    const { data, error } = await db(context.supabase)
      .from("notifications")
      .select(SELECT)
      .in("kind", ["rental_requested", "rental_answered"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return [];
    return (data ?? []) as unknown as Notification[];
  });

/** How many are unread, for the bell. */
export const unreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const { count, error } = await db(context.supabase)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  });

/** Mark one read, or everything. */
export const markRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
    let query = db(context.supabase)
      .from("notifications")
      .update({ read_at: now } as never)
      .is("read_at", null);
    if (data.id) query = query.eq("id", data.id);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { read: true };
  });

/*
 * Channel preferences, one row per person, written the first time they change anything. Until
 * then — and for any category the row doesn't mention — the app's defaults apply.
 */
export type ChannelPrefs = Record<string, { push: boolean; email: boolean; sms: boolean }>;

export const getNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ channels: ChannelPrefs; quietHours: boolean } | null> => {
    const { data, error } = await db(context.supabase)
      .from("notification_preferences")
      .select("channels, quiet_hours")
      .eq("profile_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as { channels: ChannelPrefs; quiet_hours: boolean };
    return { channels: row.channels, quietHours: row.quiet_hours };
  });

export const saveNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        channels: z.record(
          z.string().max(40),
          z.object({ push: z.boolean(), email: z.boolean(), sms: z.boolean() }),
        ),
        quietHours: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("notification_preferences")
      .upsert({
        profile_id: context.userId,
        channels: data.channels,
        quiet_hours: data.quietHours,
        updated_at: new Date().toISOString(),
      } as never);
    if (error) throw new Error(error.message);
    return { saved: true };
  });
