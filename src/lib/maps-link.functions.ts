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
 * Opening hours, phone, website, rating and photos need the Google Places API and a key, which the
 * project doesn't have; they are not read here.
 */

export type MapsPlace = {
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  lat: number | null;
  lng: number | null;
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

export const readMapsLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().trim().max(500).regex(GOOGLE_MAPS) }).parse(d))
  .handler(async ({ data }): Promise<MapsPlace> => {
    const empty: MapsPlace = {
      name: null,
      address: null,
      city: null,
      state: null,
      pinCode: null,
      lat: null,
      lng: null,
    };
    try {
      const place = parsePlace(await resolve(data.url));
      if (place.lat === null || place.lng === null) return { ...empty, name: place.name };
      const found = await reverse(place.lat, place.lng);
      const a = found?.address ?? {};
      const state = (INDIAN_STATES as readonly string[]).includes(a.state ?? "")
        ? (a.state as string)
        : null;
      const pin = (a.postcode ?? "").replace(/\s/g, "");
      return {
        name: place.name,
        address: found?.display_name ?? null,
        city: a.city ?? a.town ?? a.village ?? a.state_district ?? null,
        state,
        pinCode: PIN_CODE.test(pin) ? pin : null,
        lat: place.lat,
        lng: place.lng,
      };
    } catch {
      return empty;
    }
  });
