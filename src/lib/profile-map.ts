// Maps the onboarding draft onto the durable profile record (and back).
// Client-safe: pure functions, no server imports.

import { emptyDraft, type OnboardingDraft, type RoleKey } from "@/data/onboarding";
import { PIN_CODE } from "@/lib/place";

export type ProfileRow = {
  id?: string;
  username?: string | null;
  display_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  roles?: string[] | null;
  instruments?: string[] | null;
  genres?: string[] | null;
  languages?: string[] | null;
  specialisations?: string[] | null;
  work_modes?: string[] | null;
  intents?: string[] | null;
  contact_channels?: string[] | null;
  experience_level?: string | null;
  visibility?: string | null;
  availability?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  links?: unknown;
  discovery_prefs?: unknown;
  qr_style?: string | null;
  onboarding_step?: string | null;
  onboarding_draft?: unknown;
  onboarding_complete?: boolean | null;
  /** Six digits ("400053"). Never shown; it fills the city and answers what is near you. */
  pin_code?: string | null;
  influences?: string[] | null;
  hourly_rate_paise?: number | null;
  rate_paise?: number | null;
  rate_unit?: string | null;
  /** Kept by the database from reviews and follows; null rating while there are no reviews. */
  rating?: number | string | null;
  review_count?: number | null;
  followers_count?: number | null;
};

/** Flatten the per-role specialisation map into a stable list. */
export function flattenSpecialisations(map: Record<string, string[]>): string[] {
  return Object.entries(map).flatMap(([role, list]) => list.map((v) => `${role}:${v}`));
}

export function expandSpecialisations(list: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const entry of list) {
    const idx = entry.indexOf(":");
    if (idx < 1) continue;
    const role = entry.slice(0, idx);
    const value = entry.slice(idx + 1);
    out[role] = [...(out[role] ?? []), value];
  }
  return out;
}

export function draftToProfile(d: OnboardingDraft, step?: string) {
  return {
    // No username: it is claimed once, on Continue from About you (claimMyUsername), then locked.
    display_name: d.displayName || null,
    // Headline is a person's own line about themselves, not their role (the role lives in `roles`,
    // owner 16 Sep). About you asks for it, optional (owner, 10 Oct 2026).
    headline: d.headline || null,
    bio: d.bio || null,
    city: d.city || null,
    state: d.state || null,
    // Kept only when it is a real PIN: a half-typed one would be stored and then fail the same
    // check on Edit profile, where it is the field that fills the city.
    pin_code: PIN_CODE.test(d.pinCode.trim()) ? d.pinCode.trim() : null,
    country: d.country || null,
    roles: [d.primaryRole, ...d.secondaryRoles].filter(Boolean) as string[],
    instruments: d.primaryInstrument
      ? [d.primaryInstrument, ...d.instruments.filter((i) => i !== d.primaryInstrument)]
      : d.instruments,
    genres: d.genres,
    languages: d.languages,
    specialisations: flattenSpecialisations(d.specialisation),
    work_modes: d.workModes,
    intents: d.intents,
    contact_channels: d.contact,
    experience_level: d.experience ?? null,
    visibility: d.visibility || "public",
    availability: d.availability[0] ?? null,
    // Sent only when set: onboarding no longer asks for a photo, so it must not clear one.
    ...(d.photo ? { avatar_url: d.photo } : {}),
    links: asLinkMap(d.links),
    discovery_prefs: {
      topics: d.discovery,
      businessIntent: d.businessIntent,
      instrumentExperience: d.instrumentExperience,
    },
    onboarding_draft: d as unknown as Record<string, unknown>,
    ...(step ? { onboarding_step: step } : {}),
  };
}

/** jsonb columns can hold [] or null; profile links are always a string map. */
export function asLinkMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
    ),
  );
}

/** Rebuild a draft from the stored record: its columns, plus the finished steps from the draft copy. */
export function profileToDraft(row: ProfileRow | null | undefined): OnboardingDraft | null {
  if (!row) return null;
  const blob = row.onboarding_draft;
  const stored =
    blob && typeof blob === "object" && Object.keys(blob as object).length > 0
      ? (blob as Partial<OnboardingDraft>)
      : null;
  const prefs = (row.discovery_prefs ?? {}) as {
    topics?: string[];
    businessIntent?: string | null;
    instrumentExperience?: Record<string, string>;
  };
  const instruments = row.instruments ?? [];
  return {
    ...emptyDraft,
    displayName: row.display_name ?? emptyDraft.displayName,
    // An unclaimed username typed during onboarding lives only in the draft copy.
    username: row.username ?? stored?.username ?? emptyDraft.username,
    photo: row.avatar_url ?? null,
    primaryRole: (row.roles?.[0] as RoleKey | undefined) ?? null,
    secondaryRoles: (row.roles ?? []).slice(1),
    primaryInstrument: instruments[0] ?? null,
    instruments,
    specialisation: expandSpecialisations(row.specialisations ?? []),
    genres: row.genres ?? [],
    languages: row.languages ?? [],
    country: row.country ?? emptyDraft.country,
    state: row.state ?? "",
    city: row.city ?? "",
    pinCode: row.pin_code ?? "",
    workModes: row.work_modes ?? [],
    availability: row.availability ? [row.availability] : [],
    intents: row.intents ?? [],
    experience: row.experience_level ?? null,
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    links: asLinkMap(row.links),
    contact: row.contact_channels ?? emptyDraft.contact,
    discovery: prefs.topics ?? [],
    visibility: row.visibility ?? "public",
    businessIntent: prefs.businessIntent ?? null,
    instrumentExperience: prefs.instrumentExperience ?? {},
    // The saved columns are the truth (owner, 10 Oct 2026: Edit profile opens these screens), so
    // an answer changed on Edit profile is never shown stale or written back from the old draft.
    // The draft copy only keeps what has no column: which steps were finished.
    completedSteps: stored?.completedSteps ?? emptyDraft.completedSteps,
  };
}

/** Fields the profile still needs, used for completion meters and prompts. */
export type ProfileGaps = ReturnType<typeof profileGaps>;

/** Just the fields the checks read, so a draft about to be saved can be measured too. */
type GapFields = Pick<
  ProfileRow,
  | "display_name"
  | "username"
  | "avatar_url"
  | "roles"
  | "city"
  | "bio"
  | "genres"
  | "languages"
  | "availability"
  | "links"
>;

export function profileGaps(
  row: { [K in keyof GapFields]?: GapFields[K] | undefined } | null | undefined,
) {
  const checks: { id: string; label: string; done: boolean }[] = [
    { id: "name", label: "Display name", done: Boolean(row?.display_name) },
    { id: "username", label: "Username", done: Boolean(row?.username) },
    { id: "photo", label: "Profile photo", done: Boolean(row?.avatar_url) },
    { id: "role", label: "Primary role", done: Boolean(row?.roles?.length) },
    { id: "city", label: "City", done: Boolean(row?.city) },
    { id: "bio", label: "Professional bio", done: Boolean(row?.bio && row.bio.length > 40) },
    { id: "genres", label: "Genres", done: Boolean(row?.genres?.length) },
    { id: "languages", label: "Languages", done: Boolean(row?.languages?.length) },
    { id: "availability", label: "Availability", done: Boolean(row?.availability) },
    { id: "links", label: "Links", done: Object.keys(asLinkMap(row?.links)).length > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    checks,
    missing: checks.filter((c) => !c.done),
    percent: Math.round((done / checks.length) * 100),
  };
}
