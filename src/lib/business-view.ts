// What the business screens render, from a stored business account
// (src/lib/profile-groups.functions.ts). Only what the database holds is filled; everything else is
// empty and the screens skip it. There is no follower or booking count, contact detail, lead,
// analytics figure or verification document in the database.

import { taxonomyLabel } from "@/lib/catalog.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import { getPublicBusiness, type BusinessRecord } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";

export type BusinessView = {
  /** The account's username: the id in /business/$id. */
  id: string;
  /** profiles.id, to tell the owner apart. */
  profileId: string;
  name: string;
  typeLabel: string;
  verified: boolean;
  cover: string;
  logo: string;
  city: string;
  subtitle: string;
  /** Real follower count; null before the column exists. */
  followers: number | null;
  tagline: string;
  stats: [label: string, value: string][] | null;
  /** Across the account's own reviews and its studio's; null while there are none. */
  rating: number | null;
  reviewCount: number | null;
  about: string;
  /** The registered name, when it differs from how the business is known. */
  legalName: string;
  services: {
    id: string;
    label: string;
    price: PriceParts | null;
    category: string;
    status: "active" | "paused" | "draft";
  }[];
  hours: { day: string; hours: string }[];
  address: string;
  /** The business's Google Maps link, opened for directions. */
  mapsUrl: string | null;
  spaces: {
    id: string;
    name: string;
    rate: PriceParts | null;
    capacity: string;
    detail: string;
    gear: string[];
    photo: string;
  }[];
  members: {
    id: string;
    name: string;
    photo: string;
    role: string;
    since: number | null;
    detail: string;
    invited: boolean;
  }[];
  credits: { id: string; title: string; meta: string }[];
  gallery: string[];
  reviews: {
    id: string;
    author: string;
    org: string;
    context: string;
    rating: number;
    body: string;
    response: string | null;
    tags: string[];
  }[];
};

/**
 * One rating over the account's reviews and its studio's, weighted by how many each has. The
 * database keeps both (profiles.rating/review_count, studios.rating/review_count).
 */
function combinedRating(
  parts: { rating: number | string | null | undefined; count: number | null | undefined }[],
): { rating: number | null; count: number } {
  let count = 0;
  let sum = 0;
  for (const p of parts) {
    if (!p.count || p.rating == null) continue;
    count += p.count;
    sum += Number(p.rating) * p.count;
  }
  return { rating: count ? Math.round((sum / count) * 10) / 10 : null, count };
}

/** Stored hours are one line per day, "Day: hours"; a line without a day is shown whole. */
function hoursFrom(text: string | null) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^(.+?): (.+)$/.exec(line);
      return m ? { day: m[1]!, hours: m[2]! } : { day: "", hours: line };
    });
}

export function businessViewFromRecord(r: BusinessRecord, labels: TaxonomyLabels): BusinessView {
  const { profile, business, studio } = r;
  const role = profile.roles?.[0];
  const typeLabel = role ? taxonomyLabel(labels, "person_types", role) : "";
  const place = profile.city ?? "";
  const reviews = combinedRating([
    { rating: profile.rating, count: profile.review_count },
    { rating: studio?.rating, count: studio?.review_count },
  ]);
  const legalName = business.legal_name?.trim() ?? "";
  return {
    id: profile.username ?? profile.id,
    profileId: profile.id,
    name: profile.display_name ?? profile.username ?? "",
    typeLabel,
    verified: profile.is_verified,
    cover: business.hero_banner_url ?? profile.cover_url ?? "",
    // The business's logo is its profile picture (owner, 21 Sep 2026); the old logo field only fills in.
    logo: profile.avatar_url ?? business.logo_url ?? "",
    city: place,
    followers: profile.followers_count ?? null,
    subtitle: joinParts(
      typeLabel,
      place,
      business.founded_year ? `since ${business.founded_year}` : "",
    ),
    tagline: profile.headline ?? "",
    // Followers and reviews are kept by the database; bookings are not counted, so they read "—".
    // Before followers_count exists, only a studio has figures to show.
    stats:
      profile.followers_count != null || studio
        ? [
            [
              "Followers",
              profile.followers_count == null
                ? "—"
                : profile.followers_count.toLocaleString("en-IN"),
            ],
            ["Bookings", "—"],
            ["Rating", reviews.rating == null ? "—" : reviews.rating.toFixed(1)],
            ["Reviews", String(reviews.count)],
          ]
        : null,
    rating: reviews.rating,
    reviewCount: reviews.count || (studio ? 0 : null),
    about: profile.bio ?? "",
    legalName: legalName && legalName !== profile.display_name ? legalName : "",
    services: r.services.map((s) => ({
      id: s.id,
      label: s.name,
      price: priceParts(s.price_paise, s.price_unit, s.price_note),
      category: s.category ? taxonomyLabel(labels, "service_categories", s.category) : "",
      status: s.status,
    })),
    hours: hoursFrom(business.operating_hours),
    address: business.business_address ?? "",
    mapsUrl: business.maps_url ?? null,
    spaces: (studio?.rooms ?? []).map((room) => {
      const capacity = room.capacity ? `Up to ${room.capacity}` : "";
      return {
        id: room.id,
        name: room.name,
        rate: priceParts(room.hourly_rate_paise, "hr"),
        capacity,
        detail: joinParts(room.kind, capacity),
        gear: room.gear,
        photo: room.photo_url ?? "",
      };
    }),
    members: r.team.map((m) => ({
      id: m.id,
      name: m.name,
      photo: m.photo_url ?? "",
      role: m.role ?? "",
      since: m.since_year,
      detail: joinParts(m.role, m.since_year ? `since ${m.since_year}` : "", m.experience),
      invited: m.status === "invited",
    })),
    credits: r.credits.map((c) => ({
      id: c.id,
      title: c.title,
      meta: joinParts(c.role, c.release_year ? String(c.release_year) : ""),
    })),
    gallery: r.gallery.map((g) => g.image_url),
    reviews: r.reviews.map((rv) => ({
      id: rv.id,
      author: rv.author_name,
      org: rv.author_org ?? "",
      context: rv.context ?? "",
      rating: rv.rating,
      body: rv.body,
      response: rv.response,
      tags: rv.tags,
    })),
  };
}

/**
 * Loader for the business screens: the business account whose username is the route id, with
 * taxonomy labels. A failed read is treated as not found; without labels the type shows its slug.
 */
export async function loadBusiness(id: string) {
  const [record, labels] = await Promise.all([
    getPublicBusiness({ data: { username: id } }).catch(() => null),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return { record, labels };
}

/** The view for a loader result, or undefined when there is no such business. */
export function businessView(data: { record: BusinessRecord | null; labels: TaxonomyLabels }) {
  return data.record ? businessViewFromRecord(data.record, data.labels) : undefined;
}
