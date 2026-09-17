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
  | "review_reply";

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
