// Overlays the stored profile record onto the rendered profile shape so the
// answers captured during onboarding show up on /me and public profiles.

import {
  emptySections,
  type AvailabilityState,
  type PersonProfile,
  type ProfileRole,
} from "@/data/profile";
import { experienceLevels, roles as roleDefs } from "@/data/onboarding";
import { asLinkMap, type ProfileRow } from "@/lib/profile-map";

function roleLabel(key: string | undefined | null): string | null {
  if (!key) return null;
  return roleDefs.find((r) => r.key === key)?.label ?? key;
}

const availabilityFromRow: Record<string, AvailabilityState> = {
  Shows: "Available for Shows",
  "Session Work": "Available for Session Work",
  Collaborations: "Looking for Collaboration",
  Touring: "Touring",
};

const roleTypeFromKey: Record<string, ProfileRole> = {
  singer: "Vocal Artist",
  "voice-artist": "Vocal Artist",
  producer: "Producer",
  musician: "Musician",
  composer: "Musician",
  "sound-engineer": "Engineer",
  dj: "DJ",
};

/**
 * The base for a real profile with no seed: identity from its own row, every section empty. Never a
 * template person, so the screen shows empty states for whatever the record does not hold.
 */
export function profileFromRow(row: ProfileRow): PersonProfile {
  return {
    ...emptySections(),
    username: row.username ?? "",
    name: row.display_name ?? row.username ?? "",
    photo: row.avatar_url ?? "",
    headline: "",
    primaryRole: "",
    location: "",
    roleType: roleTypeFromKey[row.roles?.[0] ?? ""] ?? "Other",
    availability: row.availability ? availabilityFromRow[row.availability] : undefined,
    yearsActive: experienceLevels.find((e) => e.key === row.experience_level)?.label ?? "",
  };
}

export function mergeProfileRow(
  base: PersonProfile,
  row: ProfileRow | null | undefined,
): PersonProfile {
  if (!row) return base;
  const primary = roleLabel(row.roles?.[0]);
  const linkMap = asLinkMap(row.links);
  const links = Object.entries(linkMap)
    .filter(([, v]) => Boolean(v))
    .map(([label, handle]) => ({ label, handle }));

  return {
    ...base,
    username: row.username || base.username,
    name: row.display_name || base.name,
    ...(row.avatar_url ? { photo: row.avatar_url } : {}),
    headline: row.headline ? (roleLabel(row.headline) ?? row.headline) : (primary ?? base.headline),
    primaryRole: primary ?? base.primaryRole,
    secondaryRoles: (row.roles ?? []).slice(1).map((r) => roleLabel(r) ?? r),
    location: [row.city, row.state].filter(Boolean).join(", ") || base.location,
    shortBio: row.bio || base.shortBio,
    longBio: row.bio || base.longBio,
    genres: row.genres?.length ? row.genres : base.genres,
    instruments: row.instruments?.length ? row.instruments : base.instruments,
    languages: row.languages?.length ? row.languages : base.languages,
    specialisations: row.specialisations?.length
      ? row.specialisations.map((s) => (s.includes(":") ? s.slice(s.indexOf(":") + 1) : s))
      : base.specialisations,
    privacy:
      row.visibility === "private"
        ? "Private"
        : row.visibility === "connections"
          ? "Connections only"
          : base.privacy,
    links: links.length ? links : base.links,
  };
}
