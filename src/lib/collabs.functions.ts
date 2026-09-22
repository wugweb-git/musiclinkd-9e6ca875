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
  /** Who asked them in. The person themselves when they asked to join by link (a request). */
  invited_by: string | null;
  inviter: {
    username: string | null;
    display_name: string | null;
  } | null;
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
  /** Last change to the collab itself, for "Recently updated" on the list. */
  updated_at: string;
  ends_on: string | null;
  /** When the work starts; a project's plan. */
  starts_on: string | null;
  /** work_modes slug: how the people in it work together. */
  work_mode: string | null;
  created_at: string;
  members: CollabMember[];
  /** Where this account stands with it, on the list screen. */
  my_status?: "invited" | "active";
};

const SELECT = `id, slug, name, bio, city, genres, cover_url, avatar_url, type, project_type, visibility, status, ends_on, starts_on, work_mode, created_at, updated_at,
  members:collab_members(profile_id, role, status, instrument, invited_by, inviter:profiles!collab_members_invited_by_fkey(username, display_name), profile:profiles!band_members_profile_id_fkey(username, display_name, avatar_url))`;

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

/** Someone asked in: by username, as an admin or a member, with the part they play. */
const invitee = z.object({
  username: z.string().trim().min(1).max(60),
  role: z.enum(["admin", "member"]).default("member"),
  instrument: z.string().max(80).optional(),
});

/** Asks one person in: an 'invited' row the database tells them about; they join on yes. */
async function inviteByUsername(
  client: SupabaseClient,
  me: string,
  collabId: string,
  person: z.infer<typeof invitee>,
) {
  const username = person.username.replace(/^@/, "");
  const { data: found, error: personError } = await client
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (personError) throw new Error(personError.message);
  const profileId = (found as { id: string } | null)?.id;
  if (!profileId) throw new Error(`No account with the username ${username}.`);
  const { error } = await client.from("collab_members").insert({
    collab_id: collabId,
    profile_id: profileId,
    role: person.role,
    instrument: person.instrument || null,
    status: "invited",
    invited_by: me,
  } as never);
  if (error) {
    if (error.code === "23505") throw new Error("They are already in this project, or asked.");
    throw new Error(
      error.code === "42501" ? "Only an owner or admin can ask people in." : error.message,
    );
  }
}

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
        startsOn: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        workMode: z
          .string()
          .regex(/^[a-z_]{2,40}$/)
          .optional(),
        /** Your own part in it ("Producer", "Lead vocals"), kept on your member row. */
        myRole: z.string().trim().max(80).optional(),
        /** For the people in it only (collab_private). */
        budgetPaise: z.number().int().min(0).max(1_000_000_000_00).optional(),
        /** People asked in as it is created, each with their standing and part. */
        invites: z.array(invitee).max(20).optional(),
      })
      .parse(d),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      id: string;
      invited: number;
      failed: { username: string; reason: string }[];
    }> => {
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
      if (data.startsOn || data.workMode) {
        await db(context.supabase)
          .from("collabs")
          .update({
            ...(data.startsOn ? { starts_on: data.startsOn } : {}),
            ...(data.workMode ? { work_mode: data.workMode } : {}),
          } as never)
          .eq("id", id as string);
      }
      if (data.myRole) {
        await db(context.supabase)
          .from("collab_members")
          .update({ instrument: data.myRole } as never)
          .eq("collab_id", id as string)
          .eq("profile_id", context.userId);
      }
      if (data.budgetPaise !== undefined) {
        await db(context.supabase)
          .from("collab_private")
          .insert({ collab_id: id as string, budget_paise: data.budgetPaise } as never);
      }
      let invited = 0;
      const failed: { username: string; reason: string }[] = [];
      for (const person of data.invites ?? []) {
        try {
          await inviteByUsername(db(context.supabase), context.userId, id as string, person);
          invited++;
        } catch (e) {
          failed.push({
            username: person.username,
            reason: e instanceof Error ? e.message : "Couldn't ask them.",
          });
        }
      }
      return { id: id as string, invited, failed };
    },
  );

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
    await inviteByUsername(db(context.supabase), context.userId, data.id, data);
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
        startsOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
        workMode: z.union([z.string().regex(/^[a-z_]{2,40}$/), z.literal("")]).optional(),
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
        ...(data.startsOn !== undefined ? { starts_on: data.startsOn || null } : {}),
        ...(data.workMode !== undefined ? { work_mode: data.workMode || null } : {}),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { saved: true };
  });

/** The project's banner or picture, once uploaded to the owner's storage folder. */
export const setCollabImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        kind: z.enum(["cover", "avatar"]),
        url: z.string().url().max(500),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collabs")
      .update({ [data.kind === "cover" ? "cover_url" : "avatar_url"]: data.url } as never)
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

/** The project's budget, for the people in it; null for anyone else or when none was set. */
export const getCollabBudget = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ budgetPaise: number | null }> => {
    const { data: row } = await db(context.supabase)
      .from("collab_private")
      .select("budget_paise")
      .eq("collab_id", data.id)
      .maybeSingle();
    const paise = (row as { budget_paise: number | null } | null)?.budget_paise;
    return { budgetPaise: paise ?? null };
  });

/** Set or change the budget; owners and admins only (the database checks). */
export const setCollabBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        budgetPaise: z.number().int().min(0).max(1_000_000_000_00).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collab_private")
      .upsert(
        {
          collab_id: data.id,
          budget_paise: data.budgetPaise,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "collab_id" },
      );
    if (error) throw new Error(error.message);
    return { saved: true };
  });

/*
 * The project's join link (20260922251000_collab_invite_links.sql). Only owners and admins can read
 * or set it; anyone signed in who opens /collab/join/<token> joins through the database function.
 */
export type CollabInviteLink = { token: string; active: boolean; needs_approval: boolean };

export const getCollabInviteLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<CollabInviteLink | null> => {
    const { data: row, error } = await db(context.supabase)
      .from("collab_invite_links")
      .select("token, active, needs_approval")
      .eq("collab_id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as CollabInviteLink | null;
  });

/** Make the link, turn it on or off, or change whether the owner approves each join. */
export const setCollabInviteLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        active: z.boolean().optional(),
        needsApproval: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<CollabInviteLink> => {
    const { data: row, error } = await db(context.supabase)
      .from("collab_invite_links")
      .upsert(
        {
          collab_id: data.id,
          ...(data.active !== undefined ? { active: data.active } : {}),
          ...(data.needsApproval !== undefined ? { needs_approval: data.needsApproval } : {}),
        } as never,
        { onConflict: "collab_id" },
      )
      .select("token, active, needs_approval")
      .single();
    if (error) {
      throw new Error(
        error.code === "42501" ? "Only an owner or admin can change the link." : error.message,
      );
    }
    return row as CollabInviteLink;
  });

/** Join by link: 'invited' while the owner approves each join, otherwise straight in. */
export const joinCollabByLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    // Any text: a wrong token gets the database's plain answer, not a validation error.
    z.object({ token: z.string().trim().max(80) }).parse(d),
  )
  .handler(
    async ({ context, data }): Promise<{ collab_id: string; status: "invited" | "active" }> => {
      const { data: joined, error } = await db(context.supabase).rpc("join_collab_by_link", {
        p_token: data.token,
      });
      if (error) throw new Error(error.message);
      return joined as { collab_id: string; status: "invited" | "active" };
    },
  );

/** Let in someone who asked to join by link. Owners and admins can (the database checks). */
export const letInCollabMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("collab_members")
      .update({ status: "active" } as never)
      .eq("collab_id", data.id)
      .eq("profile_id", data.profileId)
      // Only a request: someone the room asked in says yes themselves.
      .eq("invited_by", data.profileId)
      .eq("status", "invited");
    if (error) throw new Error(error.message);
    return { active: true };
  });
