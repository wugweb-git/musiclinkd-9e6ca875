import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Settings > Privacy > Your data > Request Copy: everything the account itself holds, read with the
 * person's own session, so row-level security decides what comes back exactly as it does in the
 * app. A table that can't be read (or isn't there yet) is left out of the copy, not faked.
 */

/** [table, owner column(s)]: a row is the account's when any of those columns is its id. */
const OWNED: [string, string[]][] = [
  ["profiles", ["id"]],
  ["profile_private", ["id"]],
  ["profile_business", ["profile_id"]],
  ["profile_role_details", ["profile_id"]],
  ["profile_experience", ["profile_id"]],
  ["profile_events", ["profile_id"]],
  ["profile_members", ["profile_id"]],
  ["profile_gallery", ["profile_id"]],
  ["profile_services", ["profile_id"]],
  ["profile_service_packages", ["profile_id"]],
  ["profile_service_addons", ["profile_id"]],
  ["portfolio_items", ["user_id"]],
  ["studios", ["owner_profile_id"]],
  ["opportunities", ["creator_profile_id"]],
  ["opportunity_applications", ["applicant_profile_id"]],
  ["marketplace_listings", ["seller_profile_id"]],
  ["marketplace_offers", ["buyer_profile_id"]],
  ["booking_requests", ["requester_profile_id"]],
  ["rental_bookings", ["renter_profile_id"]],
  ["saved_items", ["user_id"]],
  ["saved_searches", ["profile_id"]],
  ["follows", ["follower_id", "target_id"]],
  ["connections", ["requester_id", "addressee_id"]],
  ["enquiries", ["sender_profile_id", "business_profile_id"]],
  ["reviews", ["author_profile_id", "target_profile_id"]],
  ["review_requests", ["requester_profile_id", "asked_profile_id"]],
  ["messages", ["sender_id"]],
  ["notifications", ["recipient_profile_id"]],
  ["notification_preferences", ["profile_id"]],
  ["verification_requests", ["profile_id"]],
  ["collab_members", ["profile_id"]],
  ["feed_posts", ["author_profile_id"]],
];

export type DataCopy = {
  exportedAt: string;
  account: { id: string; email: string | null; phone: string | null };
  tables: Record<string, unknown[]>;
};

export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  // Returned as JSON text: the rows are whatever each table holds, and the screen saves them as-is.
  .handler(async ({ context }): Promise<{ fileName: string; json: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const me = context.userId;
    const claims = context.claims as { email?: string; phone?: string };
    const tables: Record<string, unknown[]> = {};
    await Promise.all(
      OWNED.map(async ([table, columns]) => {
        try {
          const filter = columns.map((c) => `${c}.eq.${me}`).join(",");
          const { data, error } = await client.from(table).select("*").or(filter).limit(5000);
          if (!error) tables[table] = data ?? [];
        } catch {
          // Left out of the copy.
        }
      }),
    );
    const copy: DataCopy = {
      exportedAt: new Date().toISOString(),
      account: {
        id: me,
        email: claims.email || null,
        phone: claims.phone || null,
      },
      tables,
    };
    return {
      fileName: `musiclinkd-data-${copy.exportedAt.slice(0, 10)}.json`,
      json: JSON.stringify(copy, null, 2),
    };
  });

/*
 * Deactivate or delete (Settings > Delete account, and the business Manage hub), the same for talent
 * and business accounts (owner, 21 Sep 2026). Deactivating hides the profile everywhere and
 * archives a business's studio; reactivating undoes both. Deleting is permanent: the sign-in, the
 * profile and everything the account owns go. Whoever was on the other side of a booking keeps
 * their record of it (20260921230000_deactivate_delete.sql). Schema: that migration.
 */

type Client = SupabaseClient;

/** Sessions still to come on either side of a booking; a delete waits until these are settled. */
export async function upcomingBookingsOf(client: Client, me: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: studios } = await client.from("studios").select("id").eq("owner_profile_id", me);
  const ids = ((studios ?? []) as { id: string }[]).map((s) => s.id);
  const who = ids.length
    ? `requester_profile_id.eq.${me},studio_id.in.(${ids.join(",")})`
    : `requester_profile_id.eq.${me}`;
  const { data, error } = await client
    .from("booking_requests")
    .select("id")
    .or(who)
    .in("status", ["requested", "reviewing", "confirmed"])
    .gte("session_date", today);
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export const deactivateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as Client;
    const me = context.userId;
    const { data: row, error: readError } = await client
      .from("profiles")
      .select("visibility, discovery_prefs")
      .eq("id", me)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    const current = row as { visibility: string | null; discovery_prefs: unknown } | null;
    if (current?.visibility === "deactivated") return { status: "deactivated" as const };
    const prefs =
      current?.discovery_prefs && typeof current.discovery_prefs === "object"
        ? (current.discovery_prefs as Record<string, unknown>)
        : {};
    const { error } = await client
      .from("profiles")
      .update({
        visibility: "deactivated",
        discovery_prefs: { ...prefs, visibility_before: current?.visibility ?? "public" },
      } as never)
      .eq("id", me);
    if (error) throw new Error(error.message);
    const { error: studioError } = await client
      .from("studios")
      .update({ archived_at: new Date().toISOString() } as never)
      .eq("owner_profile_id", me);
    if (studioError) throw new Error(studioError.message);
    return { status: "deactivated" as const };
  });

export const reactivateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as Client;
    const me = context.userId;
    const { data: row, error: readError } = await client
      .from("profiles")
      .select("discovery_prefs")
      .eq("id", me)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    const prefs = ((row as { discovery_prefs: unknown } | null)?.discovery_prefs ?? {}) as Record<
      string,
      unknown
    >;
    const before = prefs["visibility_before"];
    const visibility =
      before === "members" || before === "limited" || before === "public" ? before : "public";
    const { visibility_before: _before, ...rest } = prefs;
    const { error } = await client
      .from("profiles")
      .update({ visibility, discovery_prefs: rest } as never)
      .eq("id", me);
    if (error) throw new Error(error.message);
    const { error: studioError } = await client
      .from("studios")
      .update({ archived_at: null } as never)
      .eq("owner_profile_id", me);
    if (studioError) throw new Error(studioError.message);
    return { status: "active" as const };
  });

export type DeleteAccountResult = { status: "deleted" } | { status: "upcoming"; count: number };

/** Deletes the sign-in itself; the profile and everything it owns go with it. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DeleteAccountResult> => {
    const client = context.supabase as unknown as Client;
    const me = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // The business page this sign-in owns goes with it, so its sessions end too.
    const { data: page } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("owner_id" as never, me)
      .maybeSingle();
    const pageId = (page as { id: string } | null)?.id ?? null;
    const count =
      (await upcomingBookingsOf(client, me)) +
      (pageId ? await upcomingBookingsOf(supabaseAdmin as unknown as Client, pageId) : 0);
    if (count) return { status: "upcoming", count };
    if (pageId) {
      const { error: pageError } = await supabaseAdmin.auth.admin.deleteUser(pageId);
      if (pageError) throw new Error(pageError.message);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(me);
    if (error) throw new Error(error.message);
    return { status: "deleted" };
  });
