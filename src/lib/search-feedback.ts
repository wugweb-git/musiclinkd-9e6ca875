import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { ResultKind } from "@/lib/global-search.functions";

/*
 * "Not a good match" on a search result (/search/why/$id), stored as one search_feedback row.
 * Written from the browser so the database fills in who (signed in or not); a signed-in person's
 * own rows move those results down in their later searches (listMySearchFeedback). Unlike search
 * recording this reports failure, so the screen never says "noted" for something it didn't keep.
 * Schema: supabase/migrations/20260921170000_search.sql
 */

export const FEEDBACK_REASONS = [
  { key: "not_relevant", label: "Not relevant" },
  { key: "already_know", label: "Already know them" },
  { key: "wrong_city", label: "Wrong city" },
  { key: "wrong_budget", label: "Wrong budget" },
  { key: "show_less", label: "Show less like this" },
] as const;

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]["key"];

export async function sendSearchFeedback(input: {
  kind: ResultKind;
  id: string;
  query?: string;
  reason: FeedbackReason;
}): Promise<boolean> {
  // search_feedback is not in the generated types yet.
  const client = supabase as unknown as SupabaseClient;
  try {
    const { error } = await client.from("search_feedback").insert({
      subject_kind: input.kind,
      subject_id: input.id,
      reason: input.reason,
      ...(input.query?.trim() ? { query: input.query.trim().slice(0, 80) } : {}),
    });
    return !error;
  } catch {
    return false;
  }
}
