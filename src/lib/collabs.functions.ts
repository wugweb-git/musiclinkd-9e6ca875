import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

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
  /** Invited people are not in the collab yet; they decide first. */
  status: "invited" | "active";
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
  /** A taxonomy slug from project_types. Null for a band, and for a project that has not said. */
  project_type: string | null;
  visibility: "public" | "private";
  status: CollabStatus;
  ends_on: string | null;
  created_at: string;
  members: CollabMember[];
  /** Where this account stands with it, on the list screen. */
  my_status?: "invited" | "active";
};

const SELECT = `id, slug, name, bio, city, genres, cover_url, avatar_url, type, project_type, visibility, status, ends_on, created_at,
  members:collab_members(profile_id, role, status, instrument, profile:profiles(username, display_name, avatar_url))`;

/** What kind of project it is, from the taxonomy the database already carries. */
export const listProjectTypes = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ slug: string; label: string }[]> => {
    const client = await anonClient();
    const { data, error } = await client
      .from("taxonomy_options" as never)
      .select("slug, label, sort_order")
      .eq("category_key", "project_types")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as { slug: string; label: string }[]).map(
      ({ slug, label }) => ({
        slug,
        label,
      }),
    );
  },
);

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
        projectType: z.string().trim().max(60).optional(),
        endsOn: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        genres: z.array(z.string().trim().max(40)).max(12).optional(),
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
    // What kind of project it is, and its genres, are plain columns — set right after it exists.
    if (data.projectType) {
      await db(context.supabase)
        .from("collabs")
        .update({ project_type: data.projectType } as never)
        .eq("id", id as string);
    }
    if (data.genres?.length) {
      await db(context.supabase)
        .from("collabs")
        .update({ genres: data.genres } as never)
        .eq("id", id as string);
    }
    return { id: id as string };
  });

/** The collabs this account is in — both kinds, since a band is a collab too. */
export const listMyCollabs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Collab[]> => {
    const client = db(context.supabase);
    const { data: mine, error: mineError } = await client
      .from("collab_members")
      .select("collab_id, status")
      .eq("profile_id", context.userId);
    if (mineError) throw new Error(mineError.message);
    const rows = (mine ?? []) as { collab_id: string; status: "invited" | "active" }[];
    if (!rows.length) return [];
    const { data, error } = await client
      .from("collabs")
      .select(SELECT)
      .in(
        "id",
        rows.map((m) => m.collab_id),
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const standing = new Map(rows.map((m) => [m.collab_id, m.status]));
    return ((data ?? []) as unknown as Collab[]).map((c) => ({
      ...c,
      my_status: standing.get(c.id) ?? "active",
    }));
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

/**
 * Ask someone to join, by username. Owners and admins can (owner, 18 Sep 2026): being added is an
 * invitation, not a fact, so the row is 'invited' until they say yes. The database tells them.
 */
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
      status: "invited",
      invited_by: context.userId,
    } as never);
    if (error) {
      if (error.code === "23505") throw new Error("They are already in this project, or asked.");
      throw new Error(
        error.code === "42501" ? "Only an owner or admin can ask people in." : error.message,
      );
    }
    return { invited: true };
  });

/** Your answer to an invitation: join, or say no and the row goes. */
export const answerCollabInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), answer: z.enum(["join", "no"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const { error } =
      data.answer === "join"
        ? await client
            .from("collab_members")
            .update({ status: "active" } as never)
            .eq("collab_id", data.id)
            .eq("profile_id", context.userId)
            .eq("status", "invited")
        : await client
            .from("collab_members")
            .delete()
            .eq("collab_id", data.id)
            .eq("profile_id", context.userId)
            .eq("status", "invited");
    if (error) throw new Error(error.message);
    return { answered: data.answer };
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

/**
 * Change what the collab is: its name, what it is about, where, what kind, and when it wraps up.
 * The people in it can (the collabs update policy); the room offers it to owners and admins.
 */
export const updateCollab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(2).max(80),
        bio: z.string().max(2000),
        city: z.string().max(80),
        projectType: z.string().trim().max(60),
        endsOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collabs")
      .update({
        name: data.name,
        bio: data.bio.trim() || null,
        city: data.city.trim() || null,
        project_type: data.projectType || null,
        ends_on: data.endsOn || null,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { saved: true };
  });

/** Close a project for good. Only its owner can, and only a project — a band is not ended here. */
export const deleteCollab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await db(context.supabase)
      .from("collabs")
      .delete()
      .eq("id", data.id)
      .eq("type", "project")
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("Only the owner can delete this project.");
    return { deleted: true };
  });

export type CollabMessage = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  mine: boolean;
  sender: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

/** The table does not exist until 20260921180000_collab_complete.sql is applied. */
const missingTable = (e: { code?: string; message?: string }) =>
  e.code === "42P01" || e.code === "PGRST205" || /collab_messages/.test(e.message ?? "");

/**
 * The room's own thread, oldest first. `ready` is false while the table is not in the database
 * yet, so the room can say so instead of failing.
 */
export const listCollabMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ready: boolean; messages: CollabMessage[] }> => {
    const { data: rows, error } = await db(context.supabase)
      .from("collab_messages")
      .select(
        "id, body, created_at, sender_id, sender:profiles(username, display_name, avatar_url)",
      )
      .eq("collab_id", data.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      if (missingTable(error)) return { ready: false, messages: [] };
      throw new Error(error.message);
    }
    return {
      ready: true,
      messages: ((rows ?? []) as unknown as Omit<CollabMessage, "mine">[]).map((m) => ({
        ...m,
        mine: m.sender_id === context.userId,
      })),
    };
  });

/** Say something in the room. The database tells everyone else in it. */
export const sendCollabMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collab_messages")
      .insert({ collab_id: data.id, sender_id: context.userId, body: data.body } as never);
    if (error) {
      if (missingTable(error)) throw new Error("This thread is not open yet. Try again later.");
      throw new Error(
        error.code === "42501" ? "Only the people in this project can write here." : error.message,
      );
    }
    return { sent: true };
  });
