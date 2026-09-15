/**
 * FLOW-03 — Add Portfolio: canonical master data + client types.
 * Entities: portfolio, portfolioItem, media, credit, contributor, visibility.
 */

export type WorkKind =
  | "track"
  | "album"
  | "video"
  | "performance"
  | "project"
  | "client"
  | "case-study"
  | "writing"
  | "image"
  | "link";

export type Visibility = "public" | "members" | "private";

export type WorkStatus = "draft" | "published" | "archived";

export type PortfolioItem = {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  role: string | null;
  collaborators: string[];
  cover_url: string | null;
  media_url: string | null;
  release_year: number | null;
  published: boolean;
  sort_order: number;
  created_at?: string;
};

export const workTypes: {
  kind: WorkKind;
  label: string;
  blurb: string;
  emoji: string;
  media: "audio" | "video" | "image" | "link" | "none";
}[] = [
  {
    kind: "track",
    label: "Track",
    blurb: "A single song or recording",
    emoji: "🎵",
    media: "audio",
  },
  {
    kind: "album",
    label: "Album",
    blurb: "A release with multiple tracks",
    emoji: "💿",
    media: "audio",
  },
  {
    kind: "video",
    label: "Video",
    blurb: "Music video, session or reel",
    emoji: "🎬",
    media: "video",
  },
  {
    kind: "performance",
    label: "Performance",
    blurb: "Live show, tour or festival set",
    emoji: "🎤",
    media: "video",
  },
  {
    kind: "project",
    label: "Project",
    blurb: "A body of work you contributed to",
    emoji: "🗂",
    media: "link",
  },
  {
    kind: "client",
    label: "Client work",
    blurb: "Work delivered for a client or brand",
    emoji: "🤝",
    media: "link",
  },
  {
    kind: "case-study",
    label: "Case study",
    blurb: "Brief, approach, outcome",
    emoji: "📈",
    media: "none",
  },
  {
    kind: "writing",
    label: "Writing sample",
    blurb: "Lyrics, topline or notation",
    emoji: "✍️",
    media: "none",
  },
  {
    kind: "image",
    label: "Image",
    blurb: "Artwork, stills or behind the scenes",
    emoji: "🖼",
    media: "image",
  },
  {
    kind: "link",
    label: "External link",
    blurb: "YouTube, Spotify, SoundCloud, site",
    emoji: "🔗",
    media: "link",
  },
];

export function workType(kind: string) {
  return workTypes.find((t) => t.kind === kind) ?? workTypes[0]!;
}

export const creditRoles = [
  "Artist",
  "Singer",
  "Composer",
  "Producer",
  "Lyricist",
  "Music Director",
  "Guitarist",
  "Keyboardist",
  "Drummer",
  "Bassist",
  "Mixing Engineer",
  "Mastering Engineer",
  "Sound Designer",
  "DJ",
  "Director",
];

export const genres = [
  "Indie",
  "Hip-Hop",
  "Film",
  "Pop",
  "Classical",
  "Electronic",
  "Rock",
  "Devotional",
  "Fusion",
  "Jazz",
];

export const visibilityOptions: { value: Visibility; label: string; blurb: string }[] = [
  { value: "public", label: "Public", blurb: "Visible on your public profile." },
  { value: "members", label: "MusicLinkd members", blurb: "Visible to signed-in members." },
  { value: "private", label: "Private", blurb: "Only you can see it." },
];

/** Role-aware empty-state suggestions (SCREEN 35). */
export const roleSuggestions: Record<string, string> = {
  Singer: "Add a performance you're proud of",
  Musician: "Add a recording that shows your playing",
  Producer: "Add a production you led",
  "Mixing Engineer": "Add a mix with before/after context",
  default: "Add your first track, project or performance",
};

/** Demo portfolio shown to signed-out visitors (no backend writes). */
export const demoPortfolio: PortfolioItem[] = [
  {
    id: "demo-1",
    title: "Neon Monsoon",
    kind: "track",
    description: "Indie-electronic single recorded at Octave Sound Labs, Mumbai.",
    role: "Producer, Mixing Engineer",
    collaborators: ["Aditi Rao", "Rohan Mehta"],
    cover_url: null,
    media_url: null,
    release_year: 2025,
    published: true,
    sort_order: 0,
  },
  {
    id: "demo-2",
    title: "Sessions at Bandra East",
    kind: "performance",
    description: "Three-night live residency, full band, 400-cap room.",
    role: "Music Director",
    collaborators: ["The Kite Notes"],
    cover_url: null,
    media_url: null,
    release_year: 2024,
    published: true,
    sort_order: 1,
  },
  {
    id: "demo-3",
    title: "Chai & Static — brand film",
    kind: "client",
    description: "Score and sound design for a 90-second brand film.",
    role: "Composer",
    collaborators: [],
    cover_url: null,
    media_url: null,
    release_year: 2024,
    published: true,
    sort_order: 2,
  },
];

/* ------------------------------------------------------------------ */
/* Media state machine (design-only — no upload infrastructure)        */
/* ------------------------------------------------------------------ */

export type MediaState =
  "not-uploaded" | "uploading" | "processing" | "ready" | "failed" | "unavailable";

export const mediaStateCopy: Record<
  MediaState,
  { label: string; hint: string; tone: "neutral" | "good" | "warn" | "bad" }
> = {
  "not-uploaded": {
    label: "No media",
    hint: "Add a link or file so people can hear or see this work.",
    tone: "neutral",
  },
  uploading: {
    label: "Uploading",
    hint: "Keep this screen open while the file transfers.",
    tone: "warn",
  },
  processing: {
    label: "Processing",
    hint: "We're preparing the preview. This usually takes a minute.",
    tone: "warn",
  },
  ready: { label: "Ready", hint: "Playable on your profile.", tone: "good" },
  failed: {
    label: "Upload failed",
    hint: "The transfer stopped. Retry or replace the file.",
    tone: "bad",
  },
  unavailable: {
    label: "Unavailable",
    hint: "The source link no longer responds. Replace it to restore playback.",
    tone: "bad",
  },
};

export type MediaAsset = {
  id: string;
  type: "audio" | "video" | "image" | "link";
  url: string | null;
  state: MediaState;
  progress?: number;
  durationLabel?: string;
  alt?: string;
};

/* ------------------------------------------------------------------ */
/* Credits & contributors                                              */
/* ------------------------------------------------------------------ */

export type Credit = { name: string; role: string; profile?: string };

export type Contributor = {
  id: string;
  name: string;
  role: string;
  username?: string;
  onPlatform: boolean;
};

/** Suggested contributors — searched before an invite is offered. */
export const contributorDirectory: Contributor[] = [
  { id: "c1", name: "Aditi Rao", role: "Vocalist", username: "aditi.rao", onPlatform: true },
  { id: "c2", name: "Rohan Mehta", role: "Guitarist", username: "rohan.mehta", onPlatform: true },
  {
    id: "c3",
    name: "Octave Sound Labs",
    role: "Studio",
    username: "octave.labs",
    onPlatform: true,
  },
  { id: "c4", name: "Kabir Sen", role: "Mixing Engineer", username: "kabir.sen", onPlatform: true },
  { id: "c5", name: "Meera Iyer", role: "Lyricist", username: "meera.iyer", onPlatform: true },
  { id: "c6", name: "The Kite Notes", role: "Band", username: "kitenotes", onPlatform: true },
];

/* ------------------------------------------------------------------ */
/* Analytics (canonical figures only — read, never written here)       */
/* ------------------------------------------------------------------ */

export type WorkAnalyticsFigures = {
  views: number;
  plays: number;
  shares: number;
  saves: number;
  profileClicks: number;
  linkClicks: number;
};

export const workAnalytics: Record<string, WorkAnalyticsFigures> = {
  "demo-1": { views: 1284, plays: 612, shares: 41, saves: 96, profileClicks: 173, linkClicks: 58 },
  "demo-2": { views: 742, plays: 208, shares: 22, saves: 44, profileClicks: 91, linkClicks: 17 },
  "demo-3": { views: 396, plays: 88, shares: 9, saves: 19, profileClicks: 40, linkClicks: 11 },
};

export function analyticsFor(id: string): WorkAnalyticsFigures {
  return (
    workAnalytics[id] ?? {
      views: 0,
      plays: 0,
      shares: 0,
      saves: 0,
      profileClicks: 0,
      linkClicks: 0,
    }
  );
}

export function portfolioTotals(ids: string[]): WorkAnalyticsFigures {
  return ids.reduce<WorkAnalyticsFigures>(
    (acc, id) => {
      const a = analyticsFor(id);
      return {
        views: acc.views + a.views,
        plays: acc.plays + a.plays,
        shares: acc.shares + a.shares,
        saves: acc.saves + a.saves,
        profileClicks: acc.profileClicks + a.profileClicks,
        linkClicks: acc.linkClicks + a.linkClicks,
      };
    },
    { views: 0, plays: 0, shares: 0, saves: 0, profileClicks: 0, linkClicks: 0 },
  );
}

/* ------------------------------------------------------------------ */
/* Featured work (max 3)                                               */
/* ------------------------------------------------------------------ */

export const FEATURED_LIMIT = 3;

export function isFeatured(item: PortfolioItem, featured: string[]) {
  return featured.includes(item.id);
}

/* ------------------------------------------------------------------ */
/* Per-screen data contracts (EXISTING / COMPUTED / PROPOSED / FUTURE) */
/* ------------------------------------------------------------------ */

export type FieldSupport = "EXISTING" | "COMPUTED" | "PROPOSED" | "FUTURE";

export type PortfolioScreenContract = {
  screen: string;
  reads: { field: string; support: FieldSupport }[];
};

export const portfolioContracts: PortfolioScreenContract[] = [
  {
    screen: "portfolio.overview",
    reads: [
      { field: "portfolioItem.title", support: "EXISTING" },
      { field: "portfolioItem.kind", support: "EXISTING" },
      { field: "portfolioItem.published", support: "EXISTING" },
      { field: "portfolioItem.sort_order", support: "EXISTING" },
      { field: "portfolio.featuredIds", support: "PROPOSED" },
      { field: "portfolio.counts", support: "COMPUTED" },
    ],
  },
  {
    screen: "portfolio.work",
    reads: [
      { field: "portfolioItem.media_url", support: "EXISTING" },
      { field: "portfolioItem.collaborators", support: "EXISTING" },
      { field: "media.state", support: "PROPOSED" },
      { field: "analytics.views/plays/shares", support: "FUTURE" },
    ],
  },
  {
    screen: "portfolio.analytics",
    reads: [
      { field: "analytics.views", support: "FUTURE" },
      { field: "analytics.profileClicks", support: "FUTURE" },
    ],
  },
  {
    screen: "portfolio.select",
    reads: [
      { field: "portfolioItem.id", support: "EXISTING" },
      { field: "portfolioItem.title", support: "EXISTING" },
    ],
  },
];
