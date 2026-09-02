// Overlays the stored profile record onto the rendered profile shape so the
// answers captured during onboarding show up on /me and public profiles.

import type { PersonProfile } from "@/data/profile";
import { roles as roleDefs } from "@/data/onboarding";
import type { ProfileRow } from "@/lib/profile-map";

function roleLabel(key: string | undefined | null): string | null {
  if (!key) return null;
  return roleDefs.find((r) => r.key === key)?.label ?? key;
}

export function mergeProfileRow(base: PersonProfile, row: ProfileRow | null | undefined): PersonProfile {
  if (!row) return base;
  const primary = roleLabel(row.roles?.[0]);
  const linkMap = (row.links ?? {}) as Record<string, string>;
  const links = Object.entries(linkMap)
    .filter(([, v]) => Boolean(v))
    .map(([label, handle]) => ({ label, handle }));

  return {
    ...base,
    username: row.username || base.username,
    name: row.display_name || base.name,
    ...(row.avatar_url ? { photo: row.avatar_url } : {}),
    headline: row.headline ? roleLabel(row.headline) ?? row.headline : primary ?? base.headline,
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
