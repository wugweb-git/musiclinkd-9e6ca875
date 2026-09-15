// What the business screens render, from a stored business account
// (src/lib/profile-groups.functions.ts). Only what the database holds is filled; everything else is
// empty and the screens skip it. There is no follower or booking count, contact detail, lead,
// analytics figure or verification document in the database.

import { formatPaise, taxonomyLabel } from "@/lib/catalog.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { getPublicBusiness, type BusinessRecord } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";

export type BusinessView = {
  /** The account's username: the id in /business/$id. */
  id: string;
  name: string;
  typeLabel: string;
  verified: boolean;
  cover: string;
  logo: string;
  city: string;
  subtitle: string;
  tagline: string;
  stats: [label: string, value: string][] | null;
  /** Studio rating and review count, when the business has a studio. */
  rating: number | null;
  reviewCount: number | null;
  about: string;
  services: { id: string; label: string; price: string }[];
  hours: { day: string; hours: string }[];
  address: string;
  spaces: {
    id: string;
    name: string;
    rate: string;
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
  reviews: { id: string; author: string; rating: number; body: string; response: string | null }[];
};

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
  return {
    id: profile.username ?? profile.id,
    name: profile.display_name ?? profile.username ?? "",
    typeLabel,
    verified: profile.is_verified,
    cover: business.hero_banner_url ?? profile.cover_url ?? "",
    logo: business.logo_url ?? profile.avatar_url ?? "",
    city: profile.city ?? "",
    subtitle: joinParts(
      typeLabel,
      profile.city,
      business.founded_year ? `since ${business.founded_year}` : "",
    ),
    tagline: profile.headline ?? "",
    // Only a studio stores a rating and review count; followers and bookings are not stored.
    stats: studio
      ? [
          ["Followers", "—"],
          ["Bookings", "—"],
          ["Rating", studio.rating == null ? "—" : String(studio.rating)],
          ["Reviews", String(studio.review_count)],
        ]
      : null,
    rating: studio?.rating ?? null,
    reviewCount: studio ? studio.review_count : null,
    about: profile.bio ?? "",
    services: r.services.map((s) => ({
      id: s.id,
      label: s.name,
      price: formatPaise(s.price_paise, s.price_unit, s.price_note),
    })),
    hours: hoursFrom(business.operating_hours),
    address: business.business_address ?? "",
    spaces: (studio?.rooms ?? []).map((room) => {
      const capacity = room.capacity ? `Up to ${room.capacity}` : "";
      return {
        id: room.id,
        name: room.name,
        rate: formatPaise(room.hourly_rate_paise, "hr"),
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
      rating: rv.rating,
      body: rv.body,
      response: rv.response,
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
