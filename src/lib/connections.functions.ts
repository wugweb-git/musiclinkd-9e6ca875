import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Connections and follows: what one profile can do about another.
 *
 * A connection is mutual — asked for, then accepted or declined — and private to the two people in
 * it. A follow is one-way and public, the way a follower count is. Both are profile to profile, so
 * a talent account and a business account behave the same.
 * Schema: supabase/migrations/20260917130000_connections.sql
 */

export type ConnectionState = "none" | "sent" | "received" | "connected" | "declined";

export type ConnectionPerson = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  city: string | null;
  is_verified: boolean;
};

export type ConnectionRow = {
  id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  /** The other person, whichever side asked. */
  person: ConnectionPerson;
  /** True when this account sent the request. */
  outgoing: boolean;
};

/** The generated types cover two tables; every other table is read through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

const PERSON = "id, username, display_name, avatar_url, headline, city, is_verified";

type RawConnection = {
  id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  requester_id: string;
  addressee_id: string;
  requester: ConnectionPerson | null;
  addressee: ConnectionPerson | null;
};

function shape(rows: RawConnection[], me: string): ConnectionRow[] {
  return rows.flatMap((r) => {
    const outgoing = r.requester_id === me;
    const person = outgoing ? r.addressee : r.requester;
    // A profile the reader cannot see comes back null; the row is theirs to keep, not to show.
    return person
      ? [{ id: r.id, status: r.status, created_at: r.created_at, person, outgoing }]
      : [];
  });
}

const SELECT = `id, status, created_at, requester_id, addressee_id,
  requester:profiles!connections_requester_id_fkey(${PERSON}),
  addressee:profiles!connections_addressee_id_fkey(${PERSON})`;

/** Every connection this account is part of: accepted, sent and received. */
export const listMyConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await db(context.supabase)
      .from("connections")
      .select(SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = shape((data ?? []) as unknown as RawConnection[], context.userId);
    return {
      connected: rows.filter((r) => r.status === "accepted"),
      received: rows.filter((r) => r.status === "pending" && !r.outgoing),
      sent: rows.filter((r) => r.status === "pending" && r.outgoing),
    };
  });

/** Where this account stands with one profile, for the button on their page. */
export const connectionWith = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ state: ConnectionState; following: boolean; connectionId: string | null }> => {
      const [connection, follow] = await Promise.all([
        db(context.supabase)
          .from("connections")
          .select("id, status, requester_id, addressee_id")
          .or(`requester_id.eq.${data.profileId},addressee_id.eq.${data.profileId}`)
          .maybeSingle(),
        db(context.supabase)
          .from("follows")
          .select("target_id")
          .eq("follower_id", context.userId)
          .eq("target_id", data.profileId)
          .maybeSingle(),
      ]);
      if (connection.error) throw new Error(connection.error.message);
      if (follow.error) throw new Error(follow.error.message);
      const row = connection.data as {
        id: string;
        status: "pending" | "accepted" | "declined";
        requester_id: string;
      } | null;
      const state: ConnectionState = !row
        ? "none"
        : row.status === "accepted"
          ? "connected"
          : row.status === "declined"
            ? "declined"
            : row.requester_id === context.userId
              ? "sent"
              : "received";
      return { state, following: Boolean(follow.data), connectionId: row?.id ?? null };
    },
  );

/**
 * The number to call this profile on, or null. contact_phone applies the owner's "Show phone
 * number" setting (Privacy) server-side: always, only after a booking or other real relationship,
 * or never. Null too before 20260921210000_contact_phone.sql is applied, so no Call button shows.
 */
export const contactPhone = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ phone: string | null }> => {
    const { data: phone, error } = await db(context.supabase).rpc("contact_phone", {
      p_profile: data.profileId,
    });
    if (error) return { phone: null };
    return { phone: typeof phone === "string" && phone ? phone : null };
  });

/** Ask to connect. The pair index means a second request cannot be created either way round. */
export const requestConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ profileId: z.string().uuid(), note: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("connections")
      .insert({
        requester_id: context.userId,
        addressee_id: data.profileId,
        ...(data.note ? { note: data.note } : {}),
      } as never);
    if (error && error.code !== "23505") throw new Error(error.message);
    return { state: "sent" as const };
  });

/** Accept or decline a request addressed to this account. */
export const answerConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), accept: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("connections")
      .update({ status: data.accept ? "accepted" : "declined" } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { state: data.accept ? ("connected" as const) : ("declined" as const) };
  });

/** Withdraw a request, or remove a connection. Either side can. */
export const removeConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("connections")
      .delete()
      .or(`requester_id.eq.${data.profileId},addressee_id.eq.${data.profileId}`);
    if (error) throw new Error(error.message);
    return { state: "none" as const };
  });

/** Follow or unfollow, one way, no asking. */
export const setFollowing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ profileId: z.string().uuid(), following: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (data.following) {
      const { error } = await db(context.supabase)
        .from("follows")
        .insert({ follower_id: context.userId, target_id: data.profileId } as never);
      if (error && error.code !== "23505") throw new Error(error.message);
      return { following: true };
    }
    const { error } = await db(context.supabase)
      .from("follows")
      .delete()
      .eq("follower_id", context.userId)
      .eq("target_id", data.profileId);
    if (error) throw new Error(error.message);
    return { following: false };
  });

/** Public follower and connection counts for a profile page. */
export const profileCounts = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const client = await anonClient();
    const { count, error } = await client
      .from("follows")
      .select("target_id", { count: "exact", head: true })
      .eq("target_id", data.profileId);
    if (error) throw new Error(error.message);
    return { followers: count ?? 0 };
  });
