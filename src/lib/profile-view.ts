// Overlays the stored profile record onto the rendered profile shape so the
// answers captured during onboarding show up on /me and public profiles.

import { opportunityFromRow } from "@/lib/opportunity-view";
import { isTimeBasedService } from "@/lib/service-time";
import {
  emptySections,
  type AudioTrack,
  type AvailabilityState,
  type TalentProfile,
  type ProfileRole,
  type ProjectItem,
  type ReleaseItem,
  type ServiceItem,
  type VideoItem,
} from "@/data/profile";
import { experienceLevels, roles as roleDefs } from "@/data/onboarding";
import { asLinkMap, type ProfileRow } from "@/lib/profile-map";
import { listingFromRow } from "@/lib/market-view";
import { type ProfileSections, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import { shownPlace } from "@/lib/place";

/** Profiles store taxonomy slugs; show the published label, or the slug if it has none. */
function labelled(labels: TaxonomyLabels | undefined, category: string, slugs: string[]): string[] {
  const map = labels?.[category];
  return map ? slugs.map((s) => map[s] ?? s) : slugs;
}

/** Link keys as their platforms are written, for when link_platforms has no label. */
const PLATFORM_NAMES: Record<string, string> = {
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  youtube: "YouTube",
  instagram: "Instagram",
  apple_music: "Apple Music",
  bandcamp: "Bandcamp",
  x: "X",
  twitter: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  website: "Website",
};

function platformLabel(key: string, labels?: TaxonomyLabels): string {
  return labels?.["link_platforms"]?.[key] ?? PLATFORM_NAMES[key.toLowerCase()] ?? key;
}

function roleLabel(key: string | undefined | null, labels?: TaxonomyLabels): string | null {
  if (!key) return null;
  return labels?.["person_types"]?.[key] ?? roleDefs.find((r) => r.key === key)?.label ?? key;
}

/**
 * profiles.availability as the status the profile header shows (StatusBadge); undefined if none.
 * The only stored value is "Available", the onboarding "Open to work" switch (owner, 10 Oct 2026).
 */
export function availabilityOfRow(value: string | null | undefined): AvailabilityState | undefined {
  return value === "Available" ? "Available" : undefined;
}

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
  flautist: "Musician",
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
export function profileFromRow(row: ProfileRow): TalentProfile {
  return {
    ...emptySections(),
    ...(row.id ? { profileId: row.id } : {}),
    username: row.username ?? "",
    name: row.display_name ?? row.username ?? "",
    photo: row.avatar_url ?? "",
    headline: "",
    primaryRole: "",
    location: "",
    roleType: roleTypeFromKey[row.roles?.[0] ?? ""] ?? "Other",
    availability: availabilityOfRow(row.availability),
    yearsActive: experienceLevels.find((e) => e.key === row.experience_level)?.label ?? "",
  };
}

export function mergeProfileRow(
  base: TalentProfile,
  row: ProfileRow | null | undefined,
  labels?: TaxonomyLabels,
): TalentProfile {
  if (!row) return base;
  const primary = roleLabel(row.roles?.[0], labels);
  const profileId = row.id;
  const linkMap = asLinkMap(row.links);
  const links = Object.entries(linkMap)
    .filter(([, v]) => Boolean(v))
    .map(([key, handle]) => ({ platform: key, label: platformLabel(key, labels), handle }));
  // rating and review_count are kept from reviews by the database; no reviews, no rating.
  const reviewCount = row.review_count ?? 0;
  const rating = reviewCount && row.rating != null ? Number(row.rating) : 0;

  return {
    ...base,
    ...(profileId ? { profileId } : {}),
    username: row.username || base.username,
    name: row.display_name || base.name,
    ...(row.avatar_url ? { photo: row.avatar_url } : {}),
    ...(row.cover_url ? { cover: row.cover_url } : {}),
    headline: row.headline
      ? (roleLabel(row.headline, labels) ?? row.headline)
      : (primary ?? base.headline),
    primaryRole: primary ?? base.primaryRole,
    secondaryRoles: (row.roles ?? []).slice(1).map((r) => roleLabel(r, labels) ?? r),
    roleSlugs: row.roles ?? [],
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
    influences: row.influences?.length ? row.influences : base.influences,
    ...(reviewCount ? { rating, reviewCount } : {}),
    ...(row.followers_count != null
      ? { stats: { ...base.stats, followers: row.followers_count.toLocaleString("en-IN") } }
      : {}),
    specialisations: row.specialisations?.length
      ? row.specialisations.map((s) => (s.includes(":") ? s.slice(s.indexOf(":") + 1) : s))
      : base.specialisations,
    // profiles.visibility is one of public, members, limited.
    privacy:
      row.visibility === "members"
        ? "MusicLinkd members"
        : row.visibility === "limited"
          ? "Limited"
          : row.visibility === "public"
            ? "Public"
            : base.privacy,
    links: links.length ? links : base.links,
  };
}

const serviceModes: NonNullable<ServiceItem["mode"]>[] = [
  "Remote",
  "In person",
  "Remote · In person",
];

/**
 * The card's mode from stored work modes, when the stored mode text is not one the card shows.
 *
 * The same idea is spelled two ways in the database: profiles.work_modes holds the app_key
 * ("in-person") while profile_services.work_modes holds the slug ("in_person"), which a trigger
 * enforces. Matching one spelling made this branch dead, so a service card never said "In person".
 * Compare with the separator stripped and both columns read the same. "Hybrid" is a mix of both.
 */
function modeFromWorkModes(values: string[] | null | undefined): ServiceItem["mode"] {
  const has = (want: string) =>
    values?.some((v) => v.replace(/[-_\s]/g, "").toLowerCase() === want) ?? false;
  const hybrid = has("hybrid");
  const remote = hybrid || has("remote");
  const inPerson = hybrid || has("inperson");
  if (remote && inPerson) return "Remote · In person";
  if (remote) return "Remote";
  if (inPerson) return "In person";
  return undefined;
}

/** Integer paise and a unit as the amount and unit the service card shows; the note alone when unpriced. */
function servicePrice(s: ProfileSections["services"][number]): PriceParts | undefined {
  return (
    priceParts(s.price_paise, s.price_unit, s.price_paise == null ? s.price_note : null) ??
    undefined
  );
}

/** One stored service as the Service Card shows it: a person's, a business's or a band's. */
export function serviceCardFromRow(s: ProfileSections["services"][number]): ServiceItem {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    from: servicePrice(s),
    turnaround: s.turnaround ?? undefined,
    mode: serviceModes.find((m) => m === s.mode) ?? modeFromWorkModes(s.work_modes),
    availability: s.availability ?? undefined,
    deliverables: s.deliverables ?? [],
    timeBased: isTimeBasedService(s.work_modes),
  };
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
        duration: item.duration ?? "",
        artwork: item.cover_url ?? "",
        ...(item.media_url ? { media: item.media_url } : {}),
        collaborators: item.collaborators,
        year,
      });
    } else if (item.kind === "video" || item.kind === "reel" || item.kind === "performance") {
      video.push({
        id: item.id,
        title: item.title,
        context: item.description ?? "",
        duration: "",
        thumb: item.cover_url ?? "",
        ...(item.media_url ? { media: item.media_url } : {}),
        role: item.role ?? "",
        collaborators: item.collaborators,
        year,
        ...(item.kind === "reel" ? { format: "reel" as const } : {}),
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

function storedOpportunities(sections: ProfileSections, labels: TaxonomyLabels | undefined) {
  return sections.opportunities.map((row) => opportunityFromRow(row, labels ?? {}));
}

function storedMarket(sections: ProfileSections, labels: TaxonomyLabels | undefined) {
  const now = Date.now();
  return sections.listings.map((row) => listingFromRow(row, labels ?? {}, now));
}

function storedStudio(sections: ProfileSections): TalentProfile["studio"] {
  const studio = sections.studios[0];
  if (!studio) return undefined;
  return {
    name: studio.name,
    meta: shownPlace(studio.location),
    to: `/booking/${studio.slug}`,
  };
}

/**
 * Stored sections onto the profile. A section the base already has is kept, so seed profiles show
 * exactly what they showed before; stored rows fill the sections that are empty.
 */
export function mergeSections(
  base: TalentProfile,
  sections: ProfileSections | null | undefined,
  labels?: TaxonomyLabels,
): TalentProfile {
  if (!sections) return base;
  const fromPortfolio = portfolioSections(sections.portfolio);
  const pick = <T>(current: T[], stored: T[]) => (current.length ? current : stored);

  return {
    ...base,
    services: pick(base.services, sections.services.map(serviceCardFromRow)),
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
        ...(r.tags.length ? { tags: r.tags } : {}),
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
    opportunities: pick(base.opportunities, storedOpportunities(sections, labels)),
    market: pick(base.market, storedMarket(sections, labels)),
    studio: base.studio ?? storedStudio(sections),
    // Persona badges for At a glance, labelled from the taxonomy (owner, 10 Oct 2026).
    personaBadges: (sections.persona_badges ?? []).map((b) => labels?.["persona_badges"]?.[b] ?? b),
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
