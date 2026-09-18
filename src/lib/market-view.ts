import { subcategories, type Listing, type ListingType } from "@/data/market";
import type { RentalCategory, RentalItem } from "@/data/rentals";
import {
  getListing,
  listListings,
  listMyListings,
  taxonomyLabel,
  type ListingRow,
} from "@/lib/catalog.functions";
import { priceParts } from "@/lib/price";
import { getRentalBookingCounts } from "@/lib/rentals.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";

/*
 * Database marketplace listings shaped as the static `Listing` the market screens render.
 * Only stored fields are carried over. Location is the rental pickup place, else the seller's
 * profile city. Fields the table does not have (distance, saves, rating, reviews, delivery,
 * availability) stay empty, and the screens skip empty values.
 */

const TYPES: Record<string, ListingType> = {
  gear_sale: "product",
  gear_rental: "rental",
  mixing_mastering: "service",
  creative_services: "service",
  beats_licensing: "service",
  stems: "service",
};

const CONDITIONS: Partial<Record<NonNullable<ListingRow["condition"]>, Listing["condition"]>> = {
  new: "New",
  like_new: "Like New",
  used: "Used",
};

/** Item taxonomy slugs with an obvious static subcategory. */
const SUBCATEGORIES: Record<string, string> = {
  microphones: "Microphones",
  audio_interfaces: "Interfaces",
  studio_monitors: "Monitors",
  drums: "Drums",
};

const AUDIO_GEAR = new Set(["microphones", "audio_interfaces", "studio_monitors"]);

function categoryOf(row: ListingRow, labels: TaxonomyLabels) {
  if (row.category === "gear_rental") return "rentals";
  if (TYPES[row.category] === "service") return "services";
  if (row.category === "gear_sale") {
    if (row.item_category_kind === "instrument") return "instruments";
    if (row.item_category && AUDIO_GEAR.has(row.item_category)) return "audio-gear";
  }
  return taxonomyLabel(labels, "marketplace_categories", row.category);
}

function subcategoryOf(row: ListingRow, category: string, labels: TaxonomyLabels) {
  const mapped = row.item_category ? SUBCATEGORIES[row.item_category] : undefined;
  if (mapped && subcategories[category]?.includes(mapped)) return mapped;
  if (row.item_category) {
    const key = row.item_category_kind === "instrument" ? "instruments" : "equipment_categories";
    return taxonomyLabel(labels, key, row.item_category);
  }
  return taxonomyLabel(labels, "marketplace_categories", row.category);
}

/** Same wording as the static listings: "5 hours ago", "2 days ago". */
function postedAt(createdAt: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (minutes < 60) return plural(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");
  return plural(Math.floor(hours / 24), "day");
}

/** Where a listing is: the rental pickup place when stored, otherwise the seller's city. */
const placeOf = (row: ListingRow) => row.pickup_location ?? row.seller?.city ?? "";

/** Stored specs are label/value pairs; anything else in the column is left out. */
const specsOf = (row: ListingRow) =>
  Array.isArray(row.specs)
    ? row.specs.filter((s) => s && typeof s.label === "string" && typeof s.value === "string")
    : [];

/**
 * The seller's profile when linked, otherwise only the stored seller name. A rating shows only
 * once the seller has reviews; followers only once someone follows them.
 */
function ownerOf(row: ListingRow): Listing["owner"] {
  if (row.seller) {
    const s = row.seller;
    return {
      id: s.id,
      name: s.display_name ?? s.username ?? row.seller_name ?? "",
      username: s.username,
      photo: s.avatar_url ?? "",
      verified: s.is_verified,
      ...(s.rating != null && s.review_count
        ? { rating: Number(s.rating), reviews: s.review_count }
        : {}),
      ...(s.followers_count ? { followers: s.followers_count } : {}),
    };
  }
  return row.seller_name
    ? { name: row.seller_name, username: null, photo: "", verified: false }
    : undefined;
}

export function listingFromRow(row: ListingRow, labels: TaxonomyLabels, now: number): Listing {
  const type = TYPES[row.category] ?? "product";
  const category = categoryOf(row, labels);
  const condition = type !== "service" && row.condition ? CONDITIONS[row.condition] : undefined;
  const owner = ownerOf(row);
  return {
    id: row.slug,
    dbId: row.id,
    type,
    title: row.title,
    // Brand and model under the title ("Shure · SM7B").
    subtitle: [row.brand, row.model].filter(Boolean).join(" · "),
    ...(row.brand ? { brand: row.brand } : {}),
    // Amount, unit and note as parts; with no amount the note is the price.
    price: priceParts(row.price_paise, row.price_unit, row.price_note) ?? { amount: "" },
    // Condition describes goods; a service stored as "new" is not shown with a condition badge.
    ...(condition ? { condition } : {}),
    location: placeOf(row),
    distance: "",
    category,
    subcategory: subcategoryOf(row, category, labels),
    saves: 0,
    postedAt: postedAt(row.created_at, now),
    photos: row.image_url ? [row.image_url] : [],
    description: row.listing_description ?? "",
    specs: specsOf(row),
    sellerId: "",
    ...(owner ? { owner } : {}),
  };
}

async function loadRows() {
  return Promise.all([
    listListings().catch((): ListingRow[] => []),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
}

/**
 * Every database listing Market carries, newest first. Services are Discover's, not Market's
 * (owner, 18 Sep 2026), so they're left out here. Empty when the catalog cannot be read.
 */
export async function loadCatalogListings(): Promise<Listing[]> {
  const [rows, labels] = await loadRows();
  const now = Date.now();
  return rows.map((row) => listingFromRow(row, labels, now)).filter((l) => l.type !== "service");
}

/** The signed-in user's own listings, newest first — for /marketplace/mine. */
export async function loadMyCatalogListings(): Promise<Listing[]> {
  const [rows, labels] = await Promise.all([
    listMyListings().catch((): ListingRow[] => []),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  const now = Date.now();
  return rows.map((row) => listingFromRow(row, labels, now));
}

/** Item taxonomy slugs with an obvious static rental category and sub-category. */
const RENTAL_EQUIPMENT: Record<string, { category: RentalCategory; subcategory: string }> = {
  microphones: { category: "audio", subcategory: "Microphones" },
  audio_interfaces: { category: "audio", subcategory: "Audio Interfaces" },
  studio_monitors: { category: "audio", subcategory: "Studio Monitors" },
  drums: { category: "instruments", subcategory: "Drums" },
  headphones: { category: "audio", subcategory: "Headphones" },
  mixers: { category: "audio", subcategory: "Mixers" },
  preamps: { category: "studio", subcategory: "Outboard Gear" },
  controllers: { category: "dj", subcategory: "DJ Controllers" },
  dj_controller: { category: "dj", subcategory: "DJ Controllers" },
  drum_machine: { category: "dj", subcategory: "Performance Equipment" },
  sampler: { category: "dj", subcategory: "Performance Equipment" },
  pa_systems: { category: "live", subcategory: "PA Systems" },
  backline: { category: "studio", subcategory: "Backline" },
};

/** Stored paise as whole rupees, or nothing when the column is empty. */
const rupeesOf = (paise: number | null | undefined) =>
  paise == null ? undefined : Math.round(paise / 100);

/** Only the keys with a value, so the rental screens skip what the owner left empty. */
function present<T extends Record<string, unknown>>(
  fields: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(fields).filter(
      ([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length),
    ),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

/**
 * A database gear_rental row shaped as the rental screens' item. Only stored fields are carried:
 * the day rate (when the stored unit is a day), weekly and monthly rates, deposit, quantity, rental
 * length and notice, pickup and delivery, brand, model, description, specs, what's included, the
 * price note, condition, photo and provider. A row with no item category has no rental category,
 * so it shows in search but in no category.
 */
export function rentalFromRow(row: ListingRow, labels: TaxonomyLabels): RentalItem {
  const mapped = row.item_category ? RENTAL_EQUIPMENT[row.item_category] : undefined;
  const category: RentalCategory | undefined =
    mapped?.category ?? (row.item_category_kind === "instrument" ? "instruments" : undefined);
  const subcategory = mapped
    ? mapped.subcategory
    : row.item_category
      ? taxonomyLabel(
          labels,
          row.item_category_kind === "instrument" ? "instruments" : "equipment_categories",
          row.item_category,
        )
      : undefined;
  const condition = row.condition ? CONDITIONS[row.condition] : undefined;
  const owner = ownerOf(row);
  return {
    id: row.slug,
    dbId: row.id,
    ...(row.item_category ? { itemCategory: row.item_category } : {}),
    ...(placeOf(row) ? { location: placeOf(row) } : {}),
    name: row.title,
    photos: row.image_url ? [row.image_url] : [],
    ...(row.price_paise != null && row.price_unit === "day"
      ? { daily: row.price_paise / 100 }
      : {}),
    ...(row.price_note ? { priceNote: row.price_note } : {}),
    ...present({
      weekly: rupeesOf(row.weekly_price_paise),
      monthly: rupeesOf(row.monthly_price_paise),
      deposit: rupeesOf(row.deposit_paise),
      quantity: row.quantity_available ?? undefined,
      minDays: row.min_days ?? undefined,
      maxDays: row.max_days ?? undefined,
      noticePeriod: row.notice_period ?? undefined,
      pickup: row.pickup_available ?? undefined,
      delivery: row.delivery_available ?? undefined,
      deliveryFee: rupeesOf(row.delivery_fee_paise),
      deliveryNote: row.delivery_note ?? undefined,
      brand: row.brand ?? undefined,
      model: row.model ?? undefined,
      description: row.listing_description ?? undefined,
      specs: specsOf(row),
      included: row.included ?? undefined,
    }),
    ...(condition ? { condition } : {}),
    ...(category ? { category } : {}),
    ...(subcategory ? { subcategory } : {}),
    ...(owner ? { owner } : {}),
  };
}

/** Database rentals (category gear_rental), newest first. Empty when the catalog cannot be read. */
export async function loadCatalogRentals(): Promise<RentalItem[]> {
  const [rows, labels] = await loadRows();
  return rows.filter((row) => row.category === "gear_rental").map((r) => rentalFromRow(r, labels));
}

/** The signed-in seller's own rental listings, newest first — for /marketplace/rent/listings. */
export async function loadMyCatalogRentals(): Promise<RentalItem[]> {
  const [rows, labels] = await Promise.all([
    listMyListings().catch((): ListingRow[] => []),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return rows.filter((row) => row.category === "gear_rental").map((r) => rentalFromRow(r, labels));
}

/**
 * The items in the viewer's Market city (useMarketCity), matched on the stored place. When
 * nothing is listed there, every item — an empty "near you" says less than the whole catalogue.
 */
export function inCity<T extends { location?: string }>(items: T[], city: string): T[] {
  const want = city.trim().toLowerCase();
  if (!want) return items;
  const here = items.filter((item) => {
    const place = (item.location ?? "").toLowerCase();
    return place !== "" && (place.includes(want) || want.includes(place));
  });
  return here.length ? here : items;
}

/**
 * How many times each rental has been booked (declined and cancelled requests aside), keyed by
 * the listing's row id. Counted by the database (rental_booking_counts); empty when it cannot be
 * read, so "Popular rentals" falls back to newest first.
 */
export async function loadRentalBookingCounts(): Promise<Record<string, number>> {
  return getRentalBookingCounts().catch((): Record<string, number> => ({}));
}

/*
 * One listing by slug, read directly rather than found in the browse catalog: a listing can be
 * left out of browsing (a service, or one its owner marked unavailable or archived) and still be
 * opened from the owner's own lists. Null when there is no such listing.
 */
export async function loadListingBySlug(slug: string): Promise<Listing | null> {
  const [row, labels] = await Promise.all([
    getListing({ data: { slug } }).catch(() => null),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return row ? listingFromRow(row, labels, Date.now()) : null;
}
