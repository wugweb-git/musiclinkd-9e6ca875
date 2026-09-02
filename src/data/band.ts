/**
 * FLOW 15 — BAND. Design-only mock data using canonical schema names
 * (band, band_member, band_role, band_invitation, band_event, portfolio_item).
 */
import { talents } from "./discover";

export type BandRole = "owner" | "admin" | "member";

export type BandMember = {
  /** user.id — EXISTING */
  userId: string;
  name: string;
  photo: string;
  /** instrument / craft within the band */
  instrument: string;
  role: BandRole;
  verified: boolean;
  since: string;
};

export type BandInvitation = {
  id: string;
  name: string;
  photo: string;
  instrument: string;
  status: "pending" | "accepted" | "declined" | "expired";
  sentAt: string;
};

export type BandEvent = {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  status: "confirmed" | "hold" | "past";
  ticketNote?: string;
};

export type BandRelease = {
  id: string;
  title: string;
  kind: "Single" | "EP" | "Album" | "Live";
  year: number;
  cover: string;
};

export type Band = {
  /** band.id — EXISTING */
  id: string;
  name: string;
  tagline: string;
  genres: string[];
  city: string;
  formed: string;
  verified: boolean;
  avatar: string;
  cover: string;
  bio: string;
  lookingFor: string[];
  availability: "Available" | "Selective" | "Booked";
  rate: string;
  members: BandMember[];
  invitations: BandInvitation[];
  events: BandEvent[];
  releases: BandRelease[];
  /** portfolio_item.id references — EXISTING, owned by FLOW 08 */
  portfolioItemIds: string[];
  followers: number;
  qrCode: string;
};

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const bands: Band[] = [
  {
    id: "the-kite-notes",
    name: "The Kite Notes",
    tagline: "Indie-folk quartet from Bandra with a brass habit.",
    genres: ["Indie Folk", "Alt Pop"],
    city: "Mumbai",
    formed: "2019",
    verified: true,
    avatar: img("photo-1511671782779-c97d3d27a1d4", 400),
    cover: img("photo-1470229722913-7c0e2dbbafd3"),
    bio: "Four players, one room, everything tracked live. We tour the west-coast circuit and record between runs at Octave Sound Labs.",
    lookingFor: ["Touring drummer", "Live sound engineer"],
    availability: "Selective",
    rate: "₹85,000 per show",
    members: [
      { userId: talents[1]!.id, name: talents[1]!.name, photo: talents[1]!.photo, instrument: "Producer, guitar", role: "owner", verified: true, since: "2019" },
      { userId: talents[0]!.id, name: talents[0]!.name, photo: talents[0]!.photo, instrument: "Lead vocals", role: "admin", verified: talents[0]!.verified, since: "2019" },
      { userId: talents[2]!.id, name: talents[2]!.name, photo: talents[2]!.photo, instrument: "Bass", role: "member", verified: talents[2]!.verified, since: "2021" },
      { userId: talents[3]!.id, name: talents[3]!.name, photo: talents[3]!.photo, instrument: "Drums", role: "member", verified: talents[3]!.verified, since: "2022" },
    ],
    invitations: [
      { id: "inv-1", name: "Farhan Qureshi", photo: img("photo-1508341591423-4347099e1f19", 300), instrument: "Trumpet", status: "pending", sentAt: "2 days ago" },
      { id: "inv-2", name: "Meher Kaur", photo: img("photo-1494790108377-be9c29b29330", 300), instrument: "Keys", status: "declined", sentAt: "last week" },
    ],
    events: [
      { id: "ev-1", title: "Monsoon Sessions", venue: "antiSOCIAL", city: "Mumbai", date: "Sat 19 Sep · 9:00 PM", status: "confirmed", ticketNote: "Tickets live" },
      { id: "ev-2", title: "Bengaluru run", venue: "Fandom", city: "Bengaluru", date: "Fri 2 Oct · 8:30 PM", status: "hold" },
      { id: "ev-3", title: "Kala Ghoda Festival", venue: "Amphitheatre", city: "Mumbai", date: "Feb 2026", status: "past" },
    ],
    releases: [
      { id: "rel-1", title: "Paper Kites", kind: "EP", year: 2025, cover: img("photo-1493225457124-a3eb161ffa5f", 500) },
      { id: "rel-2", title: "Bandra East, Live", kind: "Live", year: 2024, cover: img("photo-1459749411175-04bf5292ceea", 500) },
    ],
    portfolioItemIds: ["demo-2"],
    followers: 4820,
    qrCode: "kite-notes",
  },
  {
    id: "static-bloom",
    name: "Static Bloom",
    tagline: "Electronic trio building live-modular sets.",
    genres: ["Electronic", "Ambient"],
    city: "Bengaluru",
    formed: "2022",
    verified: false,
    avatar: img("photo-1516280440614-37939bbacd81", 400),
    cover: img("photo-1516450360452-9312f5e86fc7"),
    bio: "Modular rigs, no laptops on stage. Currently writing a first full-length.",
    lookingFor: ["Visual artist", "Booking agent"],
    availability: "Available",
    rate: "₹40,000 per show",
    members: [
      { userId: talents[4]!.id, name: talents[4]!.name, photo: talents[4]!.photo, instrument: "Synths", role: "owner", verified: talents[4]!.verified, since: "2022" },
      { userId: talents[5]!.id, name: talents[5]!.name, photo: talents[5]!.photo, instrument: "Live drums", role: "member", verified: talents[5]!.verified, since: "2023" },
    ],
    invitations: [],
    events: [{ id: "ev-4", title: "Basement Series", venue: "Bflat", city: "Bengaluru", date: "Thu 24 Sep · 8:00 PM", status: "confirmed" }],
    releases: [{ id: "rel-3", title: "Signal Garden", kind: "Single", year: 2025, cover: img("photo-1487180144351-b8472da7d491", 500) }],
    portfolioItemIds: [],
    followers: 1120,
    qrCode: "static-bloom",
  },
];

export const getBand = (id: string) => bands.find((b) => b.id === id);
export const myBandId = "the-kite-notes";

export const bandRoleCopy: Record<BandRole, { label: string; blurb: string }> = {
  owner: { label: "Owner", blurb: "Full control, including deleting the band and transferring ownership." },
  admin: { label: "Admin", blurb: "Can edit the profile, invite members and manage events." },
  member: { label: "Member", blurb: "Appears on the profile and can post work." },
};

export const bandCreationSteps = ["Identity", "Genre & city", "Members", "Preview"] as const;
export type BandCreationStep = (typeof bandCreationSteps)[number];
