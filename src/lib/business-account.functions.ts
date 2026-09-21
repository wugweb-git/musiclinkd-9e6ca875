import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Delete business (Manage hub). One account is one business, so this removes the account's
 * business profile (profile_business) and its team rows, and archives its studio
 * (studios.archived_at, 20260921200000_partials_complete.sql). The studio row itself stays: past
 * bookings and reviews of it are the customers' too, and a delete would cascade them away.
 * Refused while the studio has a session still to come, as the confirmation says.
 */

export type DeleteBusinessResult =
  | { status: "deleted" }
  | { status: "upcoming"; count: number }
  /** Before the migration: nothing was changed. */
  | { status: "unavailable" };

export const deleteMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DeleteBusinessResult> => {
    const client = context.supabase as unknown as SupabaseClient;
    const me = context.userId;

    const { data: studios, error: studiosError } = await client
      .from("studios")
      .select("id")
      .eq("owner_profile_id", me);
    if (studiosError) throw new Error(studiosError.message);
    const ids = ((studios ?? []) as { id: string }[]).map((s) => s.id);

    if (ids.length) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: upcoming, error } = await client
        .from("booking_requests")
        .select("id")
        .in("studio_id", ids)
        .in("status", ["requested", "reviewing", "confirmed"])
        .gte("session_date", today);
      if (error) throw new Error(error.message);
      if (upcoming?.length) return { status: "upcoming", count: upcoming.length };

      const { error: archiveError } = await client
        .from("studios")
        .update({ archived_at: new Date().toISOString() } as never)
        .eq("owner_profile_id", me);
      if (archiveError) {
        if (archiveError.message.includes("archived_at")) return { status: "unavailable" };
        throw new Error(archiveError.message);
      }
    }

    const { error: teamError } = await client
      .from("profile_members")
      .delete()
      .eq("profile_id", me)
      .eq("kind", "team");
    if (teamError) throw new Error(teamError.message);

    const { error } = await client.from("profile_business").delete().eq("profile_id", me);
    if (error) throw new Error(error.message);
    return { status: "deleted" };
  });
