import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import { parsePlace, samePinArea } from "@/lib/place";
import { recommendPrefsOf } from "@/lib/discovery-settings";

/*
 * Recommendations, ranked from what the signed-in person has actually told us and done: the roles,
 * genres, instruments and city on their profile, who they follow, what they saved, the
 * opportunities they opened or applied to, and the studios and rentals they booked. Every pick
 * carries the reason it scored — never a black box, never an invented one. Nothing here writes.
 *
 * Candidates are the live rows (public profiles, open opportunities, studios, listings). A person
 * who turned off "Appear in Discover" (profiles.discovery_prefs.appear = false) is never suggested.
 *
 * Discovery settings (profiles.discovery_prefs.recommend, src/lib/discovery-settings.ts) steer it:
 * roles narrow people to those roles, genres and cities stand in for the profile's own, the radius
 * keeps picks near the viewer or in their cities, and people skipped on the deck stay out.
 */

export type RecommendedPerson = DirectoryPerson & {
  reason: string;
  /** Every reason that scored, strongest first; `reason` is the first. */
  reasons: string[];
  score: number;
  /** profiles.availability as stored ("Shows", "Session Work"); null when not set. */
  availability: string | null;
};
export type RecommendedPick = { id: string; reason: string; score: number };

export type Recommendations = {
  /** The viewer's own city, as stored on their profile; null when not set. */
  city: string | null;
  /** True once the viewer has at least one signal to rank by. */
  hasSignals: boolean;
  people: RecommendedPerson[];
  opportunities: RecommendedPick[];
  studios: RecommendedPick[];
  listings: RecommendedPick[];
};

type Me = {
  id: string;
  city: string | null;
  pin_code?: string | null;
  roles: string[] | null;
  genres: string[] | null;
  instruments: string[] | null;
  discovery_prefs?: unknown;
};

type Candidate = {
  id: string;
  username: string | null;
  display_name: string | null;
  headline: string | null;
  city: string | null;
  pin_code: string | null;
  roles: string[] | null;
  genres: string[] | null;
  instruments: string[] | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  rating: number | string | null;
  review_count: number | null;
  discovery_prefs: { appear?: boolean } | null;
  availability: string | null;
};

const lower = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
const sameCity = (a: string | null | undefined, b: string | null | undefined) => {
  const x = lower(a);
  const y = lower(b);
  return Boolean(x && y && (x === y || y.includes(x) || x.includes(y)));
};
const overlap = (a: string[] | null | undefined, b: string[] | null | undefined) => {
  const set = new Set(a ?? []);
  return (b ?? []).filter((v) => set.has(v));
};
/** Word stems of a label, for matching free-text fields like opportunities.role_required. */
const stems = (label: string) =>
  lower(label)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4)
    .map((w) => w.slice(0, 5));

function listOf(values: string[], max = 2) {
  const shown = values.slice(0, max);
  return values.length > max ? `${shown.join(", ")} and more` : shown.join(" and ");
}

/** The strongest reason wins the line; ties go to the first one added. */
class Scored {
  score = 0;
  private all: { weight: number; text: string }[] = [];
  add(weight: number, text: string) {
    this.score += weight;
    this.all.push({ weight, text });
  }
  /** Strongest first; a stable sort keeps ties in the order they were added. */
  get reasons() {
    return [...this.all].sort((a, b) => b.weight - a.weight).map((r) => r.text);
  }
  get reason() {
    return this.reasons[0] ?? "";
  }
}

async function rowsOf<T>(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  // A table the viewer cannot read (or one not there yet) is one missing signal, not a failure.
  try {
    const { data, error } = await query;
    return error ? [] : ((data ?? []) as T[]);
  } catch {
    return [];
  }
}

export const getMyRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Recommendations> => {
    const client = context.supabase as unknown as SupabaseClient;
    const me = context.userId;

    const { data: meRow } = await client
      .from("profiles")
      .select("id, city, pin_code, roles, genres, instruments, discovery_prefs")
      .eq("id", me)
      .maybeSingle();
    const profile = (meRow as Me | null) ?? {
      id: me,
      city: null,
      roles: [],
      genres: [],
      instruments: [],
    };

    // Opportunity views are written by the server and have no read policy; only the viewer's own
    // rows are read, with the server's key.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;

    const [
      labelsRows,
      followingRows,
      savedRows,
      appliedRows,
      viewedRows,
      myOpportunities,
      bookedStudios,
      rentedListings,
      candidates,
      opportunities,
      studios,
      listings,
    ] = await Promise.all([
      rowsOf<{ category_key: string; slug: string; label: string }>(
        client
          .from("taxonomy_options")
          .select("category_key, slug, label")
          .in("category_key", ["person_types", "genres", "instruments"]),
      ),
      rowsOf<{ target_id: string }>(
        client.from("follows").select("target_id").eq("follower_id", me),
      ),
      rowsOf<{ target_type: string; target_id: string }>(
        client.from("saved_items").select("target_type, target_id").eq("user_id", me),
      ),
      rowsOf<{ opportunity_id: string }>(
        client
          .from("opportunity_applications")
          .select("opportunity_id")
          .eq("applicant_profile_id", me),
      ),
      rowsOf<{ opportunity_id: string }>(
        admin
          .from("opportunity_views")
          .select("opportunity_id")
          .eq("viewer_id", me)
          .order("viewed_at", { ascending: false })
          .limit(200),
      ),
      rowsOf<{ role_required: string | null; genres: string[] | null }>(
        client
          .from("opportunities")
          .select("role_required, genres")
          .eq("creator_profile_id", me)
          .eq("status", "open"),
      ),
      rowsOf<{ studio_id: string }>(
        client.from("booking_requests").select("studio_id").eq("requester_profile_id", me),
      ),
      rowsOf<{ listing_id: string }>(
        client.from("rental_bookings").select("listing_id").eq("renter_profile_id", me),
      ),
      rowsOf<Candidate>(
        client
          .from("profiles")
          .select(
            "id, username, display_name, headline, city, pin_code, roles, genres, instruments, avatar_url, is_verified, rating, review_count, discovery_prefs, availability",
          )
          .eq("visibility", "public")
          .neq("id", me)
          .not("username", "is", null)
          .limit(400),
      ),
      rowsOf<{
        id: string;
        creator_profile_id: string;
        role_required: string | null;
        genres: string[] | null;
        location: string | null;
      }>(
        client
          .from("opportunities")
          .select("id, creator_profile_id, role_required, genres, location")
          .eq("status", "open")
          .limit(300),
      ),
      rowsOf<{
        id: string;
        owner_profile_id: string | null;
        location: string | null;
        services: string[] | null;
        rating: number | string | null;
      }>(
        // Archived studios (a deleted business) are never suggested; before that column exists,
        // every studio is live.
        (async () => {
          const columns = "id, owner_profile_id, location, services, rating";
          const live = await client.from("studios").select(columns).is("archived_at", null);
          return live.error?.message.includes("archived_at")
            ? client.from("studios").select(columns)
            : live;
        })(),
      ),
      rowsOf<{
        id: string;
        seller_profile_id: string | null;
        item_category: string | null;
        category: string | null;
        pickup_location: string | null;
      }>(
        client
          .from("marketplace_listings")
          .select("id, seller_profile_id, item_category, category, pickup_location")
          .limit(400),
      ),
    ]);

    const labels: Record<string, Record<string, string>> = {};
    for (const r of labelsRows) (labels[r.category_key] ??= {})[r.slug] = r.label;
    const label = (category: string, slug: string) => labels[category]?.[slug] ?? slug;

    const following = new Set(followingRows.map((r) => r.target_id));
    const saved = (type: string) =>
      new Set(savedRows.filter((r) => r.target_type === type).map((r) => r.target_id));
    const savedTalent = saved("talent");
    const savedStudios = saved("studio");
    const savedListings = saved("listing");
    const applied = new Set(appliedRows.map((r) => r.opportunity_id));
    const viewed = new Set(viewedRows.map((r) => r.opportunity_id));

    const prefs = recommendPrefsOf(profile.discovery_prefs);
    const skipped = new Set(prefs.skipped);
    const myRoles = profile.roles ?? [];
    // Genres picked in discovery settings stand in for the profile's own.
    const myGenres = prefs.genres.length ? prefs.genres : (profile.genres ?? []);
    const genreReason = prefs.genres.length ? "Works in" : "Also works in";
    const myInstruments = profile.instruments ?? [];
    const myCity = profile.city?.trim() || null;
    const myPin = profile.pin_code ?? null;
    /** A city from discovery settings the place is in, if any. */
    const wantedCity = (place: string | null | undefined) =>
      prefs.cities.find((c) => sameCity(c, place)) ?? null;
    /** The radius from discovery settings: near is the viewer's PIN area, city their city. */
    const inReach = (pin: string | null | undefined, place: string | null | undefined) => {
      if (prefs.radius === "anywhere") return true;
      if (wantedCity(place)) return true;
      if (prefs.radius === "near" && myPin) return samePinArea(myPin, pin ?? null);
      return Boolean(myCity && sameCity(myCity, place));
    };

    // What the people the viewer follows and saved have in common, as roles to lean towards.
    const likedRoles = new Map<string, number>();
    for (const c of candidates) {
      if (!following.has(c.id) && !savedTalent.has(c.id)) continue;
      for (const r of c.roles ?? []) likedRoles.set(r, (likedRoles.get(r) ?? 0) + 1);
    }
    // Roles the viewer is casting for, from their own open opportunities (free text).
    const castingStems = new Set(myOpportunities.flatMap((o) => stems(o.role_required ?? "")));

    /* People ------------------------------------------------------------------------------ */
    const people: RecommendedPerson[] = [];
    for (const c of candidates) {
      if (following.has(c.id) || savedTalent.has(c.id) || skipped.has(c.id)) continue;
      if (c.discovery_prefs?.appear === false || !c.username) continue;
      if (!inReach(c.pin_code, c.city)) continue;
      const s = new Scored();
      if (prefs.roles.length) {
        const wanted = (c.roles ?? []).find((r) => prefs.roles.includes(r));
        if (!wanted) continue;
        s.add(3, `${label("person_types", wanted)}, a role you asked for`);
      }
      const casting = (c.roles ?? []).find((r) =>
        stems(label("person_types", r)).some((w) => castingStems.has(w)),
      );
      if (casting) s.add(5, `Fits the role you posted: ${label("person_types", casting)}`);
      const genres = overlap(myGenres, c.genres);
      if (genres.length)
        s.add(2 * genres.length, `${genreReason} ${listOf(genres.map((g) => label("genres", g)))}`);
      const roles = overlap(myRoles, c.roles);
      if (roles.length)
        s.add(2 * roles.length, `Also a ${label("person_types", roles[0]!).toLowerCase()}`);
      const instruments = overlap(myInstruments, c.instruments);
      if (instruments.length)
        s.add(
          instruments.length,
          `Plays ${listOf(instruments.map((i) => label("instruments", i)))}`,
        );
      const liked = (c.roles ?? []).reduce((n, r) => n + (likedRoles.get(r) ?? 0), 0);
      if (liked)
        s.add(
          Math.min(liked, 3),
          `Like people you follow: ${label(
            "person_types",
            (c.roles ?? []).find((r) => likedRoles.has(r))!,
          )}`,
        );
      // The PIN code is a radius, never shown: same postal district is nearer than same city.
      if (samePinArea(myPin, c.pin_code)) s.add(4, "Near you");
      else if (myCity && sameCity(myCity, c.city)) s.add(3, `Also in ${c.city}`);
      else if (wantedCity(c.city)) s.add(3, `In ${c.city}`);
      if (!s.score) continue;
      if (c.is_verified) s.score += 0.5;
      const reviewCount = c.review_count ?? 0;
      people.push({
        id: c.id,
        username: c.username,
        name: c.display_name ?? c.username,
        headline: c.headline,
        city: c.city,
        roles: c.roles ?? [],
        genres: c.genres ?? [],
        avatarUrl: c.avatar_url,
        verified: Boolean(c.is_verified),
        pin_code: c.pin_code ?? null,
        rating: reviewCount && c.rating != null ? Number(c.rating) : null,
        reviewCount,
        reason: s.reason,
        reasons: s.reasons,
        score: s.score,
        availability: c.availability?.trim() || null,
      });
    }
    people.sort((a, b) => b.score - a.score);

    /* Opportunities ------------------------------------------------------------------------ */
    const skillStems = new Set(
      [
        ...myRoles.map((r) => label("person_types", r)),
        ...myInstruments.map((i) => label("instruments", i)),
      ].flatMap(stems),
    );
    const opportunityPicks: RecommendedPick[] = [];
    for (const o of opportunities) {
      if (o.creator_profile_id === me || applied.has(o.id)) continue;
      if (!inReach(null, o.location)) continue;
      const s = new Scored();
      const role = (o.role_required ?? "")
        .split(/,\s*/)
        .find((part) => stems(part).some((w) => skillStems.has(w)));
      if (role) s.add(5, `Matches your skills: ${role.trim()}`);
      const genres = overlap(myGenres, o.genres);
      if (genres.length)
        s.add(2 * genres.length, `In ${listOf(genres.map((g) => label("genres", g)))}`);
      if (myCity && sameCity(myCity, o.location)) s.add(3, `In ${myCity}`);
      else if (wantedCity(o.location)) s.add(3, `In ${wantedCity(o.location)}`);
      if (viewed.has(o.id)) s.add(1, "You opened this one");
      if (s.score) opportunityPicks.push({ id: o.id, reason: s.reason, score: s.score });
    }
    opportunityPicks.sort((a, b) => b.score - a.score);

    /* Studios -------------------------------------------------------------------------------- */
    const booked = new Set(bookedStudios.map((b) => b.studio_id));
    const bookedServices = new Set(
      studios
        .filter((st) => booked.has(st.id) || savedStudios.has(st.id))
        .flatMap((st) => st.services ?? []),
    );
    const studioPicks: RecommendedPick[] = [];
    for (const st of studios) {
      if (st.owner_profile_id === me) continue;
      if (!inReach(parsePlace(st.location).pin, st.location)) continue;
      const s = new Scored();
      if (booked.has(st.id)) s.add(2, "You booked here before");
      const services = (st.services ?? []).filter((v) => bookedServices.has(v));
      if (services.length && !booked.has(st.id) && !savedStudios.has(st.id))
        s.add(2, `Offers ${listOf(services)}, like studios you used`);
      if (samePinArea(myPin, parsePlace(st.location).pin)) s.add(4, "Near you");
      else if (myCity && sameCity(myCity, st.location)) s.add(3, `In ${myCity}`);
      else if (wantedCity(st.location)) s.add(3, `In ${wantedCity(st.location)}`);
      if (!s.score) continue;
      s.score += Number(st.rating ?? 0) / 10;
      studioPicks.push({ id: st.id, reason: s.reason, score: s.score });
    }
    studioPicks.sort((a, b) => b.score - a.score);

    /* Listings ------------------------------------------------------------------------------- */
    const rented = new Set(rentedListings.map((r) => r.listing_id));
    const had = listings.filter((l) => rented.has(l.id) || savedListings.has(l.id));
    const hadCategories = new Set(had.map((l) => l.item_category).filter(Boolean));
    const listingPicks: RecommendedPick[] = [];
    for (const l of listings) {
      if (l.seller_profile_id === me || rented.has(l.id) || savedListings.has(l.id)) continue;
      const s = new Scored();
      if (l.item_category && myInstruments.includes(l.item_category))
        s.add(4, `For your ${label("instruments", l.item_category).toLowerCase()}`);
      if (l.item_category && hadCategories.has(l.item_category))
        s.add(3, "Like what you saved or rented");
      if (myCity && sameCity(myCity, l.pickup_location)) s.add(2, `Pickup in ${myCity}`);
      if (s.score) listingPicks.push({ id: l.id, reason: s.reason, score: s.score });
    }
    listingPicks.sort((a, b) => b.score - a.score);

    return {
      city: myCity,
      hasSignals: Boolean(
        myCity ||
        prefs.roles.length ||
        prefs.cities.length ||
        myRoles.length ||
        myGenres.length ||
        myInstruments.length ||
        following.size ||
        savedRows.length ||
        appliedRows.length ||
        viewedRows.length,
      ),
      people: people.slice(0, 24),
      opportunities: opportunityPicks.slice(0, 40),
      studios: studioPicks.slice(0, 24),
      listings: listingPicks.slice(0, 40),
    };
  });
