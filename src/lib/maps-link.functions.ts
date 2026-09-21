import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GOOGLE_MAPS, PIN_CODE } from "@/lib/place";
import { INDIAN_STATES } from "@/lib/validation";

/*
 * What a Google Maps link gives without a Google API key (owner, 22 Sep 2026: business setup starts
 * from the link). The short link (maps.app.goo.gl) redirects to the full place URL, which carries
 * the place's name and its pin (!3d lat !4d lng, else @lat,lng). The pin's address — city, state,
 * PIN code — comes from OpenStreetMap's reverse lookup.
 *
 * With a Places API key (server secret GOOGLE_PLACES_API_KEY) the rest of the business's Google
 * profile comes too: address parts, phone, website, opening hours, rating and the place id, from
 * one Places API (New) Text Search biased to the pin. Without the key only the link's own facts
 * are read. syncBusinessFromGoogle (google-business.functions.ts) writes them onto the business.
 */

export type MapsPlace = {
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  lat: number | null;
  lng: number | null;
  /** From Google's profile of the place; null without a Places key or when Google has none. */
  phone: string | null;
  website: string | null;
  /** One line per day, "Mon: 9:00 AM – 6:00 PM", the way operating_hours is stored. */
  hours: string[];
  rating: number | null;
  ratingCount: number | null;
  placeId: string | null;
  /** "google" when the Places API answered; "link" when only the link and its pin were read. */
  source: "google" | "link";
};

/** The full place URL a short link leads to (following Google's consent page when it steps in). */
async function resolve(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MusicLinkd/1.0)" },
  });
  let final = res.url || url;
  const next = new URL(final).searchParams.get("continue");
  if (next) final = next;
  return final;
}

function parsePlace(full: string) {
  const u = new URL(full);
  const path = decodeURIComponent(u.pathname);
  const named = /\/maps\/place\/([^/]+)/.exec(path)?.[1];
  const query = u.searchParams.get("q") ?? u.searchParams.get("query");
  const name = (named ?? query ?? "").replace(/\+/g, " ").split(",")[0]?.trim() || null;
  const pin = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(full);
  const at = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(full);
  const coords = pin ?? at;
  return {
    name,
    lat: coords ? Number(coords[1]) : null,
    lng: coords ? Number(coords[2]) : null,
  };
}

type Nominatim = {
  display_name?: string;
  address?: Partial<
    Record<"city" | "town" | "village" | "state_district" | "state" | "postcode", string>
  >;
};

async function reverse(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=en&lat=${lat}&lon=${lng}`,
    { headers: { "User-Agent": "MusicLinkd/1.0 (admin@wugweb.com)" } },
  );
  if (!res.ok) return null;
  return (await res.json()) as Nominatim;
}

type PlacesAnswer = {
  places?: {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    addressComponents?: { longText?: string; types?: string[] }[];
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    regularOpeningHours?: { weekdayDescriptions?: string[] };
    rating?: number;
    userRatingCount?: number;
    location?: { latitude?: number; longitude?: number };
  }[];
};

const PLACES_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.rating",
  "places.userRatingCount",
  "places.location",
].join(",");

/** Google's own profile of the place: one Text Search for its name, biased to its pin. */
async function googlePlace(key: string, name: string, lat: number | null, lng: number | null) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": PLACES_FIELDS,
    },
    body: JSON.stringify({
      textQuery: name,
      languageCode: "en",
      regionCode: "IN",
      maxResultCount: 1,
      ...(lat !== null && lng !== null
        ? { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 300 } } }
        : {}),
    }),
  });
  if (!res.ok) return null;
  return ((await res.json()) as PlacesAnswer).places?.[0] ?? null;
}

/** "Monday: 9:00 AM – 6:00 PM" → "Mon: 9:00 AM – 6:00 PM". */
function shortDay(line: string) {
  const m = /^(\w+):\s*(.+)$/.exec(line);
  return m ? `${m[1]!.slice(0, 3)}: ${m[2]!.replace(/\u202f|\u2009/g, " ")}` : line;
}

/** Everything a Google Maps link can tell about a place, with the Places API when there's a key. */
export async function readPlace(url: string): Promise<MapsPlace> {
  const empty: MapsPlace = {
    name: null,
    address: null,
    city: null,
    state: null,
    pinCode: null,
    lat: null,
    lng: null,
    phone: null,
    website: null,
    hours: [],
    rating: null,
    ratingCount: null,
    placeId: null,
    source: "link",
  };
  let base = empty;
  try {
    const place = parsePlace(await resolve(url));
    base = { ...empty, name: place.name, lat: place.lat, lng: place.lng };
    if (place.lat !== null && place.lng !== null) {
      const found = await reverse(place.lat, place.lng);
      const a = found?.address ?? {};
      const pin = (a.postcode ?? "").replace(/\s/g, "");
      base = {
        ...base,
        address: found?.display_name ?? null,
        city: a.city ?? a.town ?? a.village ?? a.state_district ?? null,
        state: (INDIAN_STATES as readonly string[]).includes(a.state ?? "") ? a.state! : null,
        pinCode: PIN_CODE.test(pin) ? pin : null,
      };
    }
  } catch {
    return empty;
  }

  const key = process.env["GOOGLE_PLACES_API_KEY"];
  if (!key || !base.name) return base;
  try {
    const g = await googlePlace(key, base.name, base.lat, base.lng);
    if (!g) return base;
    const part = (type: string) =>
      g.addressComponents?.find((c) => c.types?.includes(type))?.longText;
    const pin = (part("postal_code") ?? "").replace(/\s/g, "");
    const state = part("administrative_area_level_1") ?? "";
    return {
      ...base,
      name: g.displayName?.text ?? base.name,
      address: g.formattedAddress ?? base.address,
      city: part("locality") ?? part("administrative_area_level_3") ?? base.city,
      state: (INDIAN_STATES as readonly string[]).includes(state) ? state : base.state,
      pinCode: PIN_CODE.test(pin) ? pin : base.pinCode,
      lat: g.location?.latitude ?? base.lat,
      lng: g.location?.longitude ?? base.lng,
      phone: g.internationalPhoneNumber?.replace(/\s/g, "") ?? g.nationalPhoneNumber ?? null,
      website: g.websiteUri ?? null,
      hours: (g.regularOpeningHours?.weekdayDescriptions ?? []).map(shortDay),
      rating: g.rating ?? null,
      ratingCount: g.userRatingCount ?? null,
      placeId: g.id ?? null,
      source: "google",
    };
  } catch {
    return base;
  }
}

export const readMapsLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().trim().max(500).regex(GOOGLE_MAPS) }).parse(d))
  .handler(({ data }): Promise<MapsPlace> => readPlace(data.url));
