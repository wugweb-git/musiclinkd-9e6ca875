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
