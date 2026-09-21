import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAGE_EMAIL_DOMAIN } from "@/lib/pages";

/*
 * Business pages owned by a login (owner, 22 Sep 2026): one email is one login, and that login can
 * own one business page, the way Facebook and LinkedIn pages work. A page is its own profile row
 * (profiles.owner_id = the owner's login), so every rule for business accounts applies to it as is.
 *
 * profiles.id must be a sign-in, so a page gets one nobody types: an address that receives no mail
 * and a random password nobody knows. Switching hands the owner that sign-in's session, after
 * checking the owner really owns it. Schema: supabase/migrations/20260922160000_business_pages.sql.
 */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** A free username from a business name: letters and digits joined by dots, 3 to 30 long. */
async function freeUsername(client: SupabaseClient, name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 24) || "business";
  const padded = base.length < 3 ? `${base}.page` : base;
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? padded : `${padded}${Math.floor(100 + Math.random() * 900)}`;
    const [{ data: used }, { data: reserved }] = await Promise.all([
      client.from("profiles").select("id").eq("username", candidate).limit(1),
      client.from("reserved_usernames").select("name").eq("name", candidate).limit(1),
    ]);
    if (!used?.length && !reserved?.length) return candidate;
  }
  return null;
}

/**
 * Creates the page's sign-in and profile row, owned by `ownerId`, then runs `setUp` on it with a
 * server client (the owner's session can't write another profile). If anything fails the sign-in
 * is removed, which removes the page with it. One page per login.
 */
export async function createBusinessPage(
  ownerId: string,
  name: string,
  setUp: (client: SupabaseClient, pageId: string, username: string | null) => Promise<void>,
): Promise<{ pageId: string; username: string | null }> {
  const supabaseAdmin = await admin();
  const client = supabaseAdmin as unknown as SupabaseClient;
  const { data: existing, error: existingError } = await client
    .from("profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing)
    throw new Error("You already have a business page. Switch to it from Switch account.");

  const password = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: `page-${crypto.randomUUID()}@${PAGE_EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, business_page: true },
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Couldn't create the business page.");
  }
  const pageId = created.user.id;

  try {
    const username = await freeUsername(client, name);
    const { error: linkError } = await client
      .from("profiles")
      .update({ owner_id: ownerId, ...(username ? { username } : {}) } as never)
      .eq("id", pageId);
    if (linkError) throw new Error(linkError.message);
    await setUp(client, pageId, username);
    return { pageId, username };
  } catch (e) {
    await supabaseAdmin.auth.admin.deleteUser(pageId);
    throw e;
  }
}

export type LinkedProfile = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  kind: "talent" | "business";
};

/**
 * The signed-in login's own profile and the one linked to it: its business page, or, when signed
 * in as a page, the login that owns it. For Switch account.
 */
export const listLinkedProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LinkedProfile[]> => {
    const client = (await admin()) as unknown as SupabaseClient;
    const { data: me, error } = await client
      .from("profiles")
      .select("id, owner_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const ownerId = (me as { owner_id: string | null } | null)?.owner_id ?? context.userId;
    const { data: rows, error: rowsError } = await client
      .from("profiles")
      .select(
        "id, display_name, username, avatar_url, owner_id, business:profile_business(profile_id)",
      )
      .or(`id.eq.${ownerId},owner_id.eq.${ownerId}`);
    if (rowsError) throw new Error(rowsError.message);
    type Row = {
      id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
      owner_id: string | null;
      business: { profile_id: string } | { profile_id: string }[] | null;
    };
    return ((rows ?? []) as Row[])
      .sort((a, b) => Number(Boolean(a.owner_id)) - Number(Boolean(b.owner_id)))
      .map((r) => ({
        id: r.id,
        name: r.display_name,
        username: r.username,
        avatarUrl: r.avatar_url,
        kind:
          r.owner_id || (Array.isArray(r.business) ? r.business.length : r.business)
            ? "business"
            : "talent",
      }));
  });

/**
 * Switch into a linked profile: the owner into their page, or a page back to its owner. Returns a
 * one-time sign-in the browser exchanges for that profile's session (enterLinkedProfile).
 */
export const enterLinkedProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ tokenHash: string }> => {
    const supabaseAdmin = await admin();
    const client = supabaseAdmin as unknown as SupabaseClient;
    const { data: rows, error } = await client
      .from("profiles")
      .select("id, owner_id")
      .in("id", [context.userId, data.profileId]);
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as { id: string; owner_id: string | null }[];
    const me = list.find((r) => r.id === context.userId);
    const target = list.find((r) => r.id === data.profileId);
    const linked =
      Boolean(target && me) &&
      (target!.owner_id === context.userId || me!.owner_id === data.profileId);
    if (!linked) throw new Error("That profile isn't linked to this sign-in.");

    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      data.profileId,
    );
    const email = user?.user?.email;
    if (userError || !email) throw new Error("That profile can't be opened right now.");
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) throw new Error("That profile can't be opened right now.");
    return { tokenHash };
  });
