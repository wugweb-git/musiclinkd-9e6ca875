import type { Bookable, Resource } from "@/data/booking";
import { taxonomyLabel, type StudioRow } from "@/lib/catalog.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";

/*
 * Database studios shaped for the existing studio screens. Only fields the database holds are
 * filled; everything else is a neutral empty value ("", 0, []) that the render paths skip.
 * There is no tax, response time, distance, timezone, add-ons or availability calendar.
 */

export type DiscoverStudio = {
  slug: string;
  name: string;
  location: string;
  rating: number | null;
  rate: PriceParts | null;
  photo: string;
  gear: string[];
};

export function discoverStudioFromRow(row: StudioRow, labels: TaxonomyLabels): DiscoverStudio {
  return {
    slug: row.slug,
    name: row.name,
    location: row.location ?? "",
    rating: row.rating == null ? null : Number(row.rating),
    rate: priceParts(row.hourly_rate_paise, "hr"),
    photo: row.image_url ?? "",
    gear: row.equipment.length
      ? row.equipment.map((e) => e.name)
      : row.amenities.map((a) => taxonomyLabel(labels, "studio_amenities", a)),
  };
}

/** "Bandra, Mumbai" → area "Bandra", city "Mumbai"; rendered back as "{area}, {city}". */
function splitLocation(location: string | null) {
  const value = location?.trim() ?? "";
  const cut = value.lastIndexOf(",");
  if (cut < 0) return { area: "", city: value };
  return { area: value.slice(0, cut).trim(), city: value.slice(cut + 1).trim() };
}

/** Bookable prices are whole rupees; the database stores paise. */
const rupees = (paise: number) => paise / 100;

function hourlyResource(
  id: string,
  name: string,
  capacity: number | null,
  paise: number | null,
  photo: string,
): Resource | null {
  if (paise == null) return null;
  return {
    id,
    name,
    description: "",
    capacity: capacity ?? 0,
    equipment: [],
    tiers: [{ unit: "hour", label: "Hourly", hours: 1, price: rupees(paise) }],
    durations: ["hour"],
    model: "request",
    availabilityNote: "",
    photo,
  };
}

export function bookableFromStudio(row: StudioRow, labels: TaxonomyLabels): Bookable | null {
  const resources = row.rooms.length
    ? row.rooms.map((room) =>
        hourlyResource(room.id, room.name, room.capacity, room.hourly_rate_paise, ""),
      )
    : [hourlyResource(row.id, row.name, null, row.hourly_rate_paise, row.image_url ?? "")];
  const priced = resources.filter((r): r is Resource => r !== null);
  // Without a rate there is nothing honest to price, so the space stays unavailable.
  if (!priced.length) return null;

  return {
    id: row.slug,
    name: row.name,
    kind: "",
    verified: row.verified_gold || Boolean(row.owner?.is_verified),
    rating: row.rating ?? 0,
    reviews: row.review_count,
    ...splitLocation(row.location),
    distanceKm: 0,
    timezone: "",
    hero: row.image_url ?? "",
    gallery: row.images,
    about: row.description ?? "",
    facilities: row.amenities.map((a) => taxonomyLabel(labels, "studio_amenities", a)),
    resources: priced,
    equipment: row.equipment.map((e) => e.name),
    addOns: [],
    policies: row.cancellation_policy
      ? [{ title: "Cancellation", body: row.cancellation_policy }]
      : [],
    taxPct: 0,
    responseTime: "",
    hasCalendar: false,
  };
}
