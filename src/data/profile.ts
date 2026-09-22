import type { LinkProps } from "@tanstack/react-router";
import { singers, talents, type Talent } from "./discover";
import { linkedProfileSeeds } from "./linked-profiles";
import { priceText, type PriceParts } from "@/lib/price";

/**
 * FLOW-02 · Profile module data contract (design-time fixtures only).
 * dataSource: "users" → user, professionalProfile, portfolio, projects,
 * services, connections, reviews.
 */

export type ProfileRole = "Vocal Artist" | "Producer" | "Musician" | "Engineer" | "DJ" | "Other";

export type VerificationTier = "Basic" | "Email Verified" | "Professional" | "Industry Verified";

export type AvailabilityState =
  | "Available"
  | "In Studio"
  | "Busy"
  | "Available for Shows"
  | "Looking for Collaboration"
  | "Available for Session Work"
  | "Selective"
  | "Touring";

export type AudioTrack = {
  id: string;
  title: string;
  role: string;
  project: string;
  duration: string;
  artwork: string;
  featured?: boolean;
  /** The work's link, played in place. */
  media?: string;
};

export type VideoItem = {
  id: string;
  title: string;
  context: string;
  duration: string;
  thumb: string;
  /** The work's link, played in place. */
  media?: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  role: string;
  collaborators: string;
  genre: string;
  year: string;
  status: "Released" | "In production" | "Mixing" | "Upcoming";
  cover: string;
};

export type ReleaseItem = {
  id: string;
  title: string;
  kind: "Album" | "Single" | "EP" | "Score";
  label: string;
  year: string;
  cover: string;
};

export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  from?: PriceParts | undefined;
  turnaround?: string | undefined;
  mode?: "Remote" | "In person" | "Remote · In person" | undefined;
  availability?: string | undefined;
  /** service_categories slugs, most specific first; the card names the first. */
  categories?: string[] | undefined;
  /** What the client gets, as the owner listed it. */
  deliverables?: string[] | undefined;
  /** A studio's service: the amenities and equipment it uses, by name. */
  uses?: string[] | undefined;
};

export type ExperienceItem = {
  id: string;
  title: string;
  org: string;
  period: string;
  detail: string;
};

export type Collaborator = {
  id: string;
  name: string;
  kind: "Artist" | "Producer" | "Engineer" | "Studio" | "Label" | "Venue";
  photo: string;
  link?: { to: NonNullable<LinkProps["to"]>; params?: LinkProps["params"] } | undefined;
};

export type ReviewItem = {
  id: string;
  by: string;
  org: string;
  context: string;
  stars: number;
  text: string;
  response?: string;
  /** Short labels the reviewer picked, shown as chips. */
  tags?: string[] | undefined;
};

export type OpportunityItem = {
  id: string;
  title: string;
  detail: string;
  /** The stored budget, rendered as amount and unit under the detail. */
  price?: PriceParts | undefined;
  tone: "seeking" | "offering";
};

export type MarketEntry = {
  id: string;
  title: string;
  meta: string;
  price?: PriceParts | undefined;
  image: string;
  kind: "sale" | "rental";
  to: NonNullable<LinkProps["to"]>;
  params?: LinkProps["params"];
};

export type PersonProfile = {
  username: string;
  /** profiles.id, when this view came from the database. Connect and Follow need it. */
  profileId?: string | undefined;
  name: string;
  photo: string;
  cover: string;
  headline: string;
  roleType: ProfileRole;
  primaryRole: string;
  secondaryRoles: string[];
  /** Taxonomy slugs behind primaryRole + secondaryRoles, in the same order. Empty for seed data. */
  roleSlugs?: string[] | undefined;
  location: string;
  availability?: AvailabilityState | undefined;
  verification: VerificationTier;
  privacy: "Public" | "MusicLinkd members" | "Limited";
  yearsActive: string;
  shortBio: string;
  longBio: string;
  genres: string[];
  instruments: string[];
  languages: string[];
  influences: string[];
  specialisations: string[];
  professional: { label: string; value: string | PriceParts }[];
  stats: { connections: string; followers: string; plays: string; credits: number };
  rating: number;
  reviewCount: number;
  links: { label: string; handle: string }[];
  featured?:
    undefined | { kind: "Track" | "Project" | "Video"; title: string; meta: string; image: string };
  audio: AudioTrack[];
  video: VideoItem[];
  gallery: string[];
  projects: ProjectItem[];
  discography: ReleaseItem[];
  services: ServiceItem[];
  experience: ExperienceItem[];
  collaborators: Collaborator[];
  reviews: ReviewItem[];
  opportunities: OpportunityItem[];
  market: MarketEntry[];
  studio?: { name: string; meta: string; price?: PriceParts | undefined; to: string } | undefined;
  mutuals: { name: string; photo: string }[];
};

const u = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const art = [
  u("photo-1470225620780-dba8ba36b745", 300),
  u("photo-1511671782779-c97d3d27a1d4", 300),
  u("photo-1493225457124-a3eb161ffa5f", 300),
  u("photo-1516280440614-37939bbacd81", 300),
];

const shots = [
  u("photo-1493225457124-a3eb161ffa5f"),
  u("photo-1598488035139-bdbb2231ce04"),
  u("photo-1520523839897-bd0b52f945a0"),
  u("photo-1514320291840-2e0a9bf2a9ae"),
  u("photo-1571330735066-03aaa9429d89"),
  u("photo-1470225620780-dba8ba36b745"),
];

/**
 * Every section empty. A seed profile spreads this, never another person's profile, so a section its
 * record lacks renders the screen's empty state instead of someone else's work.
 */
export function emptySections(): Omit<
  PersonProfile,
  "username" | "name" | "photo" | "headline" | "primaryRole" | "location"
> {
  return {
    cover: "",
    roleType: "Other",
    secondaryRoles: [],
    availability: undefined,
    verification: "Basic",
    privacy: "Public",
    yearsActive: "",
    shortBio: "",
    longBio: "",
    genres: [],
    instruments: [],
    languages: [],
    influences: [],
    specialisations: [],
    professional: [],
    stats: { connections: "—", followers: "—", plays: "—", credits: 0 },
    rating: 0,
    reviewCount: 0,
    links: [],
    featured: undefined,
    audio: [],
    video: [],
    gallery: [],
    projects: [],
    discography: [],
    services: [],
    experience: [],
    collaborators: [],
    reviews: [],
    opportunities: [],
    market: [],
    studio: undefined,
    mutuals: [],
  };
}

const rahul: PersonProfile = {
  username: "rahul.iyer",
  name: "Rahul Iyer",
  photo: u("photo-1507003211169-0a1dd7228f2d", 400),
  cover: u("photo-1598488035139-bdbb2231ce04", 900),
  headline: "Producer & mix engineer for indie, electronic and film-adjacent records.",
  roleType: "Producer",
  primaryRole: "Music Producer",
  secondaryRoles: ["Mixing Engineer", "Keyboardist"],
  location: "Indiranagar, Bengaluru",
  availability: "Available for Session Work",
  verification: "Industry Verified",
  privacy: "Public",
  yearsActive: "11 years active",
  shortBio: "I build records around the vocal — warm low end, wide stereo, nothing overproduced.",
  longBio:
    "I build records around the vocal — warm low end, wide stereo, nothing overproduced. Started as a live keys player with touring indie acts, moved into production in 2017 and now split time between my room in Indiranagar and tracking days at Yash Raj Sound. I work fast on references, send stems labelled, and stay on a project through mastering hand-off. Comfortable with Hindi, Tamil and English lyric sessions.",
  genres: ["Indie", "Electronic", "R&B", "Bollywood", "Ambient"],
  instruments: ["Keyboard", "Synth", "Bass", "Percussion"],
  languages: ["English", "Tamil", "Kannada", "Hindi"],
  influences: ["Jai Paul", "Sneha Khanwalkar", "Jamie xx", "A. R. Rahman"],
  specialisations: ["Vocal production", "Analog summing", "Hybrid mixing", "Stem mastering prep"],
  professional: [
    { label: "DAW", value: "Ableton Live · Pro Tools" },
    { label: "Production styles", value: "Hybrid analog, live tracking" },
    { label: "Monitoring", value: "Focal Shape 65 · Neumann KH 80" },
    { label: "Turnaround", value: "3–5 working days per mix" },
    { label: "Session experience", value: "180+ released tracks" },
  ],
  stats: { connections: "1,284", followers: "8.1k", plays: "2.4M", credits: 67 },
  rating: 4.8,
  reviewCount: 46,
  links: [
    { label: "Spotify", handle: "Rahul Iyer" },
    { label: "SoundCloud", handle: "rahuliyersound" },
    { label: "YouTube", handle: "@rahuliyer" },
    { label: "Instagram", handle: "@rahul.iyer" },
  ],
  featured: {
    kind: "Track",
    title: "Neon Monsoon",
    meta: "Produced & mixed · 812k plays",
    image: u("photo-1470225620780-dba8ba36b745", 800),
  },
  audio: [
    {
      id: "a1",
      title: "Neon Monsoon",
      role: "Producer · Mix",
      project: "Neon Monsoon EP",
      duration: "3:42",
      artwork: art[0]!,
      featured: true,
    },
    {
      id: "a2",
      title: "Saanjh (Reprise)",
      role: "Mix",
      project: "Yash Raj Sound",
      duration: "4:08",
      artwork: art[1]!,
    },
    {
      id: "a3",
      title: "Kollam Nights",
      role: "Producer",
      project: "Single",
      duration: "3:15",
      artwork: art[2]!,
    },
    {
      id: "a4",
      title: "Low Tide Demo",
      role: "Writer · Producer",
      project: "Demo",
      duration: "2:31",
      artwork: art[3]!,
    },
  ],
  video: [
    {
      id: "v1",
      title: "Neon Monsoon — studio session",
      context: "Behind the scenes",
      duration: "6:12",
      thumb: shots[1]!,
    },
    {
      id: "v2",
      title: "Live keys — Bengaluru Sessions",
      context: "Live performance",
      duration: "12:40",
      thumb: shots[2]!,
    },
    {
      id: "v3",
      title: "Mixing walkthrough: vocal chain",
      context: "Studio",
      duration: "9:05",
      thumb: shots[3]!,
    },
  ],
  gallery: shots,
  projects: [
    {
      id: "p1",
      name: "Neon Monsoon — EP",
      role: "Producer · Mix engineer",
      collaborators: "Ananya Sharma, Kohra",
      genre: "Indie electronic",
      year: "2025",
      status: "Released",
      cover: art[0]!,
    },
    {
      id: "p2",
      name: "Rangreza (Title Track)",
      role: "Additional production",
      collaborators: "T-Series, Amit Trivedi",
      genre: "Hindi film",
      year: "2025",
      status: "Released",
      cover: art[1]!,
    },
    {
      id: "p3",
      name: "Untitled Score — short film",
      role: "Composer",
      collaborators: "Krimson Avenue",
      genre: "Ambient score",
      year: "2026",
      status: "In production",
      cover: art[2]!,
    },
  ],
  discography: [
    {
      id: "d1",
      title: "Neon Monsoon",
      kind: "EP",
      label: "Independent",
      year: "2025",
      cover: art[0]!,
    },
    {
      id: "d2",
      title: "Kollam Nights",
      kind: "Single",
      label: "Sony Music India",
      year: "2024",
      cover: art[2]!,
    },
    {
      id: "d3",
      title: "Saanjh",
      kind: "Album",
      label: "Yash Raj Sound",
      year: "2023",
      cover: art[1]!,
    },
  ],
  services: [
    {
      id: "s1",
      name: "Full track production",
      description: "Arrangement, session players, tracking and a mixed master-ready bounce.",
      from: { amount: "₹25,000", unit: "track" },
      turnaround: "2–3 weeks",
      mode: "Remote · In person",
      availability: "2 slots this month",
    },
    {
      id: "s2",
      name: "Mixing",
      description: "Hybrid mix with two revision rounds and stems delivered.",
      from: { amount: "₹12,000", unit: "song" },
      turnaround: "3–5 days",
      mode: "Remote",
      availability: "Open",
    },
    {
      id: "s3",
      name: "Production consult",
      description: "60-minute session on arrangement, references and release plan.",
      turnaround: "Same week",
      mode: "Remote",
      availability: "Open",
    },
  ],
  experience: [
    {
      id: "e1",
      title: "Producer · Mix engineer",
      org: "Independent",
      period: "2017 — present",
      detail: "180+ released tracks across indie, film and brand work.",
    },
    {
      id: "e2",
      title: "In-house engineer",
      org: "Yash Raj Sound",
      period: "2019 — 2022",
      detail: "Vocal tracking and mix prep for playback sessions.",
    },
    {
      id: "e3",
      title: "Touring keyboardist",
      org: "The Local Train",
      period: "2015 — 2018",
      detail: "40+ shows across India, live rig and playback design.",
    },
  ],
  collaborators: [
    {
      id: "c1",
      name: "Ananya Sharma",
      kind: "Artist",
      photo: u("photo-1534528741775-53994a69daeb", 200),
      link: { to: "/profile/$username", params: { username: "ananya.sharma" } },
    },
    {
      id: "c2",
      name: "Meher Kaur",
      kind: "Artist",
      photo: u("photo-1529626455594-4ff0802cfb7e", 200),
      link: { to: "/profile/$username", params: { username: "meher.kaur" } },
    },
    {
      id: "c3",
      name: "Yash Raj Sound",
      kind: "Studio",
      photo: u("photo-1598488035139-bdbb2231ce04", 200),
      link: { to: "/studio" },
    },
    {
      id: "c4",
      name: "The Local Train",
      kind: "Artist",
      photo: u("photo-1514320291840-2e0a9bf2a9ae", 200),
      link: { to: "/bands" },
    },
  ],
  reviews: [
    {
      id: "r1",
      by: "Ritesh Nair",
      org: "Sony Music India",
      context: "Mixing · Kollam Nights",
      stars: 5,
      text: "Turned around a difficult vocal comp in two days and the low end finally sat right.",
      response: "Thanks Ritesh — happy to jump on the next single.",
    },
    {
      id: "r2",
      by: "Krimson Avenue",
      org: "Studio, Bengaluru",
      context: "Production · short film score",
      stars: 5,
      text: "Clear communication, stems labelled properly, zero chasing.",
    },
    {
      id: "r3",
      by: "Ananya Sharma",
      org: "Playback vocalist",
      context: "Project · Neon Monsoon",
      stars: 4,
      text: "Great ear for vocal tuning. Schedule got tight near the end but he stayed on it.",
    },
  ],
  opportunities: [
    {
      id: "o1",
      title: "Looking for a vocalist",
      detail: "Indie electronic EP, 3 tracks, credited release · Bengaluru or remote",
      tone: "seeking",
    },
    {
      id: "o2",
      title: "Available for session work",
      detail: "Keys and production, weekday afternoons through October",
      tone: "offering",
    },
  ],
  market: [
    {
      id: "m1",
      title: "Neumann TLM 103",
      meta: "For sale · Like new",
      price: { amount: "₹68,000" },
      image: u("photo-1590602847861-f357a9332bbc", 400),
      kind: "sale",
      to: "/marketplace",
    },
    {
      id: "m2",
      title: "Fender Twin Reverb",
      meta: "For rent",
      price: { amount: "₹2,400", unit: "day" },
      image: u("photo-1511735111819-9a3f7709049c", 400),
      kind: "rental",
      to: "/marketplace/rent",
    },
  ],
  studio: { name: "Yash Raj Sound", meta: "Resident engineer · book a room", to: "/studio" },
  mutuals: [
    { name: "Ananya", photo: u("photo-1534528741775-53994a69daeb", 120) },
    { name: "Zaid", photo: u("photo-1519085360753-af0119f7cbe7", 120) },
    { name: "Tanvi", photo: u("photo-1544005313-94ddf0286df2", 120) },
  ],
};

const ananya: PersonProfile = {
  ...emptySections(),
  username: "ananya.sharma",
  name: "Ananya Sharma",
  photo: u("photo-1534528741775-53994a69daeb", 400),
  cover: u("photo-1514320291840-2e0a9bf2a9ae", 900),
  headline: "Playback vocalist — Hindi film, Sufi and pop sessions from a treated home booth.",
  roleType: "Vocal Artist",
  primaryRole: "Playback Vocalist",
  secondaryRoles: ["Vocal Arranger", "Songwriter"],
  location: "Andheri West, Mumbai",
  availability: "Available",
  verification: "Industry Verified",
  yearsActive: "9 years active",
  shortBio:
    "Trained in Hindustani classical for 12 years, now across film playback and indie releases.",
  longBio:
    "Trained in Hindustani classical for 12 years, now working across film playback and independent releases. Comfortable tracking remotely from a treated booth (Neumann TLM 103 · Apollo Twin X) with 48-hour turnaround, and equally at home on a scratch session with a live band.",
  genres: ["Hindi Film", "Pop Vocals", "Sufi", "Indie"],
  instruments: ["Voice", "Harmonium"],
  languages: ["Hindi", "Marathi", "English", "Punjabi"],
  influences: ["Shreya Ghoshal", "Kavita Krishnamurthy", "Norah Jones"],
  specialisations: ["Playback", "Vocal stacking", "Live scratch sessions"],
  professional: [
    { label: "Vocal type", value: "Mezzo-soprano" },
    { label: "Vocal range", value: "F3 — D6" },
    { label: "Booth", value: "Treated home booth · TLM 103 · Apollo Twin X" },
    { label: "Turnaround", value: "48 hours for stems" },
    { label: "Performance", value: "60+ live shows, 42 credited tracks" },
  ],
  stats: { connections: "2,140", followers: "12.4k", plays: "5.8M", credits: 42 },
  rating: 4.9,
  reviewCount: 38,
  featured: {
    kind: "Track",
    title: "Rangreza (Title Track)",
    meta: "Lead vocals · T-Series · 4.2M plays",
    image: u("photo-1511671782779-c97d3d27a1d4", 800),
  },
  services: [
    {
      id: "s1",
      name: "Session vocals",
      description: "Lead or backing vocals tracked remotely, comped and tuned.",
      from: { amount: "₹18,000", unit: "song" },
      turnaround: "48 hours",
      mode: "Remote · In person",
      availability: "Open",
    },
    {
      id: "s2",
      name: "Vocal arrangement",
      description: "Harmony stacks, ad-libs and a guide comp for your production.",
      from: { amount: "₹9,000", unit: "song" },
      turnaround: "3 days",
      mode: "Remote",
      availability: "Open",
    },
  ],
  market: [],
  studio: undefined,
  opportunities: [
    {
      id: "o1",
      title: "Available for shows",
      detail: "Mumbai and Pune, weekends through December",
      tone: "offering",
    },
  ],
};

const byUsername: Record<string, PersonProfile> = {
  [rahul.username]: rahul,
  [ananya.username]: ananya,
  ...Object.fromEntries(linkedProfileSeeds.map((s) => [s.profile.username, s.profile])),
};

/** A Discover talent's profile from its card record alone; sections the card lacks stay empty. */
function fromTalent(t: Talent): PersonProfile {
  return {
    ...emptySections(),
    username: t.id,
    name: t.name,
    photo: t.photo,
    cover: shots[2]!,
    headline: `${t.role} based in ${t.location}.`,
    roleType: "Musician",
    primaryRole: t.role.split(" · ")[0] ?? t.role,
    secondaryRoles: t.role.split(" · ").slice(1),
    location: t.location,
    availability:
      t.availability === "Booked"
        ? "Busy"
        : t.availability === "Selective"
          ? "In Studio"
          : "Available",
    verification: t.verified ? "Professional" : "Email Verified",
    genres: t.genres,
    languages: t.languages,
    stats: { connections: "—", followers: t.followers, plays: "—", credits: t.credits },
    rating: t.rating,
    shortBio: `${t.role} working across ${t.genres.slice(0, 2).join(" and ")}. Starting at ${priceText(t.rate)}.`,
    longBio: `${t.role} working across ${t.genres.join(", ")}. Sessions run remote or in person around ${t.location}, with starting rates from ${priceText(t.rate)}.`,
  };
}

export const allTalent = [...talents, ...singers];

/** The seed profile for a username, or undefined — never another person's profile. */
export function getProfile(username: string): PersonProfile | undefined {
  const exact = byUsername[username];
  if (exact) return exact;
  const t = allTalent.find((x) => x.id === username);
  return t ? fromTalent(t) : undefined;
}

/** Owner-mode fixtures (SCREEN 17 / 19 / 20). */
export const ownerUsername = rahul.username;
export const ownerProfile = rahul;

export const profileCompletion = {
  percent: 78,
  missing: [
    { id: "bio", label: "Professional bio", to: "/profile/edit" },
    { id: "instrument", label: "Primary instrument", to: "/profile/edit" },
    { id: "availability", label: "Availability window", to: "/profile/edit" },
  ],
};

/*
 * Design-time insight figures. There are no analytics tables yet, so these are sample numbers, and
 * the screen that shows them says so. `trend` is the same 28-day window as `range`, four readings a
 * week, so the chart and the headline figures describe one period rather than two.
 */
export const profileInsights = {
  range: "Last 28 days",
  trend: [
    { day: "28 Aug", views: 38, plays: 62 },
    { day: "31 Aug", views: 44, plays: 71 },
    { day: "3 Sep", views: 51, plays: 88 },
    { day: "6 Sep", views: 47, plays: 96 },
    { day: "9 Sep", views: 63, plays: 112 },
    { day: "12 Sep", views: 72, plays: 134 },
    { day: "15 Sep", views: 69, plays: 128 },
    { day: "18 Sep", views: 84, plays: 151 },
  ],
  headline: [
    { label: "Profile views", value: "1,842", delta: "+18%" },
    { label: "Portfolio views", value: "934", delta: "+12%" },
    { label: "Audio plays", value: "3,210", delta: "+31%" },
    { label: "Search appearances", value: "612", delta: "-4%" },
  ],
  secondary: [
    { label: "Profile shares", value: "48" },
    { label: "Connection requests", value: "26" },
    { label: "Messages started", value: "19" },
    { label: "Video plays", value: "780" },
  ],
  audience: [
    { city: "Mumbai", share: 34 },
    { city: "Bengaluru", share: 27 },
    { city: "Delhi NCR", share: 16 },
    { city: "Chennai", share: 12 },
    { city: "Other", share: 11 },
  ],
};

export const editSections = [
  { id: "identity", label: "Identity", detail: "Photo, name, username, headline", done: true },
  {
    id: "professional",
    label: "Professional",
    detail: "Roles, experience, professional details",
    done: true,
  },
  { id: "music", label: "Music", detail: "Genres, instruments, languages, influences", done: true },
  {
    id: "portfolio",
    label: "Portfolio",
    detail: "Audio, video, gallery, featured work",
    done: false,
  },
  { id: "services", label: "Services", detail: "Offerings, rates, turnaround", done: true },
  { id: "availability", label: "Availability", detail: "Status and booking windows", done: false },
  { id: "links", label: "Social links", detail: "Streaming and social profiles", done: true },
  { id: "privacy", label: "Privacy", detail: "Who sees contact, portfolio, activity", done: true },
  {
    id: "verification",
    label: "Verification",
    detail: "Industry verified · renew Mar 2027",
    done: true,
  },
];
