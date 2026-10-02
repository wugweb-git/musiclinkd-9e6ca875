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
  /** What the reviewer picked out ("On time", "Great sound"); absent before 20260918240000. */
  tags?: string[];
};

const SELECT =
  "id, rating, body, context, response, created_at, author_name, author_profile_id, target_profile_id, target_studio_id";

/** What someone may review right now: the studios and people this account has worked with. */
export const listReviewable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = db(context.supabase);
    const [bookings, applications, written, rentals] = await Promise.all([
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
      // A completed rental, either side: the renter reviews the owner, the owner the renter.
      client
        .from("rental_bookings")
        .select(
          "renter_profile_id, renter:profiles!rental_bookings_renter_profile_id_fkey(id, username, display_name), listing:marketplace_listings!inner(title, seller_profile_id, seller:profiles!marketplace_listings_seller_profile_id_fkey(id, username, display_name))",
        )
        .eq("status", "completed"),
    ]);
    if (rentals.error) throw new Error(rentals.error.message);
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

    type RentalPerson = { id: string; username: string | null; display_name: string | null };
    type RentalRow = {
      renter_profile_id: string;
      renter: RentalPerson | null;
      listing: { title: string; seller_profile_id: string; seller: RentalPerson | null };
    };
    const renters = ((rentals.data ?? []) as unknown as RentalRow[]).flatMap((b) => {
      const other = b.renter_profile_id === context.userId ? b.listing.seller : b.renter;
      if (!other || other.id === context.userId || profileDone.has(other.id)) return [];
      return [
        {
          kind: "person" as const,
          id: other.id,
          slug: other.username ?? "",
          name: other.display_name ?? other.username ?? "",
          context: `Rental · ${b.listing.title}`,
        },
      ];
    });

    // The same studio or person can appear once, however many sessions there were.
    const seen = new Set<string>();
    return [...studios, ...people, ...renters].filter((s) => !seen.has(s.id) && seen.add(s.id));
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

/** Correct the wording of a review you wrote. Rating is locked once published — body only. */
export const editMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), body: z.string().trim().min(10).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("reviews")
      .update({ body: data.body } as never)
      .eq("id", data.id)
      .eq("author_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { edited: true };
  });

/** Remove a review you wrote. */
export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("reviews")
      .delete()
      .eq("id", data.id)
      .eq("author_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { deleted: true };
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

/** Public reviews about one profile, for their page. */
export const listReviewsFor = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<ReviewRow[]> => {
    const client = await anonClient();
    const read = (select: string) =>
      client
        .from("reviews")
        .select(select)
        .eq("target_profile_id", data.profileId)
        .order("created_at", { ascending: false });
    // Tags come with 20260918240000_missing_data.sql; before it, the reviews are read without them.
    const tagged = await read(`${SELECT}, tags`);
    const { data: rows, error } = tagged.error ? await read(SELECT) : tagged;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ReviewRow[];
  });

/*
 * Asking for a review. The people you can ask are the ones who could write one about you — an
 * accepted application or a completed rental, either side — and haven't yet. Ask once, remind once
 * a week later; the database holds both rules (could_review_me, the "Remind once" policy), and a
 * trigger tells the person asked. Schema: 20260918210000_reports_prefs_review_requests.sql
 */
export type ReviewAskTarget = {
  id: string;
  name: string;
  photo: string | null;
  context: string;
  askedAt: string | null;
  remindedAt: string | null;
};

export const listReviewAskTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewAskTarget[]> => {
    const client = db(context.supabase);
    type Person = {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    };
    const PERSON = "id, username, display_name, avatar_url";
    const [asApplicant, asPoster, asRenter, asOwner, reviewed, asked] = await Promise.all([
      client
        .from("opportunity_applications")
        .select(
          `opportunity:opportunities!inner(title, creator_profile_id, creator:profiles!opportunities_creator_profile_id_fkey(${PERSON}))`,
        )
        .eq("status", "accepted")
        .eq("applicant_profile_id", context.userId),
      client
        .from("opportunity_applications")
        .select(
          `applicant:profiles!opportunity_applications_applicant_profile_id_fkey(${PERSON}), opportunity:opportunities!inner(title, creator_profile_id)`,
        )
        .eq("status", "accepted")
        .eq("opportunity.creator_profile_id", context.userId),
      client
        .from("rental_bookings")
        .select(
          `listing:marketplace_listings!inner(title, seller:profiles!marketplace_listings_seller_profile_id_fkey(${PERSON}))`,
        )
        .eq("status", "completed")
        .eq("renter_profile_id", context.userId),
      client
        .from("rental_bookings")
        .select(
          `renter:profiles!rental_bookings_renter_profile_id_fkey(${PERSON}), listing:marketplace_listings!inner(title, seller_profile_id)`,
        )
        .eq("status", "completed")
        .eq("listing.seller_profile_id", context.userId),
      client.from("reviews").select("author_profile_id").eq("target_profile_id", context.userId),
      client
        .from("review_requests")
        .select("asked_profile_id, asked_at, reminded_at")
        .eq("requester_profile_id", context.userId),
    ]);
    for (const r of [asApplicant, asPoster, asRenter, asOwner, reviewed, asked])
      if (r.error) throw new Error(r.error.message);

    type Row = {
      opportunity: { title: string; creator: Person | null };
      applicant: Person | null;
      listing: { title: string; seller: Person | null };
      renter: Person | null;
      author_profile_id: string;
      asked_profile_id: string;
      asked_at: string;
      reminded_at: string | null;
    };
    const rows = (r: { data: unknown }) => (r.data ?? []) as Row[];
    const pairs: { who: Person | null; context: string }[] = [
      ...rows(asApplicant).map((a) => ({
        who: a.opportunity.creator,
        context: a.opportunity.title,
      })),
      ...rows(asPoster).map((a) => ({ who: a.applicant, context: a.opportunity.title })),
      ...rows(asRenter).map((b) => ({
        who: b.listing.seller,
        context: `Rental · ${b.listing.title}`,
      })),
      ...rows(asOwner).map((b) => ({ who: b.renter, context: `Rental · ${b.listing.title}` })),
    ];

    const done = new Set(rows(reviewed).map((r) => r.author_profile_id));
    const asks = new Map(
      rows(asked).map((r) => [
        r.asked_profile_id,
        { askedAt: r.asked_at, remindedAt: r.reminded_at },
      ]),
    );
    const seen = new Set<string>();
    return pairs.flatMap(({ who, context: why }) => {
      if (!who || who.id === context.userId || done.has(who.id) || seen.has(who.id)) return [];
      seen.add(who.id);
      const ask = asks.get(who.id);
      return [
        {
          id: who.id,
          name: who.display_name ?? who.username ?? "",
          photo: who.avatar_url,
          // review_requests.context holds 120 characters; a long title is cut to fit.
          context: why.length > 120 ? `${why.slice(0, 119)}…` : why,
          askedAt: ask?.askedAt ?? null,
          remindedAt: ask?.remindedAt ?? null,
        },
      ];
    });
  });

/** Ask, or — a week after asking — send the one reminder. */
export const askForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        profileId: z.string().uuid(),
        context: z.string().max(120).optional(),
        remind: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    if (data.remind) {
      const { data: rows, error } = await client
        .from("review_requests")
        .update({ reminded_at: new Date().toISOString() } as never)
        .eq("requester_profile_id", context.userId)
        .eq("asked_profile_id", data.profileId)
        .select("asked_profile_id");
      if (error) throw new Error(error.message);
      if (!rows?.length) throw new Error("A reminder can go once, a week after asking.");
      return { reminded: true };
    }
    const { error } = await client.from("review_requests").insert({
      requester_profile_id: context.userId,
      asked_profile_id: data.profileId,
      context: data.context ?? null,
    } as never);
    if (error) {
      if (error.code === "23505") throw new Error("You've already asked them.");
      throw new Error(
        error.code === "42501" ? "You can ask once you have worked together." : error.message,
      );
    }
    return { asked: true };
  });
