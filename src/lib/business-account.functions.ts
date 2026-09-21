import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Delete business (Manage hub). One account is one business, so this deletes the account's
 * business for good: its studio (rooms, equipment, photos, calendar and reviews go with it), its
 * services, gallery and team, and its profile_business row. Customers keep their own record of
 * past sessions: booking_requests keep the studio's name (20260921230000_deactivate_delete.sql).
 * Refused while a session is still to come. To hide the business for a while instead, the account
 * is deactivated (deactivateMyAccount).
 */

export type DeleteBusinessResult = { status: "deleted" } | { status: "upcoming"; count: number };

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

      // The studio's proof photos live in its own storage folder.
      await Promise.all(
        ids.map(async (id) => {
          const { data: files } = await client.storage.from("studio-media").list(id);
          const paths = (files ?? []).map((f) => `${id}/${f.name}`);
          if (paths.length) await client.storage.from("studio-media").remove(paths);
        }),
      );

      const { error: deleteError } = await client
        .from("studios")
        .delete()
        .eq("owner_profile_id", me);
      if (deleteError) throw new Error(deleteError.message);
    }

    for (const table of ["profile_services", "profile_gallery"]) {
      const { error } = await client.from(table).delete().eq("profile_id", me);
      if (error) throw new Error(error.message);
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
