import type { AddOn, Bookable, DurationUnit, PricingTier, Resource } from "@/data/booking";
import { taxonomyLabel, type RoomTier, type StudioRow } from "@/lib/catalog.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import { hasWeeklyHours, type WeeklyHours } from "@/lib/studio-slots";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";
import type { StudioPhoto } from "@/lib/studio-photos.functions";
import { parsePlace, shownPlace } from "@/lib/place";

/*
 * Database studios shaped for the existing studio screens. Only fields the database holds are
 * filled; everything else is a neutral empty value ("", 0, []) that the render paths skip.
 * There is no tax, distance or timezone. The availability calendar is on once the studio has
 * weekly hours (studios.weekly_hours, src/lib/studio-slots.ts). A rating shows only once the
 * studio has reviews (studios.rating is kept from them by the database).
 */

export type DiscoverStudio = {
  id: string;
  slug: string;
  /** The owning business account's username, which is the studio's profile. */
  username: string;
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

export function discoverStudioFromRow(row: StudioRow, labels: TaxonomyLabels): DiscoverStudio {
  return {
    id: row.id,
    slug: row.slug,
    username: row.owner?.username ?? "",
    name: row.name,
    location: shownPlace(row.location),
    rating: row.rating == null || !row.review_count ? null : Number(row.rating),
    reviewCount: row.review_count,
    verified: row.verified_gold,
    rate: priceParts(row.hourly_rate_paise, "hr"),
    photo: row.image_url ?? "",
    gear: row.equipment.length
      ? row.equipment.map((e) => e.name)
      : row.amenities.map((a) => taxonomyLabel(labels, "studio_amenities", a)),
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

/** A stored package ("Half day", 4 hours) as a pricing tier; the label says which duration it is. */
function packageTier(tier: RoomTier): PricingTier | null {
  if (tier.price_paise == null || !tier.label) return null;
  const label = tier.label.toLowerCase();
  const unit: DurationUnit = label.includes("half")
    ? "halfDay"
    : label.includes("full") || label.includes("day")
      ? "fullDay"
      : "session";
  return { unit, label: tier.label, hours: tier.hours ?? 0, price: rupees(tier.price_paise) };
}

function hourlyResource(
  id: string,
  name: string,
  capacity: number | null,
  paise: number | null,
  photo: string,
  gear: string[] = [],
  description = "",
  packages: RoomTier[] = [],
): Resource | null {
  const tiers: PricingTier[] = [
    ...(paise == null
      ? []
      : [{ unit: "hour" as const, label: "Hourly", hours: 1, price: rupees(paise) }]),
    // A stored "Hourly" package repeats the room's own hourly rate; keep one of each unit and price.
    ...packages
      .map(packageTier)
      .filter((t): t is PricingTier => t !== null)
      .filter((t) => !(paise != null && t.unit === "hour" && t.price === rupees(paise))),
  ];
  if (!tiers.length) return null;
  return {
    id,
    name,
    description,
    capacity: capacity ?? 0,
    equipment: gear,
    tiers,
    durations: [...new Set(tiers.map((t) => t.unit))],
    model: "request",
    availabilityNote: "",
    photo,
  };
}

/** Photo URLs per subject id, in order. */
function photosBy(photos: StudioPhoto[], type: StudioPhoto["subject_type"]) {
  const by = new Map<string, string[]>();
  for (const p of photos) {
    if (p.subject_type === type) by.set(p.subject_id, [...(by.get(p.subject_id) ?? []), p.url]);
  }
  return by;
}

export function bookableFromStudio(
  row: StudioRow,
  labels: TaxonomyLabels,
  weeklyHours: WeeklyHours = {},
  photos: StudioPhoto[] = [],
): Bookable | null {
  const resources = row.rooms.length
    ? row.rooms.map((room) =>
        hourlyResource(
          room.id,
          room.name,
          room.capacity,
          room.hourly_rate_paise,
          room.photo_url ?? "",
          room.gear ?? [],
          room.description ?? "",
          room.tiers ?? [],
        ),
      )
    : [hourlyResource(row.id, row.name, null, row.hourly_rate_paise, row.image_url ?? "")];
  const priced = resources.filter((r): r is Resource => r !== null);
  // Without a rate there is nothing honest to price, so the space stays unavailable.
  if (!priced.length) return null;

  // Proof photos are keyed by what the page shows: the facility's label, the equipment's name.
  const facilityPhotos = photosBy(photos, "facility");
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
    facilities: row.amenities.map((a) => taxonomyLabel(labels, "studio_amenities", a)),
    resources: priced,
    equipment: row.equipment.map((e) => e.name),
    facilitySlugs: Object.fromEntries(
      row.amenities.map((a) => [taxonomyLabel(labels, "studio_amenities", a), a]),
    ),
    facilityPhotos: proof(
      row.amenities.map((a) => [
        taxonomyLabel(labels, "studio_amenities", a),
        facilityPhotos.get(a),
      ]),
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
