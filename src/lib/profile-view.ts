// Overlays the stored profile record onto the rendered profile shape so the
// answers captured during onboarding show up on /me and public profiles.

import {
  emptySections,
  type AudioTrack,
  type AvailabilityState,
  type PersonProfile,
  type ProfileRole,
  type ProjectItem,
  type ReleaseItem,
  type ServiceItem,
  type VideoItem,
} from "@/data/profile";
import { experienceLevels, roles as roleDefs } from "@/data/onboarding";
import { asLinkMap, type ProfileRow } from "@/lib/profile-map";
import type { ProfileSections, TaxonomyLabels } from "@/lib/portfolio.functions";

/** Profiles store taxonomy slugs; show the published label, or the slug if it has none. */
function labelled(labels: TaxonomyLabels | undefined, category: string, slugs: string[]): string[] {
  const map = labels?.[category];
  return map ? slugs.map((s) => map[s] ?? s) : slugs;
}

function roleLabel(key: string | undefined | null, labels?: TaxonomyLabels): string | null {
  if (!key) return null;
  return labels?.["person_types"]?.[key] ?? roleDefs.find((r) => r.key === key)?.label ?? key;
}

const availabilityFromRow: Record<string, AvailabilityState> = {
  Shows: "Available for Shows",
  "Session Work": "Available for Session Work",
  Collaborations: "Looking for Collaboration",
  Touring: "Touring",
};

const roleTypeFromKey: Record<string, ProfileRole> = {
  singer: "Vocal Artist",
  rapper: "Vocal Artist",
  folk_vocalist: "Vocal Artist",
  voice_artist: "Vocal Artist",
  producer: "Producer",
  beatmaker: "Producer",
  musician: "Musician",
  guitarist: "Musician",
  bassist: "Musician",
  keyboardist: "Musician",
  drummer: "Musician",
  sitarist: "Musician",
  violinist: "Musician",
  wind_player: "Musician",
  composer: "Musician",
  sound_engineer: "Engineer",
  mixing_engineer: "Engineer",
  mastering_engineer: "Engineer",
  sound_designer: "Engineer",
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
  labels?: TaxonomyLabels,
): PersonProfile {
  if (!row) return base;
  const primary = roleLabel(row.roles?.[0], labels);
  const linkMap = asLinkMap(row.links);
  const links = Object.entries(linkMap)
    .filter(([, v]) => Boolean(v))
    .map(([label, handle]) => ({ label, handle }));

  return {
    ...base,
    username: row.username || base.username,
    name: row.display_name || base.name,
    ...(row.avatar_url ? { photo: row.avatar_url } : {}),
    ...(row.cover_url ? { cover: row.cover_url } : {}),
    headline: row.headline
      ? (roleLabel(row.headline, labels) ?? row.headline)
      : (primary ?? base.headline),
    primaryRole: primary ?? base.primaryRole,
    secondaryRoles: (row.roles ?? []).slice(1).map((r) => roleLabel(r, labels) ?? r),
    location: [row.city, row.state].filter(Boolean).join(", ") || base.location,
    shortBio: row.bio || base.shortBio,
    longBio: row.bio || base.longBio,
    genres: row.genres?.length ? labelled(labels, "genres", row.genres) : base.genres,
    instruments: row.instruments?.length
      ? labelled(labels, "instruments", row.instruments)
      : base.instruments,
    languages: row.languages?.length
      ? labelled(labels, "languages", row.languages)
      : base.languages,
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

const serviceModes: NonNullable<ServiceItem["mode"]>[] = [
  "Remote",
  "In person",
  "Remote · In person",
];

/** Integer paise and a unit back to the "₹8,000 / song" the service card shows. */
function servicePrice(s: ProfileSections["services"][number]): string | undefined {
  if (s.price_paise == null) return s.price_note ?? undefined;
  const amount = `₹${(s.price_paise / 100).toLocaleString("en-IN")}`;
  return s.price_unit ? `${amount} / ${s.price_unit}` : amount;
}

/** Portfolio items grouped into the profile's audio, video, release and project sections. */
function portfolioSections(items: ProfileSections["portfolio"]) {
  const audio: AudioTrack[] = [];
  const video: VideoItem[] = [];
  const discography: ReleaseItem[] = [];
  const projects: ProjectItem[] = [];
  const thisYear = new Date().getFullYear();
  for (const item of items) {
    const year = item.release_year ? String(item.release_year) : "";
    if (item.kind === "track") {
      audio.push({
        id: item.id,
        title: item.title,
        role: item.role ?? "",
        project: item.description ?? "",
        duration: "",
        artwork: item.cover_url ?? "",
      });
    } else if (item.kind === "video" || item.kind === "performance") {
      video.push({
        id: item.id,
        title: item.title,
        context: item.description ?? "",
        duration: "",
        thumb: item.cover_url ?? "",
      });
    } else if (item.kind === "album") {
      discography.push({
        id: item.id,
        title: item.title,
        kind: "Album",
        label: item.description ?? "",
        year,
        cover: item.cover_url ?? "",
      });
    } else {
      projects.push({
        id: item.id,
        name: item.title,
        role: item.role ?? "",
        collaborators: item.collaborators.join(", "),
        genre: "",
        year,
        status: item.release_year && item.release_year <= thisYear ? "Released" : "In production",
        cover: item.cover_url ?? "",
      });
    }
  }
  return { audio, video, discography, projects };
}

/**
 * Stored sections onto the profile. A section the base already has is kept, so seed profiles show
 * exactly what they showed before; stored rows fill the sections that are empty.
 */
export function mergeSections(
  base: PersonProfile,
  sections: ProfileSections | null | undefined,
): PersonProfile {
  if (!sections) return base;
  const fromPortfolio = portfolioSections(sections.portfolio);
  const pick = <T>(current: T[], stored: T[]) => (current.length ? current : stored);

  return {
    ...base,
    services: pick(
      base.services,
      sections.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? "",
        from: servicePrice(s),
        turnaround: s.turnaround ?? undefined,
        mode: serviceModes.find((m) => m === s.mode),
        availability: s.availability ?? undefined,
      })),
    ),
    experience: pick(
      base.experience,
      sections.experience.map((e) => ({
        id: e.id,
        title: e.title,
        org: e.org ?? "",
        period: e.start_year ? `${e.start_year} — ${e.end_year ?? "present"}` : "",
        detail: e.detail ?? "",
      })),
    ),
    reviews: pick(
      base.reviews,
      sections.reviews.map((r) => ({
        id: r.id,
        by: r.author_name,
        org: r.author_org ?? "",
        context: r.context ?? "",
        stars: r.rating,
        text: r.body,
        ...(r.response ? { response: r.response } : {}),
      })),
    ),
    gallery: pick(
      base.gallery,
      sections.gallery.map((g) => g.image_url),
    ),
    audio: pick(base.audio, fromPortfolio.audio),
    video: pick(base.video, fromPortfolio.video),
    discography: pick(base.discography, fromPortfolio.discography),
    projects: pick(base.projects, fromPortfolio.projects),
    verification:
      base.verification !== "Basic"
        ? base.verification
        : sections.trust_badges.includes("verified_artist")
          ? "Industry Verified"
          : sections.is_verified
            ? "Professional"
            : "Basic",
  };
}
