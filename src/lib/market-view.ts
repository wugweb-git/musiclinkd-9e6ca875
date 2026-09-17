import { subcategories, type Listing, type ListingType } from "@/data/market";
import type { RentalCategory, RentalItem } from "@/data/rentals";
import {
  listListings,
  listMyListings,
  taxonomyLabel,
  type ListingRow,
} from "@/lib/catalog.functions";
import { priceParts } from "@/lib/price";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";

/*
 * Database marketplace listings shaped as the static `Listing` the market screens render.
 * Only stored fields are carried over. Fields the table does not have (location, distance, saves,
 * rating, reviews, description, specs, delivery, brand, availability) stay empty, and the screens
 * skip empty values.
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

/** The seller's profile when linked, otherwise only the stored seller name. */
function ownerOf(row: ListingRow): Listing["owner"] {
  if (row.seller) {
    return {
      name: row.seller.display_name ?? row.seller.username ?? row.seller_name ?? "",
      username: row.seller.username,
      photo: row.seller.avatar_url ?? "",
      verified: row.seller.is_verified,
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
    type,
    title: row.title,
    subtitle: "",
    // Amount, unit and note as parts; with no amount the note is the price.
    price: priceParts(row.price_paise, row.price_unit, row.price_note) ?? { amount: "" },
    // Condition describes goods; a service stored as "new" is not shown with a condition badge.
    ...(condition ? { condition } : {}),
    location: "",
    distance: "",
    category,
    subcategory: subcategoryOf(row, category, labels),
    saves: 0,
    postedAt: postedAt(row.created_at, now),
    photos: row.image_url ? [row.image_url] : [],
    description: "",
    specs: [],
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

/** Every database listing, newest first. Empty when the catalog cannot be read. */
export async function loadCatalogListings(): Promise<Listing[]> {
  const [rows, labels] = await loadRows();
  const now = Date.now();
  return rows.map((row) => listingFromRow(row, labels, now));
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
};

/**
 * A database gear_rental row shaped as the rental screens' item. Only stored fields are carried:
 * the day rate (when the stored unit is a day), the price note, condition, photo and provider.
 * A row with no item category has no rental category, so it shows in search but in no category.
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
    name: row.title,
    photos: row.image_url ? [row.image_url] : [],
    ...(row.price_paise != null && row.price_unit === "day"
      ? { daily: row.price_paise / 100 }
      : {}),
    ...(row.price_note ? { priceNote: row.price_note } : {}),
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
