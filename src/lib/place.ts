/*
 * Where someone or something is: city and PIN code, never an area name (owner, 21 Sep 2026).
 * Stored as profiles.city + profiles.pin_code; business addresses and studio locations as
 * "City PIN" (e.g. "Mumbai 400053").
 */

export const PIN_CODE = /^[1-9]\d{5}$/;

/**
 * What anyone sees: the city only. PIN codes and area names are never shown (owner, 21 Sep 2026);
 * the PIN is used internally, as a radius for what is near you (samePinArea).
 */
export function shownPlace(value: string | null | undefined) {
  return parsePlace(value).city;
}

/**
 * Two PIN codes in the same postal district (their first three digits match), i.e. near each
 * other. False when either is missing.
 */
export function samePinArea(a: string | null | undefined, b: string | null | undefined) {
  return Boolean(a && b && PIN_CODE.test(a) && PIN_CODE.test(b) && a.slice(0, 3) === b.slice(0, 3));
}

/** "Mumbai 400053", or whichever part there is: how a place is stored, never how it is shown. */
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

/**
 * A place reduced to its comparable words: lowercase, PIN dropped, punctuation flattened.
 * "Mumbai 400053" → "mumbai", "Bandra, Mumbai" → "bandra mumbai", "Mumbai, MH" → "mumbai mh".
 * Deliberately keeps every part rather than picking one side of the comma, because the two older
 * conventions disagree about which side the city is on and nothing written today has a comma.
 */
function cityKey(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\b[1-9]\d{5}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Whole-word containment, so "new delhi" holds "delhi" but "punjab" does not hold "pune". */
function holdsWord(hay: string, needle: string): boolean {
  return needle.length >= 3 && ` ${hay} `.includes(` ${needle} `);
}

/**
 * Whether two stored places name the same city. The one comparison for the whole app: a city
 * reaches us from a picker, from free text and from Google, so "Mumbai", "mumbai" and
 * "Mumbai 400053" are one place, and "Delhi" and "New Delhi" are one place. Whole words only.
 *
 * This replaced five separate implementations that disagreed — one of them case-sensitive, which
 * is why a person whose city read "mumbai" saw an empty "Near you" and was told we didn't know
 * where they were.
 */
export function sameCity(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = cityKey(a);
  const y = cityKey(b);
  if (!x || !y) return false;
  return x === y || holdsWord(x, y) || holdsWord(y, x);
}

/*
 * India Post names a district the way the post office does, which is not always what a person
 * would call the place: "Bangalore" for Bengaluru, "Bombay" for Mumbai, "Central Delhi" for the
 * part of Delhi somebody lives in. These are the same places under older or administrative names,
 * not different ones.
 */
const districtAliases: Record<string, string> = {
  bangalore: "Bengaluru",
  bombay: "Mumbai",
  calcutta: "Kolkata",
  madras: "Chennai",
  gurgaon: "Gurugram",
  mysore: "Mysuru",
  mangalore: "Mangaluru",
  poona: "Pune",
  trivandrum: "Thiruvananthapuram",
  baroda: "Vadodara",
};

/**
 * A district from a PIN lookup, as a city someone would recognise.
 *
 * Deliberately permissive: a district the aliases do not know is returned as-is rather than
 * dropped. The old behaviour required an exact match against a list of 79 cities, so anyone in
 * Thane or Dombivli got an empty field — which is the whole reason the city was so often wrong.
 * A real place name we do not have on a list still beats nothing.
 */
export function cityFromDistrict(district: string): string {
  const name = district.trim();
  if (!name) return "";
  const known = districtAliases[name.toLowerCase()];
  if (known) return known;
  // "Central Delhi", "North Goa" — administrative halves of one place people just call by name.
  const stripped = name.replace(/^(north|south|east|west|central)\s+/i, "").trim();
  return districtAliases[stripped.toLowerCase()] ?? stripped;
}

/** A Google Maps link: maps.app.goo.gl, goo.gl/maps, google.<tld>/maps or maps.google.<tld>. */
export const GOOGLE_MAPS =
  /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+\/)/i;
