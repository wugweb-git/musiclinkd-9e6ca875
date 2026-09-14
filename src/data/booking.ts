/**
 * FLOW 08 — BOOKING — design-time seeded data.
 *
 * Entity names map to the canonical MusicLinkd model:
 *   businessProfile · service · availability · booking · payment · user
 * Fields not present in the canonical schema are tagged below:
 *   EXISTING  — already in the schema spec
 *   COMPUTED  — derived in the UI from existing fields
 *   PROPOSED  — needs a schema addition before production
 */

export type BookableKind =
  | "Recording Studio"
  | "Mixing Studio"
  | "Mastering Studio"
  | "Podcast Studio"
  | "Jam Room"
  | "Rehearsal Space"
  | "Venue"
  | "Music Service";

export type DurationUnit = "hour" | "halfDay" | "fullDay" | "session" | "custom";

export type BookingModel = "request" | "instant";

/** availability.dayState — EXISTING */
export type DayState = "available" | "limited" | "unavailable" | "closed";

/** booking.status — EXISTING (customer-facing subset) */
export type BookingStatus =
  | "draft"
  | "requested"
  | "reviewing"
  | "confirmed"
  | "upcoming"
  | "inProgress"
  | "completed"
  | "cancelled"
  | "rejected"
  | "expired"
  | "noShow";

/** payment.status — EXISTING */
export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "partiallyPaid"
  | "balanceDue"
  | "refundPending"
  | "refunded";

export type Slot = {
  /** availability.slots[].start — EXISTING, 24h local */
  start: string;
  end: string;
  state: "open" | "booked" | "blocked";
};

export type DayAvailability = {
  date: string; // ISO yyyy-mm-dd
  state: DayState;
  slots: Slot[];
  /** COMPUTED from pricing tier + day multiplier */
  fromPrice?: number;
};

export type PricingTier = {
  unit: DurationUnit;
  label: string;
  hours: number; // 0 for custom
  price: number;
};

export type AddOn = {
  id: string;
  name: string;
  description: string;
  price: number;
  perHour?: boolean;
  available: boolean;
  qty?: boolean;
  /** PROPOSED — links an add-on to a Marketplace rental listing (FLOW 07) */
  rentalListingId?: string;
};

export type Resource = {
  /** service.id — EXISTING */
  id: string;
  name: string;
  description: string;
  capacity: number;
  equipment: string[];
  tiers: PricingTier[];
  durations: DurationUnit[];
  model: BookingModel;
  /** COMPUTED label */
  availabilityNote: string;
  photo: string;
};

export type Policy = { title: string; body: string; critical?: boolean };

export type Bookable = {
  /** businessProfile.id — EXISTING */
  id: string;
  name: string;
  /** Empty for database studios, which have no kind. */
  kind: BookableKind | "";
  verified: boolean;
  rating: number;
  reviews: number;
  city: string;
  area: string;
  distanceKm: number;
  timezone: string;
  hero: string;
  gallery: string[];
  about: string;
  facilities: string[];
  resources: Resource[];
  addOns: AddOn[];
  policies: Policy[];
  depositPct: number;
  taxPct: number;
  /** COMPUTED */
  responseTime: string;
  /** Studio-wide house gear not tied to one room (database studios). */
  equipment?: string[];
  /** false when there is no availability calendar (database studios): no date, time or later steps. */
  hasCalendar?: boolean;
};

export type Booking = {
  /** booking.reference — EXISTING */
  ref: string;
  bookableId: string;
  resourceId: string;
  date: string;
  start: string;
  end: string;
  hours: number;
  status: BookingStatus;
  payment: PaymentStatus;
  amount: number;
  deposit: number;
  people: number;
  purpose: string;
  notes?: string;
  addOnIds: string[];
  /** user.displayName of the customer — EXISTING */
  customer: string;
  customerRole: string;
  customerAvatar: string;
  createdAt: string;
};

const img = (seed: string, w = 800, h = 600) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

const STUDIO_A = "photo-1598488035139-bdbb2231ce04";
const STUDIO_B = "photo-1519508234439-4f23643125c1";
const STUDIO_C = "photo-1511379938547-c1f69419868d";
const STUDIO_D = "photo-1520523839897-bd0b52f945a0";
const STUDIO_E = "photo-1514320291840-2e0a9bf2a9ae";
const STUDIO_F = "photo-1493225457124-a3eb161ffa5f";

const commonPolicies: Policy[] = [
  {
    title: "Cancellation",
    body: "Free cancellation up to 48 hours before the session. Within 48 hours the deposit is non-refundable.",
    critical: true,
  },
  {
    title: "Rescheduling",
    body: "One free reschedule up to 24 hours before your slot, subject to availability.",
  },
  {
    title: "Deposit & payment",
    body: "A deposit is charged to hold the room. The balance is due at the studio on the day.",
    critical: true,
  },
  {
    title: "Overtime",
    body: "Overtime is billed in 30-minute blocks at the hourly rate, only if the room is free.",
  },
  {
    title: "Arrival",
    body: "Arrive 10 minutes early for load-in. Sessions start and end at the booked time.",
  },
  {
    title: "Equipment",
    body: "House equipment is included. Any damage is charged at repair cost. Outboard gear must be declared.",
  },
];

function daySlots(
  open: number,
  close: number,
  booked: number[] = [],
  blocked: number[] = [],
): Slot[] {
  const out: Slot[] = [];
  for (let h = open; h < close; h += 1) {
    out.push({
      start: `${String(h).padStart(2, "0")}:00`,
      end: `${String(h + 1).padStart(2, "0")}:00`,
      state: booked.includes(h) ? "booked" : blocked.includes(h) ? "blocked" : "open",
    });
  }
  return out;
}

export const bookables: Bookable[] = [
  {
    id: "octave-sound-labs",
    name: "Octave Sound Labs",
    kind: "Recording Studio",
    verified: true,
    rating: 4.9,
    reviews: 218,
    city: "Mumbai",
    area: "Andheri West",
    distanceKm: 3.2,
    timezone: "IST (UTC+5:30)",
    hero: img(STUDIO_A, 1200, 800),
    gallery: [img(STUDIO_A), img(STUDIO_B), img(STUDIO_C)],
    about:
      "A tracking room built for live bands and vocalists, with an SSL-fed control room and an engineer on every session.",
    facilities: ["Live room", "Vocal booth", "Engineer included", "Parking", "Green room", "Wi-Fi"],
    responseTime: "Usually replies in 2 hours",
    depositPct: 25,
    taxPct: 18,
    resources: [
      {
        id: "live-room-a",
        name: "Live Room A",
        description: "420 sq ft tracking floor with variable acoustics — best for full-band takes.",
        capacity: 8,
        equipment: ["Neumann U87", "SSL Origin desk", "DW Collector's kit", "Fender Twin"],
        durations: ["hour", "halfDay", "fullDay", "custom"],
        model: "request",
        availabilityNote: "Most weekday evenings open",
        photo: img(STUDIO_A),
        tiers: [
          { unit: "hour", label: "Hourly", hours: 1, price: 2400 },
          { unit: "halfDay", label: "Half day · 5 hrs", hours: 5, price: 10500 },
          { unit: "fullDay", label: "Full day · 10 hrs", hours: 10, price: 19000 },
        ],
      },
      {
        id: "vocal-booth",
        name: "Vocal Booth",
        description: "Tight, dry booth for lead and stack vocals with a dedicated headphone mix.",
        capacity: 2,
        equipment: ["Neumann TLM 103", "Avalon VT-737", "Apollo x8"],
        durations: ["hour", "halfDay", "custom"],
        model: "instant",
        availabilityNote: "Instant booking",
        photo: img(STUDIO_B),
        tiers: [
          { unit: "hour", label: "Hourly", hours: 1, price: 1200 },
          { unit: "halfDay", label: "Half day · 5 hrs", hours: 5, price: 5200 },
        ],
      },
      {
        id: "mix-room",
        name: "Mix Room B",
        description: "Focal-monitored mix suite with an attended-mix option.",
        capacity: 3,
        equipment: ["Focal Trio11", "Apollo x16", "Analogue summing"],
        durations: ["session", "hour", "fullDay"],
        model: "request",
        availabilityNote: "Booked 4 days ahead",
        photo: img(STUDIO_C),
        tiers: [
          { unit: "hour", label: "Hourly", hours: 1, price: 1800 },
          { unit: "session", label: "Mix session · per song", hours: 6, price: 9500 },
          { unit: "fullDay", label: "Full day · 10 hrs", hours: 10, price: 15000 },
        ],
      },
    ],
    addOns: [
      {
        id: "engineer",
        name: "Additional engineer",
        description: "Second pair of hands for large sessions.",
        price: 800,
        perHour: true,
        available: true,
      },
      {
        id: "drums",
        name: "Drum kit (DW Collector's)",
        description: "Tuned and mic'd before your slot.",
        price: 1500,
        available: true,
      },
      {
        id: "amp",
        name: "Guitar amp — Fender Twin",
        description: "Includes cab mics and stands.",
        price: 700,
        available: true,
      },
      {
        id: "keys",
        name: "Nord Stage 3",
        description: "88-key stage piano with stand and pedal.",
        price: 900,
        available: false,
      },
      {
        id: "mic-pack",
        name: "Extra mic pack",
        description: "4 additional condensers and stands.",
        price: 600,
        available: true,
        qty: true,
      },
      {
        id: "rental-synth",
        name: "Moog Sub 37 (rental)",
        description: "Fulfilled through the MusicLinkd rental marketplace.",
        price: 1100,
        available: true,
        rentalListingId: "moog-sub-37",
      },
    ],
    policies: commonPolicies,
  },
  {
    id: "headroom-mastering",
    name: "Headroom Mastering",
    kind: "Mastering Studio",
    verified: true,
    rating: 4.8,
    reviews: 96,
    city: "Bengaluru",
    area: "Indiranagar",
    distanceKm: 6.4,
    timezone: "IST (UTC+5:30)",
    hero: img(STUDIO_C, 1200, 800),
    gallery: [img(STUDIO_C), img(STUDIO_E)],
    about:
      "Attended and unattended mastering in a purpose-built room, with stem mastering on request.",
    facilities: ["Attended sessions", "Stem mastering", "Analogue chain", "Reference library"],
    responseTime: "Usually replies same day",
    depositPct: 50,
    taxPct: 18,
    resources: [
      {
        id: "master-session",
        name: "Attended mastering",
        description: "Sit in the room while your record is mastered — up to 4 tracks per session.",
        capacity: 3,
        equipment: ["Maselec MTC-1", "Bricasti M7", "PMC twotwo.6"],
        durations: ["session", "hour"],
        model: "request",
        availabilityNote: "Two slots a week",
        photo: img(STUDIO_C),
        tiers: [
          { unit: "session", label: "Session · up to 4 tracks", hours: 4, price: 12000 },
          { unit: "hour", label: "Hourly", hours: 1, price: 3500 },
        ],
      },
    ],
    addOns: [
      {
        id: "extra-track",
        name: "Additional track",
        description: "Beyond the four included.",
        price: 2500,
        available: true,
        qty: true,
      },
      {
        id: "vinyl-cut",
        name: "Vinyl pre-master",
        description: "Separate cut optimised for lacquer.",
        price: 4000,
        available: true,
      },
    ],
    policies: commonPolicies,
  },
  {
    id: "basement-jam",
    name: "The Basement Jam Rooms",
    kind: "Jam Room",
    verified: false,
    rating: 4.5,
    reviews: 341,
    city: "Delhi",
    area: "Hauz Khas",
    distanceKm: 1.8,
    timezone: "IST (UTC+5:30)",
    hero: img(STUDIO_D, 1200, 800),
    gallery: [img(STUDIO_D), img(STUDIO_F)],
    about: "Three backlined rehearsal rooms, open late, priced by the hour with no minimum.",
    facilities: ["Backline included", "Open till 2 AM", "Lockers", "Cafe"],
    responseTime: "Instant confirmation",
    depositPct: 0,
    taxPct: 18,
    resources: [
      {
        id: "jam-1",
        name: "Room 1 — Full backline",
        description: "Drums, two amps, bass rig and a 4-channel PA.",
        capacity: 6,
        equipment: ["Pearl Export kit", "Marshall DSL", "Ampeg BA-210", "Yamaha PA"],
        durations: ["hour", "halfDay", "custom"],
        model: "instant",
        availabilityNote: "Instant booking",
        photo: img(STUDIO_D),
        tiers: [
          { unit: "hour", label: "Hourly", hours: 1, price: 600 },
          { unit: "halfDay", label: "Half day · 5 hrs", hours: 5, price: 2600 },
        ],
      },
      {
        id: "jam-2",
        name: "Room 2 — Acoustic / writing",
        description: "Small carpeted room for writing sessions and acoustic rehearsals.",
        capacity: 4,
        equipment: ["Upright piano", "2× SM58", "Mixer"],
        durations: ["hour", "custom"],
        model: "instant",
        availabilityNote: "Usually free",
        photo: img(STUDIO_F),
        tiers: [{ unit: "hour", label: "Hourly", hours: 1, price: 350 }],
      },
    ],
    addOns: [
      {
        id: "pa",
        name: "Extra PA speaker",
        description: "For larger rehearsals.",
        price: 250,
        available: true,
      },
      {
        id: "record",
        name: "Rough room recording",
        description: "Stereo capture emailed after the session.",
        price: 400,
        available: true,
      },
    ],
    policies: commonPolicies.slice(0, 4),
  },
  {
    id: "waveform-podcast",
    name: "Waveform Podcast Studio",
    kind: "Podcast Studio",
    verified: true,
    rating: 4.7,
    reviews: 74,
    city: "Mumbai",
    area: "Lower Parel",
    distanceKm: 8.1,
    timezone: "IST (UTC+5:30)",
    hero: img(STUDIO_E, 1200, 800),
    gallery: [img(STUDIO_E), img(STUDIO_B)],
    about: "Four-mic podcast room with multicam video capture and a producer on the desk.",
    facilities: ["4 mic positions", "Multicam video", "Producer", "Same-day audio"],
    responseTime: "Usually replies in 1 hour",
    depositPct: 30,
    taxPct: 18,
    resources: [
      {
        id: "pod-room",
        name: "Podcast Room",
        description: "Table for four with Shure SM7Bs, treated walls and a lit set.",
        capacity: 4,
        equipment: ["4× Shure SM7B", "Rodecaster Pro II", "3× Sony FX30"],
        durations: ["hour", "halfDay", "session"],
        model: "request",
        availabilityNote: "Weekdays only",
        photo: img(STUDIO_E),
        tiers: [
          { unit: "hour", label: "Hourly", hours: 1, price: 2000 },
          { unit: "halfDay", label: "Half day · 5 hrs", hours: 5, price: 8500 },
          { unit: "session", label: "Episode package", hours: 3, price: 6000 },
        ],
      },
    ],
    addOns: [
      {
        id: "edit",
        name: "Edited episode",
        description: "Cut, levelled and delivered in 48 hours.",
        price: 3500,
        available: true,
      },
      {
        id: "clips",
        name: "5 vertical clips",
        description: "Captioned shorts for social.",
        price: 2500,
        available: true,
      },
    ],
    policies: commonPolicies,
  },
];

export function getBookable(id: string) {
  return bookables.find((b) => b.id === id);
}

export function getResource(b: Bookable | undefined, id: string | undefined) {
  if (!b) return undefined;
  return b.resources.find((r) => r.id === id) ?? b.resources[0];
}

/* ------------------------------------------------------------------ */
/* Availability — deterministic pseudo-schedule (design-time)          */
/* ------------------------------------------------------------------ */

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function availabilityFor(
  resourceId: string,
  date: string,
  fromPrice: number,
): DayAvailability {
  const d = new Date(`${date}T00:00:00`);
  const dow = d.getDay();
  const h = hash(resourceId + date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (d < today) return { date, state: "unavailable", slots: [] };
  if (dow === 0 && h % 3 === 0) return { date, state: "closed", slots: [] };

  const bucket = h % 10;
  if (bucket === 0)
    return {
      date,
      state: "unavailable",
      slots: daySlots(10, 20, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]),
    };

  const booked = bucket < 4 ? [10, 11, 15, 16, 17, 19] : bucket < 7 ? [12, 18] : [16];
  const blocked = bucket % 2 === 0 ? [13] : [];
  const slots = daySlots(10, 20, booked, blocked);
  const open = slots.filter((s) => s.state === "open").length;
  return {
    date,
    state: open <= 3 ? "limited" : "available",
    slots,
    fromPrice: fromPrice + (dow === 5 || dow === 6 ? 300 : 0),
  };
}

export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function nextAvailableDate(resourceId: string, fromPrice: number, after = new Date()) {
  for (let i = 1; i < 40; i += 1) {
    const d = new Date(after);
    d.setDate(after.getDate() + i);
    const a = availabilityFor(resourceId, isoDate(d), fromPrice);
    if (a.state === "available" || a.state === "limited") return a;
  }
  return undefined;
}

export const durationOptions: { unit: DurationUnit; label: string; hours: number }[] = [
  { unit: "hour", label: "1 hour", hours: 1 },
  { unit: "hour", label: "2 hours", hours: 2 },
  { unit: "hour", label: "3 hours", hours: 3 },
  { unit: "halfDay", label: "Half day", hours: 5 },
  { unit: "fullDay", label: "Full day", hours: 10 },
  { unit: "custom", label: "Custom", hours: 0 },
];

/* ------------------------------------------------------------------ */
/* Price                                                               */
/* ------------------------------------------------------------------ */

export type PriceLines = {
  baseLabel: string;
  base: number;
  addOns: { name: string; price: number }[];
  subtotal: number;
  tax: number;
  taxPct: number;
  deposit: number;
  total: number;
  balance: number;
};

export function priceFor(b: Bookable, r: Resource, hours: number, addOnIds: string[]): PriceLines {
  const tier =
    r.tiers.find((t) => t.hours === hours) ?? r.tiers.find((t) => t.unit === "hour") ?? r.tiers[0]!;
  const base = tier.unit === "hour" ? tier.price * Math.max(1, hours) : tier.price;
  const baseLabel =
    tier.unit === "hour"
      ? `${r.name} · ${hours} hr${hours > 1 ? "s" : ""}`
      : `${r.name} · ${tier.label}`;
  const addOns = b.addOns
    .filter((a) => addOnIds.includes(a.id))
    .map((a) => ({ name: a.name, price: a.perHour ? a.price * Math.max(1, hours) : a.price }));
  const subtotal = base + addOns.reduce((s, a) => s + a.price, 0);
  const tax = Math.round((subtotal * b.taxPct) / 100);
  const total = subtotal + tax;
  const deposit = Math.round((total * b.depositPct) / 100);
  return {
    baseLabel,
    base,
    addOns,
    subtotal,
    tax,
    taxPct: b.taxPct,
    deposit,
    total,
    balance: total - deposit,
  };
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function formatTime(t: string) {
  const [h = "0", m = "00"] = t.split(":");
  const hh = Number(h);
  const suffix = hh >= 12 ? "PM" : "AM";
  const disp = hh % 12 === 0 ? 12 : hh % 12;
  return `${disp}:${m} ${suffix}`;
}

/* ------------------------------------------------------------------ */
/* Bookings — customer + provider seed                                 */
/* ------------------------------------------------------------------ */

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export const bookings: Booking[] = [
  {
    ref: "MLB-4821",
    bookableId: "octave-sound-labs",
    resourceId: "live-room-a",
    date: offsetDate(0),
    start: "16:00",
    end: "20:00",
    hours: 4,
    status: "upcoming",
    payment: "partiallyPaid",
    amount: 11328,
    deposit: 2832,
    people: 5,
    purpose: "Band tracking — single",
    notes: "Bringing our own snare and pedalboard.",
    addOnIds: ["engineer", "drums"],
    customer: "Vedanshu Srivastava",
    customerRole: "Vocalist · Producer",
    customerAvatar: img(STUDIO_B, 200, 200),
    createdAt: offsetDate(-6),
  },
  {
    ref: "MLB-4835",
    bookableId: "waveform-podcast",
    resourceId: "pod-room",
    date: offsetDate(4),
    start: "11:00",
    end: "14:00",
    hours: 3,
    status: "requested",
    payment: "pending",
    amount: 7080,
    deposit: 2124,
    people: 3,
    purpose: "Podcast episode 12",
    addOnIds: ["clips"],
    customer: "Vedanshu Srivastava",
    customerRole: "Vocalist · Producer",
    customerAvatar: img(STUDIO_B, 200, 200),
    createdAt: offsetDate(-1),
  },
  {
    ref: "MLB-4712",
    bookableId: "headroom-mastering",
    resourceId: "master-session",
    date: offsetDate(-12),
    start: "13:00",
    end: "17:00",
    hours: 4,
    status: "completed",
    payment: "paid",
    amount: 14160,
    deposit: 7080,
    people: 2,
    purpose: "EP mastering — 4 tracks",
    addOnIds: [],
    customer: "Vedanshu Srivastava",
    customerRole: "Vocalist · Producer",
    customerAvatar: img(STUDIO_B, 200, 200),
    createdAt: offsetDate(-25),
  },
  {
    ref: "MLB-4690",
    bookableId: "basement-jam",
    resourceId: "jam-1",
    date: offsetDate(-20),
    start: "19:00",
    end: "22:00",
    hours: 3,
    status: "cancelled",
    payment: "refunded",
    amount: 2124,
    deposit: 0,
    people: 4,
    purpose: "Set rehearsal",
    addOnIds: [],
    customer: "Vedanshu Srivastava",
    customerRole: "Vocalist · Producer",
    customerAvatar: img(STUDIO_B, 200, 200),
    createdAt: offsetDate(-30),
  },
];

/** Requests seen by the provider workspace (Octave Sound Labs). */
export const providerRequests: Booking[] = [
  {
    ref: "MLB-4901",
    bookableId: "octave-sound-labs",
    resourceId: "live-room-a",
    date: offsetDate(3),
    start: "10:00",
    end: "15:00",
    hours: 5,
    status: "requested",
    payment: "pending",
    amount: 12390,
    deposit: 3098,
    people: 6,
    purpose: "Live band tracking",
    notes: "Five-piece, need the full kit mic'd.",
    addOnIds: ["drums", "engineer"],
    customer: "Aditi Rao",
    customerRole: "Bandleader · The Ridge",
    customerAvatar: img(STUDIO_C, 200, 200),
    createdAt: offsetDate(-1),
  },
  {
    ref: "MLB-4903",
    bookableId: "octave-sound-labs",
    resourceId: "vocal-booth",
    date: offsetDate(1),
    start: "18:00",
    end: "20:00",
    hours: 2,
    status: "reviewing",
    payment: "pending",
    amount: 2832,
    deposit: 708,
    people: 2,
    purpose: "Vocal stacks",
    addOnIds: [],
    customer: "Rohan Mehta",
    customerRole: "Singer-songwriter",
    customerAvatar: img(STUDIO_D, 200, 200),
    createdAt: offsetDate(0),
  },
  {
    ref: "MLB-4905",
    bookableId: "octave-sound-labs",
    resourceId: "mix-room",
    date: offsetDate(6),
    start: "12:00",
    end: "18:00",
    hours: 6,
    status: "requested",
    payment: "pending",
    amount: 11210,
    deposit: 2803,
    people: 2,
    purpose: "Attended mix — 2 songs",
    addOnIds: [],
    customer: "Neha Kapoor",
    customerRole: "Producer",
    customerAvatar: img(STUDIO_E, 200, 200),
    createdAt: offsetDate(-2),
  },
];

export const providerToday: Booking[] = [
  {
    ref: "MLB-4821",
    bookableId: "octave-sound-labs",
    resourceId: "live-room-a",
    date: offsetDate(0),
    start: "16:00",
    end: "20:00",
    hours: 4,
    status: "upcoming",
    payment: "partiallyPaid",
    amount: 11328,
    deposit: 2832,
    people: 5,
    purpose: "Band tracking — single",
    addOnIds: ["engineer", "drums"],
    customer: "Vedanshu Srivastava",
    customerRole: "Vocalist · Producer",
    customerAvatar: img(STUDIO_B, 200, 200),
    createdAt: offsetDate(-6),
  },
  {
    ref: "MLB-4880",
    bookableId: "octave-sound-labs",
    resourceId: "vocal-booth",
    date: offsetDate(0),
    start: "11:00",
    end: "13:00",
    hours: 2,
    status: "completed",
    payment: "paid",
    amount: 2832,
    deposit: 708,
    people: 1,
    purpose: "Ad voiceover",
    addOnIds: [],
    customer: "Sana Iyer",
    customerRole: "Voice artist",
    customerAvatar: img(STUDIO_F, 200, 200),
    createdAt: offsetDate(-9),
  },
];

export function getBooking(ref: string) {
  return [...bookings, ...providerRequests, ...providerToday].find((b) => b.ref === ref);
}

export const statusMeta: Record<
  BookingStatus,
  { label: string; tone: "ok" | "warn" | "off" | "info" }
> = {
  draft: { label: "Draft", tone: "off" },
  requested: { label: "Requested", tone: "warn" },
  reviewing: { label: "Provider reviewing", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "ok" },
  upcoming: { label: "Upcoming", tone: "ok" },
  inProgress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "info" },
  cancelled: { label: "Cancelled", tone: "off" },
  rejected: { label: "Declined", tone: "off" },
  expired: { label: "Expired", tone: "off" },
  noShow: { label: "No-show", tone: "off" },
};

export const paymentMeta: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  processing: "Payment processing",
  paid: "Paid in full",
  failed: "Payment failed",
  partiallyPaid: "Deposit paid",
  balanceDue: "Balance due",
  refundPending: "Refund processing",
  refunded: "Refunded",
};

export const bookingTimeline: { status: BookingStatus; label: string }[] = [
  { status: "requested", label: "Requested" },
  { status: "reviewing", label: "Provider reviewing" },
  { status: "confirmed", label: "Confirmed" },
  { status: "upcoming", label: "Upcoming" },
  { status: "inProgress", label: "In progress" },
  { status: "completed", label: "Completed" },
];

export const declineReasons = [
  "Unavailable that day",
  "Schedule conflict",
  "Service unavailable",
  "Other",
];

export const providerStats = {
  todayCount: 2,
  pending: 3,
  upcoming: 7,
  revenueMonth: 184500,
  utilisation: 68,
  cancellations: 1,
};
