// Maps the onboarding draft onto the durable profile record (and back).
// Client-safe: pure functions, no server imports.

import { emptyDraft, type OnboardingDraft, type RoleKey } from "@/data/onboarding";

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
  onboarding_step?: string | null;
  onboarding_draft?: unknown;
  onboarding_complete?: boolean | null;
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
    display_name: d.displayName || null,
    username: d.username || null,
    headline: d.primaryRole ?? null,
    bio: d.bio || null,
    city: d.city || null,
    state: d.state || null,
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
    ...(d.photo ? { avatar_url: d.photo } : {}),
    links: asLinkMap(d.links),
    discovery_prefs: {
      topics: d.discovery,
      businessIntent: d.businessIntent,
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

/** Rebuild a draft from the stored record; the raw draft blob wins when present. */
export function profileToDraft(row: ProfileRow | null | undefined): OnboardingDraft | null {
  if (!row) return null;
  const blob = row.onboarding_draft;
  if (blob && typeof blob === "object" && Object.keys(blob as object).length > 0) {
    return { ...emptyDraft, ...(blob as Partial<OnboardingDraft>) } as OnboardingDraft;
  }
  const prefs = (row.discovery_prefs ?? {}) as {
    topics?: string[];
    businessIntent?: string | null;
  };
  const instruments = row.instruments ?? [];
  return {
    ...emptyDraft,
    displayName: row.display_name ?? emptyDraft.displayName,
    username: row.username ?? emptyDraft.username,
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
    workModes: row.work_modes ?? [],
    availability: row.availability ? [row.availability] : [],
    intents: row.intents ?? [],
    experience: row.experience_level ?? null,
    bio: row.bio ?? "",
    links: asLinkMap(row.links),
    contact: row.contact_channels ?? emptyDraft.contact,
    discovery: prefs.topics ?? [],
    visibility: row.visibility ?? "public",
    businessIntent: prefs.businessIntent ?? null,
    completedSteps: emptyDraft.completedSteps,
  };
}

/** Fields the profile still needs, used for completion meters and prompts. */
export function profileGaps(row: ProfileRow | null | undefined) {
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
