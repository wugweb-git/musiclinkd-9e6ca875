import { subcategories, type Listing, type ListingType } from "@/data/market";
import {
  formatPaise,
  getListing,
  listListings,
  taxonomyLabel,
  type ListingRow,
} from "@/lib/catalog.functions";
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
};

/** Item taxonomy slugs with an obvious static subcategory. */
const SUBCATEGORIES: Record<string, string> = {
  microphones: "Microphones",
  audio_interfaces: "Interfaces",
  studio_monitors: "Monitors",
  drums_percussion: "Drums",
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

export function listingFromRow(row: ListingRow, labels: TaxonomyLabels, now: number): Listing {
  const type = TYPES[row.category] ?? "product";
  const category = categoryOf(row, labels);
  const condition = type !== "service" && row.condition ? CONDITIONS[row.condition] : undefined;
  const owner = row.seller
    ? {
        name: row.seller.display_name ?? row.seller.username ?? row.seller_name ?? "",
        username: row.seller.username,
        photo: row.seller.avatar_url ?? "",
        verified: row.seller.is_verified,
      }
    : row.seller_name
      ? { name: row.seller_name, username: null, photo: "", verified: false }
      : undefined;
  return {
    id: row.slug,
    type,
    title: row.title,
    subtitle: "",
    // With no amount the note is the price, as formatPaise returns it.
    price: formatPaise(
      row.price_paise,
      row.price_unit,
      row.price_paise == null ? row.price_note : null,
    ),
    ...(row.price_paise != null && row.price_note ? { priceNote: row.price_note } : {}),
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

/** Every database listing, newest first. Empty when the catalog cannot be read. */
export async function loadCatalogListings(): Promise<Listing[]> {
  const [rows, labels] = await Promise.all([
    listListings().catch((): ListingRow[] => []),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  const now = Date.now();
  return rows.map((row) => listingFromRow(row, labels, now));
}

/** One database listing by slug, or null. */
export async function loadCatalogListing(slug: string): Promise<Listing | null> {
  const [row, labels] = await Promise.all([
    getListing({ data: { slug } }).catch(() => null),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return row ? listingFromRow(row, labels, Date.now()) : null;
}
