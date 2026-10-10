// What the business screens render, from a stored business account
// (src/lib/profile-groups.functions.ts). Only what the database holds is filled; everything else is
// empty and the screens skip it. There is no follower or booking count, contact detail, lead,
// analytics figure or verification document in the database.

import { taxonomyLabel } from "@/lib/catalog.functions";
import type { ServiceItem } from "@/data/profile";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import { asLinkMap } from "@/lib/profile-map";
import { getPublicBusiness, type BusinessRecord } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";
import { isTimeBasedService } from "@/lib/service-time";

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
  /** "since 2012"; empty when the year isn't known. */
  since: string;
  /** The business's own website (profiles.links.website), opened in a new tab. */
  website: string | null;
  subtitle: string;
  /** Real follower count; null before the column exists. */
  followers: number | null;
  tagline: string;
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
    status: "active" | "paused" | "draft";
    /** The shared ServiceCard's shape, with what a studio's service uses. */
    card: ServiceItem;
  }[];
  hours: { day: string; hours: string }[];
  /** The business's rules, one per entry. */
  policies: string[];
  /** Its studio's slug when it has one: Book opens /booking/<slug>. */
  studioSlug: string | null;
  /** What the place has, each with its proof photos. */
  amenities: { slug: string; label: string; photos: string[] }[];
  /** Its gear: make and model, type, quantity, included or extra, and photos. */
  equipment: {
    id: string;
    name: string;
    type: string;
    quantity: number | null;
    included: boolean;
    photos: string[];
  }[];
  address: string;
  /** The business's Google Maps link, opened for directions. */
  mapsUrl: string | null;
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

/** A stored website as a link: "yourname.com" gains https://; anything not http(s) is dropped. */
function websiteOf(links: unknown): string | null {
  const raw = asLinkMap(links)["website"]?.trim();
  if (!raw) return null;
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(url).protocol.startsWith("http") ? url : null;
  } catch {
    return null;
  }
}

function photosOf(
  photos: NonNullable<BusinessRecord["studio"]>["photos"] | undefined,
  kind: "amenity" | "equipment",
  id: string,
) {
  return (photos ?? [])
    .filter((p) => p.subject_type === kind && p.subject_id === id)
    .map((p) => p.url);
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
    since: business.founded_year ? `since ${business.founded_year}` : "",
    website: websiteOf(profile.links),
    followers: profile.followers_count ?? null,
    subtitle: joinParts(
      typeLabel,
      place,
      business.founded_year ? `since ${business.founded_year}` : "",
    ),
    tagline: profile.headline ?? "",
    rating: reviews.rating,
    reviewCount: reviews.count || (studio ? 0 : null),
    about: profile.bio ?? "",
    legalName: legalName && legalName !== profile.display_name ? legalName : "",
    services: r.services.map((s) => {
      const price = priceParts(s.price_paise, s.price_unit, s.price_note);
      const uses = [
        ...(s.amenity_slugs ?? []).map((a) => taxonomyLabel(labels, "amenities", a)),
        ...(s.equipment_ids ?? [])
          .map((id) => studio?.equipment.find((e) => e.id === id)?.name)
          .filter((n): n is string => Boolean(n)),
      ];
      return {
        id: s.id,
        label: s.name,
        price,
        status: s.status,
        card: {
          id: s.id,
          name: s.name,
          description: s.description ?? "",
          ...(price ? { from: price } : {}),
          ...(s.turnaround ? { turnaround: s.turnaround } : {}),
          deliverables: s.deliverables ?? [],
          ...(uses.length ? { uses } : {}),
          timeBased: isTimeBasedService(s.work_modes),
        },
      };
    }),
    hours: hoursFrom(business.operating_hours),
    policies: (business.policies ?? []).filter((p) => p.trim()),
    studioSlug: studio?.slug ?? null,
    amenities: (studio?.amenities ?? []).map((slug) => ({
      slug,
      label: taxonomyLabel(labels, "amenities", slug),
      photos: photosOf(studio?.photos, "amenity", slug),
    })),
    equipment: (studio?.equipment ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      type: e.category
        ? (labels["equipment_categories"]?.[e.category] ??
          labels["instruments"]?.[e.category] ??
          e.category)
        : "",
      quantity: e.quantity,
      included: e.included !== false,
      photos: photosOf(studio?.photos, "equipment", e.id),
    })),
    address: business.business_address ?? "",
    mapsUrl: business.maps_url ?? null,
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
