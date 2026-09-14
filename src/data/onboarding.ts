// FLOW-02 — User Onboarding
// Design-only data layer. Master data below mirrors canonical MusicLinkd
// master-data collections; nothing here performs network or persistence work.
//
// Field support legend:
//   EXISTING  — already present on the canonical profile model
//   COMPUTED  — derived at read time (never stored)
//   PROPOSED  — needs a canonical field before production
//   FUTURE    — out of scope for this release

import type { PersonaBucket } from "@/lib/taxonomy";

export type FieldSupport = "EXISTING" | "COMPUTED" | "PROPOSED" | "FUTURE";

export type ScreenContract = {
  flow: "FLOW-02";
  screen: string;
  screenName: string;
  module: "Onboarding";
  route: string;
  dataSource: string[];
  entities: string[];
  states: string[];
  actions: string[];
};

const baseStates = ["loading", "loaded", "saving", "error", "offline"];
const baseActions = ["continue", "skip", "save", "back", "complete"];

function contract(
  screen: string,
  screenName: string,
  route: string,
  dataSource: string[],
  entities: string[],
): ScreenContract {
  return {
    flow: "FLOW-02",
    screen,
    screenName,
    module: "Onboarding",
    route,
    dataSource,
    entities,
    states: baseStates,
    actions: baseActions,
  };
}

/* ------------------------------------------------------------------ */
/* Master data                                                         */
/* ------------------------------------------------------------------ */

/** A person_types slug from the taxonomy (e.g. "singer", "music_director"). */
export type RoleKey = string;

export type RoleDef = {
  key: RoleKey;
  label: string;
  hint: string;
  /** Roles that should be asked about instruments. */
  instruments: boolean;
};

export const roles: RoleDef[] = [
  {
    key: "singer",
    label: "Singer",
    hint: "Vocalist, playback, live",
    instruments: false,
  },
  {
    key: "musician",
    label: "Musician",
    hint: "Session, live, studio",
    instruments: true,
  },
  {
    key: "producer",
    label: "Producer",
    hint: "Beats, arrangement, mix",
    instruments: true,
  },
  {
    key: "composer",
    label: "Composer",
    hint: "Score, jingles, film",
    instruments: true,
  },
  {
    key: "lyricist",
    label: "Lyricist",
    hint: "Writing, adaptation",
    instruments: false,
  },
  {
    key: "music-director",
    label: "Music Director",
    hint: "Leading music teams",
    instruments: false,
  },
  {
    key: "sound-engineer",
    label: "Sound Engineer",
    hint: "Record, mix, master",
    instruments: false,
  },
  { key: "dj", label: "DJ", hint: "Clubs, weddings, events", instruments: false },
  { key: "rj", label: "RJ", hint: "Radio, hosting", instruments: false },
  {
    key: "podcaster",
    label: "Podcaster",
    hint: "Shows and audio series",
    instruments: false,
  },
  {
    key: "voice-artist",
    label: "Voice Artist",
    hint: "Dubbing, ads, narration",
    instruments: false,
  },
  {
    key: "music-teacher",
    label: "Music Teacher",
    hint: "Lessons and coaching",
    instruments: true,
  },
  { key: "other", label: "Other", hint: "Tell us in your bio", instruments: false },
];

export const instruments = [
  "Guitar",
  "Bass",
  "Keyboard",
  "Piano",
  "Drums",
  "Tabla",
  "Sitar",
  "Flute",
  "Violin",
  "Percussion",
  "Santoor",
  "Harmonium",
  "Saxophone",
  "Other",
];

export const genres = [
  "Bollywood",
  "Classical",
  "Folk",
  "Rock",
  "Indie",
  "Jazz",
  "Fusion",
  "Sufi",
  "Devotional",
  "Electronic",
  "Hip-Hop",
  "Regional",
  "Pop",
  "Other",
];

export const languages = [
  "Hindi",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Bhojpuri",
  "Assamese",
  "English",
  "Other",
];

export const workModes = [
  { key: "in-person", label: "In person", hint: "Studios, stages, sets" },
  { key: "remote", label: "Remote", hint: "Files, stems, online sessions" },
  { key: "hybrid", label: "Hybrid", hint: "A mix of both" },
  { key: "touring", label: "Travel / touring", hint: "Happy to travel for work" },
];

export const availabilityFor = [
  "Shows",
  "Session Work",
  "Collaborations",
  "Projects",
  "Teaching",
  "Recording",
  "Production",
  "Freelance Work",
  "Touring",
];

export const intents = [
  "Find Collaborators",
  "Find Work",
  "Hire Talent",
  "Find Studios",
  "Buy Equipment",
  "Rent Equipment",
  "Sell Equipment",
  "Join Communities",
  "Discover Music",
  "Promote My Work",
  "Build Professional Network",
];

export const experienceLevels = [
  { key: "starting", label: "Just starting", hint: "Learning and building work" },
  { key: "1-2", label: "1–2 years", hint: "Early projects and credits" },
  { key: "3-5", label: "3–5 years", hint: "Steady professional work" },
  { key: "5-10", label: "5–10 years", hint: "Established across projects" },
  { key: "10+", label: "10+ years", hint: "Deep industry experience" },
  { key: "established", label: "Professional / established", hint: "Recognised body of work" },
];

export const discoveryPrefs = [
  "People",
  "Studios",
  "Services",
  "Music",
  "Projects",
  "Opportunities",
  "Marketplace",
  "Communities",
  "Businesses",
];

export const visibilityOptions = [
  {
    key: "public",
    label: "Public",
    hint: "Anyone on the internet can find your profile. Best for getting hired.",
  },
  {
    key: "members",
    label: "MusicLinkd members",
    hint: "Only signed-in members can view your full profile.",
  },
  {
    key: "limited",
    label: "Limited",
    hint: "Only your connections see details. You'll appear less in discovery.",
  },
];

export const contactChannels = [
  { key: "messages", label: "MusicLinkd messages", hint: "Always on. Nothing private is shared." },
  { key: "email", label: "Email", hint: "Shared only when you accept an enquiry." },
  { key: "phone", label: "Phone", hint: "Kept private until you choose to share." },
  { key: "business", label: "Business contact", hint: "For a studio, label or agency line." },
];

export const linkPlatforms = [
  { key: "website", label: "Website", placeholder: "https://yourname.com" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/..." },
  { key: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/username" },
];

export const businessTypes = [
  "Studio",
  "Label",
  "Agency",
  "Venue",
  "Dealer",
  "Rental Provider",
  "Music School",
  "Production House",
  "Other",
];

/* Location master data (city-level is enough for discovery). */
export const countries = ["India"];
export const statesByCountry: Record<string, string[]> = {
  India: [
    "Maharashtra",
    "Delhi",
    "Karnataka",
    "Tamil Nadu",
    "West Bengal",
    "Punjab",
    "Kerala",
    "Goa",
  ],
};
export const citiesByState: Record<string, string[]> = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Delhi: ["New Delhi", "Dwarka", "Noida", "Gurugram"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
  Goa: ["Panaji", "Margao", "Vagator"],
};

/* Role-adaptive specialisation sets. */
export const specialisationByRole: Record<
  string,
  { title: string; groups: { label: string; options: string[] }[] }
> = {
  singer: {
    title: "How do you sing?",
    groups: [
      { label: "Vocal type", options: ["Male", "Female", "Baritone", "Tenor", "Soprano", "Alto"] },
      { label: "Vocal range", options: ["Low", "Mid", "High", "Wide range"] },
      {
        label: "Performance type",
        options: ["Playback", "Live shows", "Studio sessions", "Backing vocals", "Jingles"],
      },
    ],
  },
  musician: {
    title: "How do you play professionally?",
    groups: [
      {
        label: "Work type",
        options: ["Session work", "Live performance", "Touring band", "Studio recording"],
      },
      {
        label: "Strengths",
        options: ["Sight reading", "Improvisation", "Arrangement", "Programming"],
      },
    ],
  },
  producer: {
    title: "What do you produce?",
    groups: [
      {
        label: "Production",
        options: ["Full production", "Arrangement", "Beat making", "Topline", "Remixing"],
      },
      {
        label: "Tools",
        options: ["Ableton Live", "Logic Pro", "FL Studio", "Pro Tools", "Cubase", "Reaper"],
      },
    ],
  },
  composer: {
    title: "What do you compose for?",
    groups: [
      {
        label: "Composition type",
        options: ["Film", "Advertising", "Background score", "Series", "Games", "Independent"],
      },
    ],
  },
  sound_engineer: {
    title: "What's your engineering focus?",
    groups: [
      {
        label: "Discipline",
        options: ["Recording", "Mixing", "Mastering", "Live sound", "Post production"],
      },
      {
        label: "Tools",
        options: ["Pro Tools", "Logic Pro", "Nuendo", "Ableton Live", "Analog console"],
      },
    ],
  },
  dj: {
    title: "Where do you play?",
    groups: [
      {
        label: "Event types",
        options: ["Clubs", "Weddings", "Corporate", "Festivals", "Private parties"],
      },
      { label: "Setup", options: ["Own CDJs", "Own controller", "Own PA", "Venue gear only"] },
    ],
  },
  music_teacher: {
    title: "What do you teach?",
    groups: [
      { label: "Format", options: ["One to one", "Group classes", "Online", "At student's place"] },
      { label: "Level", options: ["Beginner", "Intermediate", "Advanced", "Exam prep"] },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Onboarding draft (design-time shape)                                */
/* ------------------------------------------------------------------ */

export type OnboardingDraft = {
  displayName: string; // EXISTING users.displayName
  username: string; // EXISTING users.username
  photo: string | null; // EXISTING users.avatarUrl
  cover: string | null; // EXISTING professionalProfiles.coverUrl
  primaryRole: RoleKey | null; // EXISTING professionalProfiles.primaryRole
  secondaryRoles: string[]; // EXISTING professionalProfiles.roles[]
  primaryInstrument: string | null; // EXISTING professionalProfiles.instruments[0]
  instruments: string[]; // EXISTING
  specialisation: Record<string, string[]>; // PROPOSED professionalProfiles.specialisations
  genres: string[]; // EXISTING
  languages: string[]; // EXISTING
  country: string;
  state: string;
  city: string;
  locality: string; // PROPOSED location.locality
  workModes: string[]; // PROPOSED professionalProfiles.workModes
  availability: string[]; // EXISTING availability.openFor
  intents: string[]; // PROPOSED preferences.intents
  experience: string | null; // EXISTING professionalProfiles.experienceLevel
  bio: string; // EXISTING
  links: Record<string, string>; // EXISTING profileLinks
  contact: string[]; // EXISTING preferences.contactChannels
  discovery: string[]; // PROPOSED preferences.discoveryTopics
  visibility: string; // EXISTING profile.visibility
  businessIntent: string | null; // hand-off to FLOW-12
  completedSteps: string[]; // COMPUTED
};

export const emptyDraft: OnboardingDraft = {
  displayName: "",
  username: "",
  photo: null,
  cover: null,
  primaryRole: null,
  secondaryRoles: [],
  primaryInstrument: null,
  instruments: [],
  specialisation: {},
  genres: [],
  languages: [],
  country: "India",
  state: "",
  city: "",
  locality: "",
  workModes: [],
  availability: [],
  intents: [],
  experience: null,
  bio: "",
  links: {},
  contact: ["messages"],
  discovery: [],
  visibility: "public",
  businessIntent: null,
  completedSteps: [],
};

/* ------------------------------------------------------------------ */
/* Step model                                                          */
/* ------------------------------------------------------------------ */

export type StepId =
  | "identity"
  | "photo"
  | "role"
  | "secondary-roles"
  | "instruments"
  | "specialisation"
  | "genres"
  | "languages"
  | "location"
  | "work-mode"
  | "availability"
  | "intent"
  | "experience"
  | "bio"
  | "links"
  | "contact"
  | "discovery"
  | "visibility"
  | "business"
  | "handoffs";

export type StepDef = {
  id: StepId;
  group: string;
  title: string;
  subtitle: string;
  why: string;
  optional: boolean;
  contract: ScreenContract;
  /**
   * Smart skip — a step is hidden when this returns false. `bucket` is the persona_bucket answer for
   * the draft's roles and languages, or null while it is loading.
   */
  visible?: (d: OnboardingDraft, bucket: PersonaBucket | null) => boolean;
};

export const steps: StepDef[] = [
  {
    id: "identity",
    group: "Identity",
    title: "What should we call you?",
    subtitle: "This is how people find and credit you.",
    why: "Your name and username appear on every credit, message and search result.",
    optional: false,
    contract: contract(
      "ONB-02",
      "Identity Basics",
      "/onboarding/step/identity",
      ["users"],
      ["user"],
    ),
  },
  {
    id: "photo",
    group: "Identity",
    title: "Add a photo",
    subtitle: "A face helps people trust an enquiry.",
    why: "Profiles with a photo get noticeably more replies. No headshot needed.",
    optional: true,
    contract: contract("ONB-03", "Profile Photo", "/onboarding/step/photo", ["users"], ["user"]),
  },
  {
    id: "role",
    group: "Profession",
    title: "What do you do?",
    subtitle: "Pick the one that describes you best.",
    why: "Your primary role shapes the rest of this setup and how you're discovered.",
    optional: false,
    contract: contract(
      "ONB-04",
      "Primary Role",
      "/onboarding/step/role",
      ["masterData"],
      ["role", "professionalProfile"],
    ),
  },
  {
    id: "secondary-roles",
    group: "Profession",
    title: "Anything else you do?",
    subtitle: "Optional. Pick up to two.",
    why: "Extra roles widen the work you show up for, without diluting your main one.",
    optional: true,
    contract: contract(
      "ONB-05",
      "Secondary Roles",
      "/onboarding/step/secondary-roles",
      ["masterData"],
      ["role"],
    ),
  },
  {
    id: "instruments",
    group: "Expertise",
    title: "What do you play?",
    subtitle: "Mark one as your primary instrument.",
    why: "Instrument is one of the strongest filters people use to book players.",
    optional: true,
    // Skipped when the person's roles hold no instruments (persona_bucket returns none).
    visible: (d, bucket) =>
      Boolean(d.primaryRole) && (bucket ? bucket.instruments.length > 0 : true),
    contract: contract(
      "ONB-06",
      "Instruments",
      "/onboarding/step/instruments",
      ["masterData"],
      ["instrument"],
    ),
  },
  {
    id: "specialisation",
    group: "Expertise",
    title: "Your specialisation",
    subtitle: "Only what's relevant to your role.",
    why: "Specialisation is what turns a search result into a booking.",
    optional: true,
    visible: (d) => Boolean(d.primaryRole && specialisationByRole[d.primaryRole]),
    contract: contract(
      "ONB-07",
      "Professional Specialisation",
      "/onboarding/step/specialisation",
      ["masterData"],
      ["professionalProfile"],
    ),
  },
  {
    id: "languages",
    group: "Expertise",
    title: "Which languages do you work in?",
    subtitle: "Choose all that apply.",
    why: "Language decides a lot of casting in Indian music work.",
    optional: true,
    contract: contract(
      "ONB-09",
      "Languages",
      "/onboarding/step/languages",
      ["masterData"],
      ["language"],
    ),
  },
  {
    id: "genres",
    group: "Expertise",
    title: "What music do you work with?",
    subtitle: "Choose all that apply.",
    why: "Genres drive your recommendations and who gets matched with you.",
    optional: true,
    contract: contract("ONB-08", "Genres", "/onboarding/step/genres", ["masterData"], ["genre"]),
  },
  {
    id: "location",
    group: "Context",
    title: "Where are you based?",
    subtitle: "City level is enough.",
    why: "Most work starts local. We never show your exact address.",
    optional: false,
    contract: contract(
      "ONB-10",
      "Location",
      "/onboarding/step/location",
      ["masterData"],
      ["location"],
    ),
  },
  {
    id: "work-mode",
    group: "Context",
    title: "How do you work?",
    subtitle: "Pick everything that applies.",
    why: "Remote-friendly profiles get enquiries from outside their city.",
    optional: true,
    contract: contract(
      "ONB-11",
      "Work Mode",
      "/onboarding/step/work-mode",
      ["masterData"],
      ["professionalProfile"],
    ),
  },
  {
    id: "availability",
    group: "Intent",
    title: "What are you available for?",
    subtitle: "You can fine-tune this later in Services.",
    why: "This is a high-level signal. Detailed pricing lives in Services & Availability.",
    optional: true,
    contract: contract(
      "ONB-12",
      "Availability",
      "/onboarding/step/availability",
      ["masterData"],
      ["availability"],
    ),
  },
  {
    id: "intent",
    group: "Intent",
    title: "What brings you to MusicLinkd?",
    subtitle: "Pick as many as you like.",
    why: "We'll shape your home feed and recommendations around this.",
    optional: true,
    contract: contract(
      "ONB-13",
      "Professional Intent",
      "/onboarding/step/intent",
      ["masterData"],
      ["preferences"],
    ),
  },
  {
    id: "experience",
    group: "Intent",
    title: "How experienced are you?",
    subtitle: "Not a ranking — just context.",
    why: "Helps match you to the right briefs. Never shown as a score.",
    optional: true,
    contract: contract(
      "ONB-14",
      "Experience",
      "/onboarding/step/experience",
      ["masterData"],
      ["professionalProfile"],
    ),
  },
  {
    id: "bio",
    group: "Profile",
    title: "Tell people about yourself",
    subtitle: "Two lines is plenty.",
    why: "Your bio is the first thing read after your name and role.",
    optional: true,
    contract: contract(
      "ONB-15",
      "Bio",
      "/onboarding/step/bio",
      ["professionalProfiles"],
      ["professionalProfile"],
    ),
  },
  {
    id: "links",
    group: "Profile",
    title: "Where else can people hear you?",
    subtitle: "Optional. Add only what you use.",
    why: "External links carry proof of work until your portfolio is up.",
    optional: true,
    contract: contract(
      "ONB-16",
      "Profile Links",
      "/onboarding/step/links",
      ["profileLinks"],
      ["profileLink"],
    ),
  },
  {
    id: "contact",
    group: "Profile",
    title: "How can people reach you?",
    subtitle: "Private by default.",
    why: "Nothing private is published. You choose what to share per enquiry.",
    optional: true,
    contract: contract(
      "ONB-17",
      "Contact Preferences",
      "/onboarding/step/contact",
      ["preferences"],
      ["preferences"],
    ),
  },
  {
    id: "discovery",
    group: "Personalisation",
    title: "What would you like to discover?",
    subtitle: "We'll tune your feed to this.",
    why: "Feeds Discover and Recommendations. You can change it anytime.",
    optional: true,
    contract: contract(
      "ONB-18",
      "Discovery Preferences",
      "/onboarding/step/discovery",
      ["preferences"],
      ["preferences"],
    ),
  },
  {
    id: "visibility",
    group: "Personalisation",
    title: "Who can see your profile?",
    subtitle: "You can change this whenever you want.",
    why: "Public profiles are found by clients outside MusicLinkd too.",
    optional: false,
    contract: contract(
      "ONB-19",
      "Profile Visibility",
      "/onboarding/step/visibility",
      ["users"],
      ["user"],
    ),
  },
  {
    id: "business",
    group: "Personalisation",
    title: "Do you represent a business?",
    subtitle: "Studio, label, agency, school and more.",
    why: "Businesses get their own profile with team, services and verification.",
    optional: true,
    contract: contract(
      "ONB-26",
      "Business Intent",
      "/onboarding/step/business",
      ["businesses"],
      ["business"],
    ),
  },
];

export function visibleSteps(
  draft: OnboardingDraft,
  bucket: PersonaBucket | null = null,
): StepDef[] {
  return steps.filter((s) => (s.visible ? s.visible(draft, bucket) : true));
}

export function stepIndex(
  draft: OnboardingDraft,
  id: string,
  bucket: PersonaBucket | null = null,
): number {
  return visibleSteps(draft, bucket).findIndex((s) => s.id === id);
}

/** COMPUTED — usefulness-based readiness, not an arbitrary percentage. */
export type Readiness = {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  cta?: string;
  to?: "/portfolio/new" | "/services" | "/verification";
};

export function readiness(d: OnboardingDraft): Readiness[] {
  return [
    {
      key: "identity",
      label: "Identity complete",
      hint: "Name, username and photo",
      done: Boolean(d.displayName && d.username),
    },
    {
      key: "professional",
      label: "Professional context",
      hint: "Role, expertise and genres",
      done: Boolean(d.primaryRole && d.genres.length),
    },
    {
      key: "discovery",
      label: "Discovery ready",
      hint: "Location and languages set",
      done: Boolean(d.city && d.languages.length),
    },
    {
      key: "portfolio",
      label: "Portfolio ready",
      hint: "Add tracks, videos or credits",
      done: false,
      cta: "Add portfolio",
      to: "/portfolio/new",
    },
    {
      key: "services",
      label: "Opportunity ready",
      hint: "Set services and availability",
      done: false,
      cta: "Set services",
      to: "/services",
    },
    {
      key: "verification",
      label: "Trusted profile",
      hint: "Verify your professional identity",
      done: false,
      cta: "Verify profile",
      to: "/verification",
    },
  ];
}

export function completionPercent(d: OnboardingDraft): number {
  const r = readiness(d);
  return Math.round((r.filter((x) => x.done).length / r.length) * 100);
}

export const screenContracts = {
  welcome: contract(
    "ONB-01",
    "Onboarding Welcome",
    "/onboarding",
    ["users", "professionalProfiles", "masterData"],
    ["user"],
  ),
  preview: contract(
    "ONB-20",
    "Profile Preview",
    "/onboarding/preview",
    ["users", "professionalProfiles"],
    ["user", "professionalProfile"],
  ),
  completion: contract(
    "ONB-21",
    "Profile Completion",
    "/onboarding/complete",
    ["professionalProfiles"],
    ["professionalProfile"],
  ),
  done: contract("ONB-22", "Onboarding Complete", "/onboarding/done", ["users"], ["user"]),
  skip: contract("ONB-23", "Skip / Complete Later", "/onboarding/skip", ["users"], ["user"]),
  resume: contract("ONB-24", "Resume Onboarding", "/onboarding/resume", ["users"], ["user"]),
};

/** Reserved usernames used for the inline availability check (design-time). */
export const takenUsernames = ["ananya", "arijit", "admin", "musiclinkd", "rahul"];

export function validateUsername(v: string): { ok: boolean; message: string } {
  if (!v) return { ok: false, message: "Pick a username so people can find you." };
  if (v.length < 3) return { ok: false, message: "At least 3 characters." };
  if (!/^[a-z0-9._]+$/.test(v))
    return { ok: false, message: "Lowercase letters, numbers, dots and underscores only." };
  if (takenUsernames.includes(v)) return { ok: false, message: "That one's taken. Try another." };
  return { ok: true, message: `musiclinkd.com/${v} is available` };
}

export function validateUrl(v: string): boolean {
  if (!v) return true;
  return /^https?:\/\/[^\s.]+\.[^\s]{2,}$/.test(v.trim());
}

export const BIO_LIMIT = 240;
