import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Collabs of type 'project': a group of talent working on one thing, for as long as it takes.
 * A band is the other type — ongoing and public — and both live in the same tables (owner,
 * 17 Sep 2026). Schema: supabase/migrations/20260917120000_collabs.sql
 */

/** The generated types cover two tables; every other table is read through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

export type CollabStatus = "active" | "paused" | "completed" | "archived";

export type CollabMember = {
  profile_id: string;
  role: "owner" | "admin" | "member";
  instrument: string | null;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type Collab = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  city: string | null;
  genres: string[];
  cover_url: string | null;
  avatar_url: string | null;
  type: "band" | "project";
  visibility: "public" | "private";
  status: CollabStatus;
  ends_on: string | null;
  created_at: string;
  members: CollabMember[];
};

const SELECT = `id, slug, name, bio, city, genres, cover_url, avatar_url, type, visibility, status, ends_on, created_at,
  members:collab_members(profile_id, role, instrument, profile:profiles(username, display_name, avatar_url))`;

/** Start a project room. You are its owner; private unless you say otherwise. */
export const createCollab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        bio: z.string().max(2000).optional(),
        city: z.string().max(80).optional(),
        visibility: z.enum(["public", "private"]).default("private"),
        type: z.enum(["project", "band"]).default("project"),
        endsOn: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    // One call: a private collab is readable only by its members, so there is no moment when a
    // half-built one is readable — creating it and joining it happens in the database.
    const { data: id, error } = await db(context.supabase).rpc("start_collab", {
      p_name: data.name,
      p_bio: data.bio ?? null,
      p_city: data.city ?? null,
      p_visibility: data.visibility,
      p_type: data.type,
      p_ends_on: data.endsOn ?? null,
    });
    if (error) throw new Error(error.message);
    return { id: id as string };
  });

/** The collabs this account is in — both kinds, since a band is a collab too. */
export const listMyCollabs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Collab[]> => {
    const client = db(context.supabase);
    const { data: mine, error: mineError } = await client
      .from("collab_members")
      .select("collab_id")
      .eq("profile_id", context.userId);
    if (mineError) throw new Error(mineError.message);
    const ids = ((mine ?? []) as { collab_id: string }[]).map((m) => m.collab_id);
    if (!ids.length) return [];
    const { data, error } = await client
      .from("collabs")
      .select(SELECT)
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Collab[];
  });

/** One project room. Private ones are readable only by their members. */
export const getCollab = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<Collab | null> => {
    const { data: row, error } = await db(context.supabase)
      .from("collabs")
      .select(SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as Collab | null;
  });

/** Bring someone in by username. Owners and admins can. */
export const addCollabMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        username: z.string().trim().min(1).max(60),
        role: z.enum(["admin", "member"]).default("member"),
        instrument: z.string().max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const { data: person, error: personError } = await client
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .maybeSingle();
    if (personError) throw new Error(personError.message);
    const profileId = (person as { id: string } | null)?.id;
    if (!profileId) throw new Error(`No account with the username ${data.username}.`);

    const { error } = await client.from("collab_members").insert({
      collab_id: data.id,
      profile_id: profileId,
      role: data.role,
      instrument: data.instrument ?? null,
    } as never);
    if (error) {
      if (error.code === "23505") throw new Error("They are already in this project.");
      throw new Error(
        error.code === "42501" ? "Only an owner or admin can add people." : error.message,
      );
    }
    return { added: true };
  });

/** Change what someone is in the room, or take them out. Owners and admins can. */
export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        profileId: z.string().uuid(),
        role: z.enum(["admin", "member"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collab_members")
      .update({ role: data.role } as never)
      .eq("collab_id", data.id)
      .eq("profile_id", data.profileId);
    if (error) throw new Error(error.message);
    return { role: data.role };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collab_members")
      .delete()
      .eq("collab_id", data.id)
      .eq("profile_id", data.profileId);
    if (error) throw new Error(error.message);
    return { removed: true };
  });

/** Hand the room over: they become owner, you stay as an admin. */
export const transferCollab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    // Demote first: one owner per collab is enforced by an index.
    const { error: demote } = await client
      .from("collab_members")
      .update({ role: "admin" } as never)
      .eq("collab_id", data.id)
      .eq("profile_id", context.userId);
    if (demote) throw new Error(demote.message);
    const { error } = await client
      .from("collab_members")
      .update({ role: "owner" } as never)
      .eq("collab_id", data.id)
      .eq("profile_id", data.profileId);
    if (error) throw new Error(error.message);
    return { transferred: true };
  });

/** Who can see it: a project can be opened up, or closed again. */
export const setCollabVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), visibility: z.enum(["public", "private"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collabs")
      .update({ visibility: data.visibility } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { visibility: data.visibility };
  });

/** Move the project along: active, paused, completed, archived. */
export const setCollabStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "paused", "completed", "archived"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collabs")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { status: data.status };
  });

/** Leave a project room. The owner cannot walk out of their own. */
export const leaveCollab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const { data: mine } = await client
      .from("collab_members")
      .select("role")
      .eq("collab_id", data.id)
      .eq("profile_id", context.userId)
      .maybeSingle();
    if ((mine as { role: string } | null)?.role === "owner") {
      throw new Error("Hand the project to someone else before you leave it.");
    }
    const { error } = await client
      .from("collab_members")
      .delete()
      .eq("collab_id", data.id)
      .eq("profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { left: true };
  });
