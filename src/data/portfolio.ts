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
  { kind: "track", label: "Track", blurb: "A single song or recording", emoji: "🎵", media: "audio" },
  { kind: "album", label: "Album / EP", blurb: "A release with multiple tracks", emoji: "💿", media: "audio" },
  { kind: "video", label: "Video", blurb: "Music video, session or reel", emoji: "🎬", media: "video" },
  { kind: "performance", label: "Performance", blurb: "Live show, tour or festival set", emoji: "🎤", media: "video" },
  { kind: "project", label: "Project", blurb: "A body of work you contributed to", emoji: "🗂", media: "link" },
  { kind: "client", label: "Client work", blurb: "Work delivered for a client or brand", emoji: "🤝", media: "link" },
  { kind: "case-study", label: "Case study", blurb: "Brief, approach, outcome", emoji: "📈", media: "none" },
  { kind: "writing", label: "Writing sample", blurb: "Lyrics, topline or notation", emoji: "✍️", media: "none" },
  { kind: "image", label: "Image", blurb: "Artwork, stills or behind the scenes", emoji: "🖼", media: "image" },
  { kind: "link", label: "External link", blurb: "YouTube, Spotify, SoundCloud, site", emoji: "🔗", media: "link" },
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
