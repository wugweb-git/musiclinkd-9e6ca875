import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Reports: a flag on a review, a marketplace listing, a rental listing or a person, one per person per
 * thing. Only the reporter can read theirs back; the team reads them in the database.
 * Schema: supabase/migrations/20260918210000_reports_prefs_review_requests.sql
 */

const db = (client: unknown) => client as unknown as SupabaseClient;

export type ReportSubject = "review" | "listing" | "rental" | "profile";

export const fileReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        subjectType: z.enum(["review", "listing", "rental", "profile"]),
        subjectId: z.string().min(1).max(120),
        reason: z.string().trim().min(1).max(80),
        detail: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("reports")
      .insert({
        reporter_profile_id: context.userId,
        subject_type: data.subjectType,
        subject_id: data.subjectId,
        reason: data.reason,
        detail: data.detail || null,
      } as never);
    // Reporting the same thing twice is not an error to the person: it's already with the team.
    if (error && error.code !== "23505") throw new Error(error.message);
    return { reported: true };
  });
