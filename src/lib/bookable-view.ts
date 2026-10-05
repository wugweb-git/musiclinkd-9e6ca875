import type { AddOn, Bookable } from "@/data/booking";
import { taxonomyLabel, type BookableRow } from "@/lib/catalog.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import { hasWeeklyHours, type WeeklyHours } from "@/lib/bookable-slots";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";
import type { BookablePhoto } from "@/lib/bookable-photos.functions";
import { parsePlace, shownPlace } from "@/lib/place";

/*
 * Database studios shaped for the existing studio screens. Only fields the database holds are
 * filled; everything else is a neutral empty value ("", 0, []) that the render paths skip.
 * There is no tax, distance or timezone. The availability calendar is on once the studio has
 * weekly hours (studios.weekly_hours, src/lib/bookable-slots.ts). A rating shows only once the
 * studio has reviews (studios.rating is kept from them by the database).
 */

export type DiscoverBookable = {
  id: string;
  slug: string;
  /** The owning business account's username, which is the studio's profile. */
  username: string;
  /** The owning business account's profile id: what Follow on the card targets. */
  ownerId?: string | null | undefined;
  name: string;
  location: string;
  rating: number | null;
  reviewCount: number;
  /** The verified badge, next to the name — set by MusicLinkd, not the owner. */
  verified: boolean;
  rate: PriceParts | null;
  photo: string;
  gear: string[];
};

export function discoverBookableFromRow(
  row: BookableRow,
  labels: TaxonomyLabels,
): DiscoverBookable {
  return {
    id: row.id,
    slug: row.slug,
    username: row.owner?.username ?? "",
    ownerId: row.owner?.id ?? null,
    name: row.name,
    location: shownPlace(row.location),
    rating: row.rating == null || !row.review_count ? null : Number(row.rating),
    reviewCount: row.review_count,
    verified: row.verified_gold,
    rate: priceParts(row.hourly_rate_paise, "hr"),
    photo: row.image_url ?? "",
    gear: row.equipment.length
      ? row.equipment.map((e) => e.name)
      : row.amenities.map((a) => taxonomyLabel(labels, "amenities", a)),
  };
}

/** "Mumbai 400053" → city "Mumbai", and the PIN code in `area` (the Bookable field it fills). */
function splitLocation(location: string | null) {
  const { city, pin } = parsePlace(location);
  return { area: pin, city };
}

const unitIsHour = (unit: string) => ["hour", "hr", "hourly"].includes(unit.trim().toLowerCase());

/** Bookable prices are whole rupees; the database stores paise. */
const rupees = (paise: number) => paise / 100;

/** Photo URLs per subject id, in order. */
function photosBy(photos: BookablePhoto[], type: BookablePhoto["subject_type"]) {
  const by = new Map<string, string[]>();
  for (const p of photos) {
    if (p.subject_type === type) by.set(p.subject_id, [...(by.get(p.subject_id) ?? []), p.url]);
  }
  return by;
}

export function bookableFromRow(
  row: BookableRow,
  labels: TaxonomyLabels,
  weeklyHours: WeeklyHours = {},
  photos: BookablePhoto[] = [],
): Bookable {
  // No rooms (owner, 3 Oct 2026): a place is booked through its services, which the booking
  // flow adds, and priced from them; one calendar for the whole place.

  // Proof photos are keyed by what the page shows: the amenity's label, the equipment's name.
  const amenityPhotos = photosBy(photos, "amenity");
  const equipmentPhotos = photosBy(photos, "equipment");
  const proof = (pairs: [string, string[] | undefined][]) =>
    Object.fromEntries(pairs.filter((p): p is [string, string[]] => !!p[1]?.length));

  return {
    id: row.slug,
    name: row.name,
    kind: "",
    verified: row.verified_gold || Boolean(row.owner?.is_verified),
    // No reviews, no rating: the meta row skips a zero.
    rating: row.review_count ? (row.rating ?? 0) : 0,
    reviews: row.review_count,
    ...splitLocation(row.location),
    distanceKm: 0,
    timezone: "",
    hero: row.image_url ?? "",
    logo: row.owner?.avatar_url ?? "",
    ...(row.owner?.username ? { username: row.owner.username } : {}),
    ...(row.owner?.id ? { ownerProfileId: row.owner.id } : {}),
    ...(row.owner?.followers_count ? { followers: row.owner.followers_count } : {}),
    gallery: row.images,
    about: row.description ?? "",
    amenities: row.amenities.map((a) => taxonomyLabel(labels, "amenities", a)),
    resources: [],
    equipment: row.equipment.map((e) => e.name),
    amenityLabelSlugs: Object.fromEntries(
      row.amenities.map((a) => [taxonomyLabel(labels, "amenities", a), a]),
    ),
    amenityPhotos: proof(
      row.amenities.map((a) => [taxonomyLabel(labels, "amenities", a), amenityPhotos.get(a)]),
    ),
    equipmentPhotos: proof(row.equipment.map((e) => [e.name, equipmentPhotos.get(e.id)])),
    addOns: (row.add_ons ?? []).map((a, i): AddOn => ({
      id: `addon-${i}`,
      name: a.name,
      description: "",
      price: a.price_paise == null ? 0 : rupees(a.price_paise),
      ...(a.unit && unitIsHour(a.unit) ? { perHour: true } : a.unit ? { unit: a.unit } : {}),
      ...(a.price_paise == null ? { unpriced: true } : {}),
      available: true,
    })),
    policies: row.cancellation_policy
      ? [{ title: "Cancellation", body: row.cancellation_policy }]
      : [],
    taxPct: 0,
    responseTime: row.response_time ?? "",
    reviewItems: row.reviews.map((r) => ({
      id: r.id,
      by: r.author_name,
      org: r.author_org ?? "",
      context: r.context ?? "",
      stars: r.rating,
      text: r.body,
      ...(r.response ? { response: r.response } : {}),
      tags: r.tags ?? [],
    })),
    // With no weekly hours there is nothing to pick from, so the studio is asked directly.
    hasCalendar: hasWeeklyHours(weeklyHours),
  };
}
