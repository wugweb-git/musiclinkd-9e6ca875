/**
 * FLOW 11 — SERVICES & AVAILABILITY.
 * Services are stored (src/lib/services.functions.ts). What stays here: the category emoji (not
 * stored), the pricing model units, the service status tones and the availability design data.
 * `myServices` is design data no screen reads; supabase/generators/export_services_verification.ts
 * exports it.
 */

export type ServiceStatus = "active" | "paused" | "draft";
export type PricingModel = "hourly" | "per_song" | "per_day" | "package" | "custom";

/** Prices are whole rupees with a bare unit ("song"); `note` is price text that is not a unit ("each"). */
export type ServiceAddon = {
  id: string;
  label: string;
  price: number;
  unit?: string | undefined;
  note?: string | undefined;
};
export type ServicePackage = {
  id: string;
  name: string;
  price: number;
  unit?: string | undefined;
  note?: string | undefined;
  includes: string[];
  turnaround: string;
  revisions: string;
  popular?: boolean;
};

export type Service = {
  id: string;
  title: string;
  category: string;
  emoji: string;
  status: ServiceStatus;
  pricingModel: PricingModel;
  basePrice: number;
  unit: string;
  minHours?: number;
  description: string;
  deliverables: string[];
  requirements: string[];
  workMode: "Remote" | "In studio" | "Remote or in studio";
  turnaround: string;
  packages: ServicePackage[];
  addons: ServiceAddon[];
  stats: { views: number; enquiries: number; bookings: number; rating: number; reviews: number };
};

export const pricingModelLabel: Record<PricingModel, string> = {
  hourly: "Per hour",
  per_song: "Per song",
  per_day: "Per day",
  package: "Packages only",
  custom: "Custom quote",
};

/** The unit a pricing model charges by; packages and custom quotes have none. */
export const pricingModelUnit: Record<PricingModel, string | undefined> = {
  hourly: "hour",
  per_song: "song",
  per_day: "day",
  package: undefined,
  custom: undefined,
};

export const serviceCategories = [
  { key: "vocals", label: "Vocals", emoji: "🎤" },
  { key: "mixing", label: "Mixing", emoji: "🎚️" },
  { key: "mastering", label: "Mastering", emoji: "💿" },
  { key: "production", label: "Production", emoji: "🎹" },
  { key: "instrument", label: "Instrument", emoji: "🎸" },
  { key: "songwriting", label: "Songwriting", emoji: "✍️" },
  { key: "live", label: "Live", emoji: "🎫" },
  { key: "studio", label: "Studio", emoji: "🏠" },
];

export const myServices: Service[] = [
  {
    id: "svc-1",
    title: "Session vocals — lead & harmonies",
    category: "Vocals",
    emoji: "🎤",
    status: "active",
    pricingModel: "per_song",
    basePrice: 8000,
    unit: "song",
    description:
      "Studio-quality lead vocals with stacked harmonies, comped and tuned, delivered as stems.",
    deliverables: [
      "Comped lead take",
      "Up to 4 harmony stacks",
      "Dry + processed stems",
      "1 revision pass",
    ],
    requirements: ["Instrumental with a guide melody", "Reference track", "Target key and tempo"],
    workMode: "Remote or in studio",
    turnaround: "3–4 days",
    packages: [
      {
        id: "pkg-1",
        name: "Single song",
        price: 8000,
        unit: "song",
        includes: ["Lead vocal", "2 harmony stacks", "1 revision"],
        turnaround: "3–4 days",
        revisions: "1 revision",
      },
      {
        id: "pkg-2",
        name: "EP bundle",
        price: 30000,
        note: "for 4 songs",
        includes: ["Lead vocals ×4", "Full harmony stacks", "2 revisions each", "Priority queue"],
        turnaround: "2 weeks",
        revisions: "2 revisions per song",
        popular: true,
      },
    ],
    addons: [
      { id: "add-1", label: "Extra revision pass", price: 1500, note: "each" },
      { id: "add-2", label: "Hindi + Tamil versions", price: 4000, unit: "song" },
      { id: "add-3", label: "48h rush delivery", price: 3000, unit: "song" },
    ],
    stats: { views: 1840, enquiries: 46, bookings: 22, rating: 4.9, reviews: 18 },
  },
  {
    id: "svc-2",
    title: "Mixing — full song",
    category: "Mixing",
    emoji: "🎚️",
    status: "active",
    pricingModel: "per_song",
    basePrice: 12000,
    unit: "song",
    description:
      "Analogue-flavoured mixes for indie, pop and film songs. Stems in, radio-ready mix out.",
    deliverables: ["Stereo mix (WAV 24/48)", "Instrumental & TV mixes", "2 revision rounds"],
    requirements: ["Labelled stems", "Rough mix reference", "Tempo map"],
    workMode: "Remote",
    turnaround: "5–7 days",
    packages: [],
    addons: [
      { id: "add-4", label: "Stem mix delivery", price: 2500, unit: "song" },
      { id: "add-5", label: "Attended online session", price: 4000, unit: "hour" },
    ],
    stats: { views: 1210, enquiries: 28, bookings: 15, rating: 4.8, reviews: 12 },
  },
  {
    id: "svc-3",
    title: "Live set — 45 minutes",
    category: "Live",
    emoji: "🎫",
    status: "paused",
    pricingModel: "per_day",
    basePrice: 45000,
    unit: "show",
    description:
      "Acoustic trio set for venues, weddings and private events across Mumbai and Pune.",
    deliverables: ["45-minute set", "Own in-ear monitors", "Soundcheck 2h before"],
    requirements: ["PA system", "Two vocal mics", "Green room"],
    workMode: "In studio",
    turnaround: "Book 2 weeks ahead",
    packages: [],
    addons: [{ id: "add-6", label: "Extra 30 minutes", price: 12000, unit: "set" }],
    stats: { views: 640, enquiries: 11, bookings: 4, rating: 5, reviews: 4 },
  },
];

export const serviceStatusTone: Record<ServiceStatus, "good" | "warn" | "neutral"> = {
  active: "good",
  paused: "warn",
  draft: "neutral",
};

/* ── Availability ─────────────────────────────────────────── */

export type AvailabilityRule = { day: string; enabled: boolean; from: string; to: string };

export const weeklyAvailability: AvailabilityRule[] = [
  { day: "Monday", enabled: true, from: "11:00", to: "19:00" },
  { day: "Tuesday", enabled: true, from: "11:00", to: "19:00" },
  { day: "Wednesday", enabled: true, from: "11:00", to: "19:00" },
  { day: "Thursday", enabled: true, from: "11:00", to: "19:00" },
  { day: "Friday", enabled: true, from: "11:00", to: "21:00" },
  { day: "Saturday", enabled: true, from: "13:00", to: "21:00" },
  { day: "Sunday", enabled: false, from: "—", to: "—" },
];

export const timeOff = [
  { id: "off-1", label: "Chennai session block", range: "12–16 Sep" },
  { id: "off-2", label: "Family holiday", range: "2–9 Oct" },
];

export const availabilityStates = [
  "Available now",
  "Booking ahead",
  "Selective",
  "Not available",
] as const;
export type AvailabilityState = (typeof availabilityStates)[number];

export const bookingWindows = ["Same day", "24 hours notice", "3 days notice", "1 week notice"];
export const noticeDefault = "24 hours notice";

export const serviceDraftKey = "ml.service.draft";
