/*
 * Where someone or something is: city and PIN code, never an area name (owner, 21 Sep 2026).
 * Stored as profiles.city + profiles.pin_code; business addresses and studio locations as
 * "City PIN" (e.g. "Mumbai 400053").
 */

export const PIN_CODE = /^[1-9]\d{5}$/;

/** "Mumbai 400053", or whichever part there is. */
export function placeLine(city: string | null | undefined, pin: string | null | undefined) {
  return [city?.trim(), pin?.trim()].filter(Boolean).join(" ");
}

/**
 * A stored place read back into its parts: "Mumbai 400053" → city "Mumbai", pin "400053". Older
 * "Area, City" values keep only the city.
 */
export function parsePlace(value: string | null | undefined): { city: string; pin: string } {
  const text = value?.trim() ?? "";
  const match = text.match(/^(.*?)[\s,]+([1-9]\d{5})$/);
  if (match) return { city: match[1]!.split(",").pop()!.trim(), pin: match[2]! };
  return { city: text.split(",").pop()!.trim(), pin: "" };
}

/** A Google Maps link: maps.app.goo.gl, goo.gl/maps, google.<tld>/maps or maps.google.<tld>. */
export const GOOGLE_MAPS =
  /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+\/)/i;
