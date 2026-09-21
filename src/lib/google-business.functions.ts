import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GOOGLE_MAPS, PIN_CODE, placeLine } from "@/lib/place";
import { CITY_PATTERN } from "@/lib/validation";
import { readPlace, type MapsPlace } from "@/lib/maps-link.functions";

/*
 * A business's details, synced from its Google profile (owner, 22 Sep 2026). The Google Maps link
 * is the source: its place's city, state and PIN code, phone, website and opening hours are
 * written onto the business — profile_business (address as "City PIN", hours, the link),
 * profiles (city, state, PIN, links.website) and profile_private.business_phone. Only what Google
 * has is written; nothing it lacks is cleared. The name, photos and reviews stay the owner's own.
 *
 * Phone, website and hours need the Places API key (GOOGLE_PLACES_API_KEY); without it the sync
 * still brings the place's city, state and PIN code from the link.
 */

export type GoogleSync = {
  place: MapsPlace;
  /** What was written, in plain words ("city", "opening hours"). */
  updated: string[];
};

export const syncBusinessFromGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ url: z.string().trim().max(500).regex(GOOGLE_MAPS).optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<GoogleSync> => {
    const client = context.supabase as unknown as SupabaseClient;
    const id = context.userId;

    const [{ data: business, error: readError }, { data: profile, error: profileError }] =
      await Promise.all([
        client.from("profile_business").select("maps_url").eq("profile_id", id).maybeSingle(),
        client.from("profiles").select("links").eq("id", id).maybeSingle(),
      ]);
    if (readError) throw new Error(readError.message);
    if (profileError) throw new Error(profileError.message);
    if (!business) throw new Error("Only a business page can sync from Google.");
    const url = data.url ?? (business as { maps_url: string | null }).maps_url;
    if (!url) throw new Error("Add your Google Maps link first.");

    const place = await readPlace(url);
    const updated: string[] = [];

    const cityOk = Boolean(place.city && CITY_PATTERN.test(place.city));
    const pinOk = Boolean(place.pinCode && PIN_CODE.test(place.pinCode));

    const businessPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.url) businessPatch["maps_url"] = data.url;
    if (cityOk && pinOk) businessPatch["business_address"] = placeLine(place.city, place.pinCode);
    if (place.hours.length) {
      businessPatch["operating_hours"] = place.hours.join("\n");
      updated.push("opening hours");
    }
    const { error: businessError } = await client
      .from("profile_business")
      .update(businessPatch as never)
      .eq("profile_id", id);
    if (businessError) throw new Error(businessError.message);

    const links = (profile as { links: unknown } | null)?.links;
    const linkMap =
      links && typeof links === "object" && !Array.isArray(links)
        ? (links as Record<string, string>)
        : {};
    const profilePatch: Record<string, unknown> = {};
    if (cityOk) {
      profilePatch["city"] = place.city;
      updated.push("city");
    }
    if (place.state) {
      profilePatch["state"] = place.state;
      updated.push("state");
    }
    if (pinOk) {
      profilePatch["pin_code"] = place.pinCode;
      updated.push("PIN code");
    }
    if (place.website) {
      profilePatch["links"] = { ...linkMap, website: place.website };
      updated.push("website");
    }
    if (Object.keys(profilePatch).length) {
      const { error } = await client
        .from("profiles")
        .update({ ...profilePatch, updated_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw new Error(error.message);
    }

    if (place.phone) {
      const { error } = await client
        .from("profile_private" as never)
        .upsert({ id, business_phone: place.phone } as never, { onConflict: "id" });
      if (error) throw new Error(error.message);
      updated.push("phone");
    }

    return { place, updated };
  });
