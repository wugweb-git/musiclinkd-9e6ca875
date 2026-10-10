/**
 * FLOW 05 — OPPORTUNITIES. Design-only mock data.
 * Canonical names: opportunity, opportunity_category, opportunity_requirement,
 * opportunity_compensation, application, application_status, applicant_shortlist.
 * Links out to: profile (FLOW 10/14), portfolio_item (FLOW 03), message thread (FLOW 06),
 * booking (FLOW 08), business_profile (FLOW 12).
 */

import { inr, type PriceParts } from "@/lib/price";
import { unsplash } from "./unsplash";

export type OpportunityKind =
  "Person" | "Gig" | "Project" | "Studio" | "Venue" | "Equipment" | "Collaborator";

export type OpportunityStatus = "open" | "reviewing" | "closed" | "draft" | "filled";

export type ApplicationStatus =
  "draft" | "submitted" | "viewed" | "shortlisted" | "accepted" | "rejected" | "withdrawn";

export type OpportunityCategory = {
  key: string;
  label: string;
  kind: OpportunityKind;
  emoji: string;
  count: number;
};

export const opportunityCategories: OpportunityCategory[] = [
  { key: "singer", label: "Singer", kind: "Person", emoji: "🎤", count: 42 },
  { key: "guitarist", label: "Guitarist", kind: "Person", emoji: "🎸", count: 28 },
  { key: "producer", label: "Producer", kind: "Person", emoji: "🎛", count: 35 },
  { key: "composer", label: "Composer", kind: "Person", emoji: "🎼", count: 12 },
  { key: "lyricist", label: "Lyricist", kind: "Person", emoji: "✍️", count: 9 },
  { key: "mixing", label: "Mixing engineer", kind: "Person", emoji: "🎚", count: 17 },
  { key: "mastering", label: "Mastering engineer", kind: "Person", emoji: "📀", count: 8 },
  { key: "session", label: "Session musician", kind: "Person", emoji: "🥁", count: 21 },
  { key: "dj", label: "DJ", kind: "Person", emoji: "🎧", count: 14 },
  { key: "sound", label: "Sound engineer", kind: "Person", emoji: "🔊", count: 11 },
  { key: "studio", label: "Studio", kind: "Studio", emoji: "🏠", count: 19 },
  { key: "venue", label: "Venue", kind: "Venue", emoji: "🎪", count: 7 },
  { key: "equipment", label: "Equipment", kind: "Equipment", emoji: "🎹", count: 6 },
  { key: "bandmember", label: "Band member", kind: "Collaborator", emoji: "🤝", count: 16 },
  { key: "collab", label: "Collaborator", kind: "Collaborator", emoji: "✨", count: 23 },
  { key: "gig", label: "Gig", kind: "Gig", emoji: "🎫", count: 31 },
  { key: "recording", label: "Recording project", kind: "Project", emoji: "🎙", count: 25 },
  { key: "film", label: "Film", kind: "Project", emoji: "🎬", count: 10 },
  { key: "podcast", label: "Podcast production", kind: "Project", emoji: "🎚", count: 5 },
  { key: "event", label: "Event requirement", kind: "Gig", emoji: "📅", count: 13 },
];

export type Opportunity = {
  /** opportunity.id */
  id: string;
  title: string;
  categoryKey: string;
  kind: OpportunityKind;
  status: OpportunityStatus;
  /** poster is a profile or business_profile */
  poster: {
    id: string;
    name: string;
    username: string;
    photo: string;
    kindLabel: string;
    verified: boolean;
    rating: number;
    hires: number;
  };
  city: string;
  /** Empty for stored opportunities, which do not record a work mode. */
  workMode: "On-site" | "Remote" | "Hybrid" | "";
  postedAt: string;
  closesAt: string;
  /** opportunity_compensation */
  compensation: {
    /** Unset when a stored collaboration type has no unambiguous match. */
    type?: "Paid" | "Revenue share" | "Co-write" | "Unpaid";
    min?: number;
    max?: number;
    /** A bare unit ("song"), empty when the pay is not per unit. */
    unit: string;
    negotiable: boolean;
    /** Stored price text that is not an amount ("Royalties Split", "Under Discussion"). */
    note?: string;
  };
  summary: string;
  brief: string[];
  /** opportunity_requirement[] */
  requirements: { label: string; must: boolean }[];
  genres: string[];
  /** Stored genre slugs, for matching against a profile. Absent on the static opportunities. */
  genreKeys?: string[];
  languages: string[];
  dates: string;
  applicants: number;
  views: number;
  saved: boolean;
  matchScore: number;
  matchReasons: string[];
  featured?: boolean;
};

const u = (id: string, w = 320) => unsplash(id, w);

export const opportunities: Opportunity[] = [
  {
    id: "op-1",
    title: "Female playback singer for indie-pop single",
    categoryKey: "singer",
    kind: "Person",
    status: "open",
    poster: {
      id: "biz-sunset",
      name: "Sunset Records",
      username: "sunsetrecords",
      photo: u("photo-1470225620780-dba8ba36b745"),
      kindLabel: "Independent label · Mumbai",
      verified: true,
      rating: 4.8,
      hires: 34,
    },
    city: "Mumbai",
    workMode: "Hybrid",
    postedAt: "2 days ago",
    closesAt: "Closes in 9 days",
    compensation: { type: "Paid", min: 25000, max: 40000, unit: "song", negotiable: true },
    summary:
      "Warm mid-range vocal for a 3-minute indie-pop single. Two studio days in Andheri plus remote comps.",
    brief: [
      "Reference: Prateek Kuhad meets Lifafa — intimate, breathy, restrained.",
      "Scratch vocal and stems will be shared after shortlisting.",
      "Credited release on all DSPs, plus a music-video appearance if you're up for it.",
    ],
    requirements: [
      { label: "Hindi + English diction", must: true },
      { label: "2+ released singles in portfolio", must: true },
      { label: "Available 18–22 Sep", must: true },
      { label: "Home recording setup", must: false },
    ],
    genres: ["Indie pop", "Alt"],
    languages: ["Hindi", "English"],
    dates: "18–22 Sep 2026",
    applicants: 27,
    views: 412,
    saved: true,
    matchScore: 92,
    matchReasons: [
      "Your genres match",
      "You're available those dates",
      "3 portfolio tracks fit the brief",
    ],
    featured: true,
  },
  {
    id: "op-2",
    title: "Mixing engineer — 6-track alt-rock EP",
    categoryKey: "mixing",
    kind: "Person",
    status: "open",
    poster: {
      id: "usr-kabir",
      name: "Kabir Menon",
      username: "kabirmenon",
      photo: u("photo-1500648767791-00dcc994a43e"),
      kindLabel: "Artist · Bengaluru",
      verified: true,
      rating: 4.9,
      hires: 11,
    },
    city: "Bengaluru",
    workMode: "Remote",
    postedAt: "5 hours ago",
    closesAt: "Closes in 14 days",
    compensation: { type: "Paid", min: 8000, max: 12000, unit: "track", negotiable: true },
    summary:
      "Tracked and edited, needs a mixer who can keep guitars aggressive without losing the vocal.",
    brief: [
      "Sessions delivered as Pro Tools or stems at 48k/24-bit.",
      "Two revision rounds per track built into the fee.",
      "Mastering handled separately — see the linked opportunity.",
    ],
    requirements: [
      { label: "Alt-rock references", must: true },
      { label: "3-week turnaround", must: true },
      { label: "Analogue summing", must: false },
    ],
    genres: ["Alt rock", "Post rock"],
    languages: ["English"],
    dates: "Start 1 Oct 2026",
    applicants: 9,
    views: 138,
    saved: false,
    matchScore: 78,
    matchReasons: ["Remote-friendly", "Matches your mixing service"],
  },
  {
    id: "op-3",
    title: "Session drummer for 2-night club run",
    categoryKey: "session",
    kind: "Gig",
    status: "open",
    poster: {
      id: "biz-antisocial",
      name: "The Quarter",
      username: "thequarter",
      photo: u("photo-1493225457124-a3eb161ffa5f"),
      kindLabel: "Venue · Mumbai",
      verified: true,
      rating: 4.6,
      hires: 62,
    },
    city: "Mumbai",
    workMode: "On-site",
    postedAt: "1 day ago",
    closesAt: "Closes in 4 days",
    compensation: { type: "Paid", min: 15000, unit: "night", negotiable: false },
    summary: "Funk house band, two nights, one paid rehearsal. Backline provided.",
    brief: [
      "Set list shared 5 days out.",
      "Load-in 6pm, downbeat 9pm.",
      "Backline: DW kit, you bring cymbals and snare.",
    ],
    requirements: [
      { label: "Funk pocket", must: true },
      { label: "Own cymbals + snare", must: true },
      { label: "Reading charts", must: false },
    ],
    genres: ["Funk", "Soul"],
    languages: ["English"],
    dates: "27–28 Sep 2026",
    applicants: 18,
    views: 260,
    saved: false,
    matchScore: 64,
    matchReasons: ["In your city"],
  },
  {
    id: "op-4",
    title: "Recording studio needed — 3 days, live tracking",
    categoryKey: "studio",
    kind: "Studio",
    status: "open",
    poster: {
      id: "usr-meera",
      name: "Meera Raghav",
      username: "meeraraghav",
      photo: u("photo-1524504388940-b1c1722653e1"),
      kindLabel: "Producer · Pune",
      verified: false,
      rating: 4.7,
      hires: 6,
    },
    city: "Pune",
    workMode: "On-site",
    postedAt: "3 days ago",
    closesAt: "Closes in 6 days",
    compensation: { type: "Paid", min: 18000, max: 30000, unit: "day", negotiable: true },
    summary:
      "Looking for a live room that fits a 5-piece with isolation for drums and a decent piano.",
    brief: [
      "Three consecutive days in October.",
      "Engineer can be in-house or ours.",
      "Need a tie-line to a control room with good monitoring.",
    ],
    requirements: [
      { label: "Live room 400+ sq ft", must: true },
      { label: "Drum isolation", must: true },
      { label: "In-house engineer", must: false },
    ],
    genres: ["Jazz", "Fusion"],
    languages: ["English", "Marathi"],
    dates: "Any 3 days in Oct",
    applicants: 5,
    views: 96,
    saved: true,
    matchScore: 55,
    matchReasons: ["Studios you manage are free those dates"],
  },
  {
    id: "op-5",
    title: "Lyricist — Hindi, brand film for a sneaker launch",
    categoryKey: "lyricist",
    kind: "Project",
    status: "open",
    poster: {
      id: "biz-northlight",
      name: "Northlight Films",
      username: "northlightfilms",
      photo: u("photo-1478720568477-152d9b164e26"),
      kindLabel: "Production house · Delhi",
      verified: true,
      rating: 4.5,
      hires: 21,
    },
    city: "Delhi",
    workMode: "Remote",
    postedAt: "6 days ago",
    closesAt: "Closes in 2 days",
    compensation: { type: "Paid", min: 60000, unit: "", note: "flat", negotiable: false },
    summary: "60-second brand film. Needs punchy, street-leaning Hindi with one English hook line.",
    brief: [
      "Locked picture and scratch bed shared on shortlist.",
      "Two rounds of client revisions.",
      "Buyout for 12 months, India + digital.",
    ],
    requirements: [
      { label: "Hindi writing samples", must: true },
      { label: "Ad film experience", must: true },
      { label: "NDA signature", must: true },
    ],
    genres: ["Hip hop", "Advertising"],
    languages: ["Hindi", "English"],
    dates: "Delivery by 10 Oct",
    applicants: 41,
    views: 690,
    saved: false,
    matchScore: 47,
    matchReasons: ["Remote-friendly"],
  },
];

export function getOpportunity(id: string) {
  return opportunities.find((o) => o.id === id);
}

export function categoryLabel(key: string) {
  return opportunityCategories.find((c) => c.key === key)?.label ?? key;
}

/** The pay as amount ("₹25,000–₹40,000"), unit ("song") and note; null when nothing is known. */
export function payParts(o: Opportunity): PriceParts | null {
  const c = o.compensation;
  // Stored opportunities without an amount show their price text as stored.
  if (c.min == null && c.note) return { amount: c.note };
  if (c.type !== "Paid") return c.type ? { amount: c.type } : null;
  if (c.min == null) return null;
  const range = c.max ? `${inr(c.min)}–${inr(c.max)}` : inr(c.min);
  return {
    amount: range,
    ...(c.unit ? { unit: c.unit } : {}),
    ...(c.note ? { note: c.note } : {}),
  };
}

/* -------------------------------------------------- applications */

export type Application = {
  /** application.id */
  id: string;
  opportunityId: string;
  status: ApplicationStatus;
  submittedAt: string;
  message: string;
  /** portfolio_item.id[] attached as proof of fit */
  portfolioIds: string[];
  rateQuoted?: PriceParts;
  timeline: { label: string; at: string; done: boolean }[];
  /** message thread handed to FLOW 06 */
  threadId?: string;
};

export const myApplications: Application[] = [
  {
    id: "ap-1",
    opportunityId: "op-1",
    status: "shortlisted",
    submittedAt: "1 day ago",
    message:
      "I've sung three indie-pop singles in a similar register — sending the two closest to your reference. Free the whole of that week and I track at home too.",
    portfolioIds: ["pf-1", "pf-3"],
    rateQuoted: { amount: "₹32,000", unit: "song" },
    timeline: [
      { label: "Applied", at: "1 Sep, 10:12", done: true },
      { label: "Viewed by Sunset Records", at: "1 Sep, 18:40", done: true },
      { label: "Shortlisted", at: "2 Sep, 09:05", done: true },
      { label: "Conversation", at: "Waiting on the label", done: false },
      { label: "Agreement", at: "—", done: false },
    ],
    threadId: "th-sunset",
  },
  {
    id: "ap-2",
    opportunityId: "op-3",
    status: "viewed",
    submittedAt: "20 hours ago",
    message: "Funk is my home turf — two nights work, I have my own cymbals and a Ludwig snare.",
    portfolioIds: ["pf-5"],
    timeline: [
      { label: "Applied", at: "1 Sep, 22:31", done: true },
      { label: "Viewed by The Quarter", at: "2 Sep, 08:02", done: true },
      { label: "Shortlist decision", at: "Expected in 3 days", done: false },
    ],
  },
  {
    id: "ap-3",
    opportunityId: "op-5",
    status: "rejected",
    submittedAt: "5 days ago",
    message: "Sharing two Hindi ad films I wrote last year.",
    portfolioIds: ["pf-2"],
    timeline: [
      { label: "Applied", at: "28 Aug, 14:00", done: true },
      { label: "Viewed", at: "29 Aug, 11:20", done: true },
      { label: "Not selected", at: "31 Aug, 17:45", done: true },
    ],
  },
];

export function getApplication(id: string) {
  return myApplications.find((a) => a.id === id);
}

export function applicationTone(
  s: ApplicationStatus,
): "neutral" | "good" | "warn" | "bad" | "brand" {
  if (s === "accepted") return "good";
  if (s === "shortlisted") return "brand";
  if (s === "rejected" || s === "withdrawn") return "bad";
  if (s === "viewed") return "warn";
  return "neutral";
}

/* -------------------------------------------------- posted by me */

export type PostedOpportunity = Opportunity & {
  /**
   * Views and the applicant breakdown come from application tracking. Unset for stored
   * opportunities, which record neither; screens then show only the stored applicant count.
   */
  applicantSummary?: { new: number; shortlisted: number; rejected: number };
};

export const myOpportunities: PostedOpportunity[] = [
  {
    ...opportunities[1]!,
    id: "op-mine-1",
    title: "Keys player for a 4-track live session",
    poster: {
      id: "me",
      name: "You",
      username: "me",
      photo: u("photo-1511367461989-f85a21fda167"),
      kindLabel: "Artist · Mumbai",
      verified: true,
      rating: 4.9,
      hires: 8,
    },
    status: "reviewing",
    applicants: 12,
    views: 204,
    applicantSummary: { new: 4, shortlisted: 3, rejected: 5 },
  },
  {
    ...opportunities[3]!,
    id: "op-mine-2",
    title: "Mastering engineer — 6-track EP",
    poster: {
      id: "me",
      name: "You",
      username: "me",
      photo: u("photo-1511367461989-f85a21fda167"),
      kindLabel: "Artist · Mumbai",
      verified: true,
      rating: 4.9,
      hires: 8,
    },
    status: "draft",
    applicants: 0,
    views: 0,
    applicantSummary: { new: 0, shortlisted: 0, rejected: 0 },
  },
];

export type Applicant = {
  id: string;
  opportunityId: string;
  name: string;
  username: string;
  photo: string;
  headline: string;
  city: string;
  rating: number;
  verified: boolean;
  matchScore: number;
  matchReasons: string[];
  message: string;
  portfolio: { id: string; title: string; kind: string; cover: string }[];
  status: Exclude<ApplicationStatus, "draft">;
  appliedAt: string;
  /** service.id this applicant offers. When set, hiring opens that service's enquiry. */
  serviceId?: string;
};

export const applicants: Applicant[] = [
  {
    id: "apl-1",
    opportunityId: "op-mine-1",
    name: "Rhea D'Souza",
    username: "rheadsouza",
    photo: u("photo-1544005313-94ddf0286df2"),
    headline: "Keys · session player",
    city: "Mumbai",
    rating: 4.9,
    verified: true,
    matchScore: 94,
    matchReasons: ["Available on your dates", "Played 5 live sessions", "Same city"],
    message:
      "Live sessions are most of my work — here are two multi-cam ones so you can see the playing.",
    portfolio: [
      {
        id: "pf-a",
        title: "Live at Bandra Base",
        kind: "video",
        cover: u("photo-1470225620780-dba8ba36b745"),
      },
      {
        id: "pf-b",
        title: "Rhodes takes — reel",
        kind: "audio",
        cover: u("photo-1520523839897-bd0b52f945a0"),
      },
    ],
    status: "shortlisted",
    appliedAt: "2 days ago",
  },
  {
    id: "apl-2",
    opportunityId: "op-mine-1",
    name: "Arjun Pillai",
    username: "arjunpillai",
    photo: u("photo-1506794778202-cad84cf45f1d"),
    headline: "Pianist · arranger",
    city: "Kochi",
    rating: 4.6,
    verified: false,
    matchScore: 71,
    matchReasons: ["Strong arrangement credits"],
    message: "Happy to travel. I can also chart the session out ahead of the day.",
    portfolio: [
      {
        id: "pf-c",
        title: "Arrangement reel 2026",
        kind: "audio",
        cover: u("photo-1507838153414-b4b713384a76"),
      },
    ],
    status: "submitted",
    appliedAt: "3 days ago",
  },
  {
    id: "apl-3",
    opportunityId: "op-mine-1",
    name: "Tara Bose",
    username: "tarabose",
    photo: u("photo-1534528741775-53994a69daeb"),
    headline: "Synths · producer",
    city: "Mumbai",
    rating: 4.8,
    verified: true,
    matchScore: 66,
    matchReasons: ["Same city", "Produces in your genre"],
    message: "Would love in — I lean more electronic but can play it straight.",
    portfolio: [
      {
        id: "pf-d",
        title: "Modular set",
        kind: "video",
        cover: u("photo-1493225457124-a3eb161ffa5f"),
      },
    ],
    status: "viewed",
    appliedAt: "4 days ago",
  },
];

export const opportunityAnalytics = {
  views: 204,
  saves: 31,
  applicants: 12,
  shortlisted: 3,
  viewToApply: "5.9%",
  daily: [12, 26, 41, 33, 28, 39, 25],
  sources: [
    { label: "Discover", value: 46 },
    { label: "Recommendations", value: 31 },
    { label: "Search", value: 15 },
    { label: "Profile", value: 8 },
  ],
};

export const closeReasons = [
  "Filled through MusicLinkd",
  "Filled elsewhere",
  "Requirement changed",
  "Postponed",
  "Posted by mistake",
];

export const reportReasons = [
  "Not a real music opportunity",
  "Misleading pay or terms",
  "Asks for payment from applicants",
  "Offensive or discriminatory",
  "Spam or duplicate",
];

export const applyDraftKey = "ml.opportunity.apply";
export const savedOpportunityKey = "ml.opportunity.saved";
