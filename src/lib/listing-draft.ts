import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeftRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  History,
  MapPin,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import type { ProfileRow } from "@/lib/profile-map";
import type { MyListing } from "@/lib/catalog.functions";
import { parsePlace, placeLine } from "@/lib/place";
import { pinProblem } from "@/lib/validation";
import { gearTypeOf, type GearTaxonomy } from "@/lib/listing-category";

export const listingConditions = [
  { label: "New", value: "new", icon: Sparkles },
  { label: "Like New", value: "like_new", icon: Star },
  { label: "Used", value: "used", icon: History },
] as const;

export const rateUnits = [
  { label: "Per day", value: "day", icon: CalendarDays },
  { label: "Per week", value: "week", icon: CalendarRange },
  { label: "Per month", value: "month", icon: Calendar },
] as const;

export const fulfilmentOptions = [
  { label: "Pickup", value: "pickup", icon: MapPin },
  { label: "Delivery", value: "delivery", icon: Truck },
  { label: "Pickup or delivery", value: "both", icon: ArrowLeftRight },
] as const;

/** Sell or rent out, as keys; logic compares these, never the words shown. */
export const listingModes = ["sell", "rent"] as const;
export type ListingMode = (typeof listingModes)[number];
export const listingModeLabels: Record<ListingMode, string> = { sell: "Sell", rent: "Rent out" };

export type ListingDraft = {
  mode: ListingMode;
  name: string;
  brand: string;
  model: string;
  sub: string | null;
  condition: (typeof listingConditions)[number]["value"];
  description: string;
  price: string;
  unit: (typeof rateUnits)[number]["value"];
  fulfilment: (typeof fulfilmentOptions)[number]["value"];
  city: string;
  pin: string;
  videoUrl: string;
  photos: string[];
  /** What comes with it ("Flight case", "Cables"). Optional. */
  included: string[];
  /** Extra specifications as label and value ("Weight", "18.5 kg"). Optional. */
  specs: { label: string; value: string }[];
};

export const emptyListingDraft: ListingDraft = {
  mode: "sell",
  name: "",
  brand: "",
  model: "",
  sub: null,
  condition: "used",
  description: "",
  price: "",
  unit: "day",
  fulfilment: "pickup",
  city: "",
  pin: "",
  videoUrl: "",
  photos: [],
  included: [],
  specs: [],
};

export const listingSteps = ["What & price", "Photos & description", "Where & publish"] as const;

/*
 * A saved draft lives on this device (the listings table has no draft status, and the schema
 * stays as it is). Guarded: a private window or blocked storage just means no draft.
 */
const DRAFT_KEY = "ml.listing-draft";

export function readListingDraft(): Partial<ListingDraft> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Omit<Partial<ListingDraft>, "mode"> & { mode?: string };
    // Drafts saved before the mode became a key hold the words ("Sell", "Rent out").
    const mode: ListingMode | undefined =
      saved.mode === "Rent out" || saved.mode === "rent"
        ? "rent"
        : saved.mode === "Sell" || saved.mode === "sell"
          ? "sell"
          : undefined;
    const { mode: _old, ...rest } = saved;
    return { ...rest, ...(mode ? { mode } : {}) };
  } catch {
    return null;
  }
}

export function saveListingDraft(d: ListingDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function clearListingDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * The draft the flow edits. It opens on a saved draft if there is one, in the mode the link asked
 * for; City and PIN code start from the seller's profile (the shared ["profile","me"] query), are
 * filled once, and never over what was typed.
 */
export function useListingDraft(mode: ListingMode, editing = false) {
  const [draft, setDraft] = useState<ListingDraft>({ ...emptyListingDraft, mode });
  const { signedIn } = useAuth();
  const load = useServerFn(getMyProfile);
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const row = profile.data as ProfileRow | null | undefined;
  // Storage is read after mount, so the server render and the first client render agree.
  useEffect(() => {
    if (editing) return;
    const saved = readListingDraft();
    if (saved) setDraft((d) => ({ ...d, ...saved }));
  }, [editing]);
  useEffect(() => {
    if (!row) return;
    setDraft((d) => ({
      ...d,
      city: d.city || row.city || "",
      pin: d.pin || row.pin_code || "",
    }));
  }, [row]);
  const patch = (p: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...p }));
  return [draft, patch] as const;
}

/** A saved listing read back into the draft, for editing. */
export function draftFromListing(row: MyListing): ListingDraft {
  const place = parsePlace(row.pickup_location);
  const unit = rateUnits.find((u) => u.value === row.price_unit)?.value ?? "day";
  return {
    mode: row.category === "gear_rental" ? "rent" : "sell",
    name: row.title,
    brand: row.brand ?? "",
    model: row.model ?? "",
    sub: row.item_category,
    condition: row.condition ?? "used",
    description: row.listing_description ?? "",
    price: row.price_paise != null ? String(Math.round(row.price_paise / 100)) : "",
    unit,
    fulfilment:
      row.pickup_available && row.delivery_available
        ? "both"
        : row.delivery_available
          ? "delivery"
          : "pickup",
    city: place.city,
    pin: place.pin,
    videoUrl: row.video_url ?? "",
    photos: row.photos?.length ? row.photos : row.image_url ? [row.image_url] : [],
    included: row.included ?? [],
    specs: row.specs ?? [],
  };
}

export const rupees = (v: string) => Number(v.replace(/[^0-9]/g, ""));

/** Every field is required (owner, 21 Sep 2026) except the video; each step waits for its own. */
export function listingStepComplete(d: ListingDraft, step: number) {
  if (step === 0)
    return Boolean(
      d.sub && d.name.trim() && d.brand.trim() && d.model.trim() && rupees(d.price) > 0,
    );
  if (step === 1) return Boolean(d.description.trim()) && !videoProblem(d.videoUrl);
  return Boolean(d.city.trim() && d.pin.trim() && !pinProblem(d.pin));
}

/** A short video is a link (YouTube, Instagram, Drive…): any https URL. */
export function videoProblem(value: string) {
  const v = value.trim();
  if (!v) return null;
  return /^https:\/\/\S+\.\S+/.test(v) ? null : "Paste a full link, starting with https://";
}

/** What createListing gets from the draft. */
export function listingPayload(d: ListingDraft, taxonomy: GearTaxonomy) {
  const type = gearTypeOf(d.sub, taxonomy);
  const rental = d.mode === "rent";
  return {
    category: rental ? ("gear_rental" as const) : ("gear_sale" as const),
    title: d.name.trim() || "Untitled listing",
    ...(type ? { itemCategoryKind: type.kind, itemCategory: type.slug } : {}),
    ...(d.brand.trim() ? { brand: d.brand.trim() } : {}),
    ...(d.model.trim() ? { model: d.model.trim() } : {}),
    ...(d.description.trim() ? { description: d.description.trim() } : {}),
    condition: d.condition,
    pricePaise: rupees(d.price) * 100,
    ...(rental ? { priceUnit: d.unit } : {}),
    pickupAvailable: d.fulfilment !== "delivery",
    deliveryAvailable: d.fulfilment !== "pickup",
    ...(d.city.trim() || d.pin.trim()
      ? { pickupLocation: placeLine(d.city, pinProblem(d.pin) ? "" : d.pin) }
      : {}),
    ...(d.videoUrl.trim() && !videoProblem(d.videoUrl) ? { videoUrl: d.videoUrl.trim() } : {}),
    ...(d.photos.length ? { photos: d.photos } : {}),
    included: d.included.map((x) => x.trim()).filter(Boolean),
    specs: d.specs
      .map((sp) => ({ label: sp.label.trim(), value: sp.value.trim() }))
      .filter((sp) => sp.label && sp.value),
  };
}

/*
 * The one text input skin: a pill, the same shape as the pickers beside it.
 *
 * text-2 rather than text-sm because the viewport sets no maximum-scale, so iOS Safari zooms the
 * page whenever it focuses an input smaller than 16px — every one of these fields did that.
 */
export const inputClass =
  // field-focus: ink border + 1.5px ink ring on focus, red border when aria-invalid (owner, 10 Oct 2026).
  "field-focus h-11 w-full rounded-sm border border-input bg-card px-3.5 text-2 outline-none";
