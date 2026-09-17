import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Reviews follow real work: a studio you had a confirmed session with, or a person whose
 * application you accepted (or who accepted yours). The database decides that, not the screen —
 * see can_review_profile / can_review_studio in
 * supabase/migrations/20260918110000_reviews_write.sql. One review per subject, and the reviewed
 * party may reply.
 */

/** The generated types cover two tables; every other table is read through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

export type ReviewRow = {
  id: string;
  rating: number;
  body: string;
  context: string | null;
  response: string | null;
  created_at: string;
  author_name: string;
  author_profile_id: string | null;
  target_profile_id: string | null;
  target_studio_id: string | null;
};

const SELECT =
  "id, rating, body, context, response, created_at, author_name, author_profile_id, target_profile_id, target_studio_id";

/** What someone may review right now: the studios and people this account has worked with. */
export const listReviewable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = db(context.supabase);
    const [bookings, applications, written] = await Promise.all([
      client
        .from("booking_requests")
        .select("studio_id, session_date, studio:studios(id, slug, name)")
        .eq("requester_profile_id", context.userId)
        .in("status", ["confirmed", "completed"]),
      client
        .from("opportunity_applications")
        .select(
          "id, applicant_profile_id, opportunity:opportunities(id, title, creator_profile_id, creator:profiles!opportunities_creator_profile_id_fkey(id, username, display_name, avatar_url))",
        )
        .eq("status", "accepted"),
      client
        .from("reviews")
        .select("target_profile_id, target_studio_id")
        .eq("author_profile_id", context.userId),
    ]);
    if (bookings.error) throw new Error(bookings.error.message);
    if (applications.error) throw new Error(applications.error.message);
    if (written.error) throw new Error(written.error.message);

    const done = (written.data ?? []) as {
      target_profile_id: string | null;
      target_studio_id: string | null;
    }[];
    const studioDone = new Set(done.map((r) => r.target_studio_id).filter(Boolean));
    const profileDone = new Set(done.map((r) => r.target_profile_id).filter(Boolean));

    type BookingRow = {
      studio_id: string;
      session_date: string;
      studio: { id: string; slug: string; name: string } | null;
    };
    const studios = ((bookings.data ?? []) as unknown as BookingRow[])
      .filter((b) => b.studio && !studioDone.has(b.studio_id))
      .map((b) => ({
        kind: "studio" as const,
        id: b.studio_id,
        slug: b.studio!.slug,
        name: b.studio!.name,
        context: `Session on ${b.session_date}`,
      }));

    type ApplicationRow = {
      applicant_profile_id: string;
      opportunity: {
        title: string;
        creator_profile_id: string;
        creator: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
        } | null;
      } | null;
    };
    // Whoever the other side was: the poster who accepted you, or the applicant you accepted.
    const people = ((applications.data ?? []) as unknown as ApplicationRow[]).flatMap((a) => {
      const poster = a.opportunity?.creator;
      if (!a.opportunity || !poster) return [];
      const other =
        a.applicant_profile_id === context.userId
          ? {
              id: poster.id,
              name: poster.display_name ?? poster.username ?? "",
              username: poster.username,
            }
          : null;
      return other && !profileDone.has(other.id)
        ? [
            {
              kind: "person" as const,
              id: other.id,
              slug: other.username ?? "",
              name: other.name,
              context: a.opportunity.title,
            },
          ]
        : [];
    });

    // The same studio or person can appear once, however many sessions there were.
    const seen = new Set<string>();
    return [...studios, ...people].filter((s) => !seen.has(s.id) && seen.add(s.id));
  });

/** Write one. The database refuses anything this account has not actually worked with. */
export const writeReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        targetProfileId: z.string().uuid().optional(),
        targetStudioId: z.string().uuid().optional(),
        rating: z.number().int().min(1).max(5),
        body: z.string().trim().min(10).max(2000),
        context: z.string().max(120).optional(),
        authorName: z.string().trim().min(1).max(80),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!data.targetProfileId && !data.targetStudioId) throw new Error("Nothing to review.");
    const { error } = await db(context.supabase)
      .from("reviews")
      .insert({
        author_profile_id: context.userId,
        author_name: data.authorName,
        target_profile_id: data.targetProfileId ?? null,
        target_studio_id: data.targetStudioId ?? null,
        rating: data.rating,
        body: data.body,
        context: data.context ?? null,
      } as never);
    if (error) {
      if (error.code === "23505") throw new Error("You have already reviewed this.");
      throw new Error(
        error.code === "42501"
          ? "You can review someone once you have worked together."
          : error.message,
      );
    }
    return { written: true };
  });

/** The reviews this account has written. */
export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewRow[]> => {
    const { data, error } = await db(context.supabase)
      .from("reviews")
      .select(SELECT)
      .eq("author_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ReviewRow[];
  });

/** The reviews written about this account, for the Reviews screen. */
export const listReviewsAboutMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewRow[]> => {
    const { data, error } = await db(context.supabase)
      .from("reviews")
      .select(SELECT)
      .eq("target_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ReviewRow[];
  });

/** Answer a review written about you, or about a studio you own. */
export const replyToReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), response: z.string().trim().min(1).max(1000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("reviews")
      .update({ response: data.response } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { replied: true };
  });

/** Public reviews about one profile, for their page. */
export const listReviewsFor = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<ReviewRow[]> => {
    const client = await anonClient();
    const { data: rows, error } = await client
      .from("reviews")
      .select(SELECT)
      .eq("target_profile_id", data.profileId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ReviewRow[];
  });
