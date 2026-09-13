/**
 * FLOW 23 — QR / Digital Identity & Sharing
 * Design-only routing/identity layer. QR never carries private data: it encodes a
 * canonical MusicLinkd URL that resolves through this table to an existing entity
 * owned by another flow (profile, business, service, listing, portfolio item).
 */

import { talents, studios } from "./discover";
import { listings, sellerById } from "./market";
import { demoPortfolio } from "./portfolio";
import { getBookable, inr } from "./booking";

/** Canonical entity kinds a MusicLinkd QR may resolve to. */
export type QrEntityType =
  | "profile"
  | "business"
  | "portfolio"
  | "portfolioItem"
  | "service"
  | "listing"
  | "opportunity"
  | "band";

/** Resolution outcome — mirrors the flow's required states. */
export type QrStatus = "active" | "expired" | "private" | "deleted" | "deactivated" | "invalid";

/** The whole payload a QR carries. No credentials, no keys, no private fields. */
export type QrDestination = {
  /** short code that appears in the canonical URL */
  code: string;
  type: QrEntityType;
  /** EXISTING — id of the entity in its owning flow */
  entityId: string;
  /** EXISTING — the public route the scan opens */
  publicRoute: string;
  status: QrStatus;
};

export const SHORT_HOST = "musiclinkd.app";

export function canonicalUrl(code: string) {
  return `https://${SHORT_HOST}/q/${code}`;
}

/** The signed-in demo identity. Sourced from the profile flow, not duplicated. */
export const myIdentity = {
  entityId: talents[1]!.id,
  name: talents[1]!.name,
  role: talents[1]!.role,
  location: talents[1]!.location,
  photo: talents[1]!.photo,
  verified: talents[1]!.verified,
  username: "rahuliyer",
  tagline: "Producing records that sound like the room they were made in.",
  /** Privacy-controlled contact fields — hidden ones are simply absent from shares. */
  contact: {
    phone: { value: "+91 98200 41122", shared: true },
    email: { value: "rahul@octavesound.in", shared: true },
    website: { value: "octavesound.in", shared: false },
    company: { value: "Octave Sound Labs", shared: true },
  },
  code: "rahul-iyer",
};

/** The business identity the same user manages (owned by FLOW 12). */
export const myBusiness = {
  entityId: "octave-sound-labs",
  name: getBookable("octave-sound-labs")?.name ?? studios[0]!.name,
  category: "Recording & mixing studio",
  city: getBookable("octave-sound-labs")?.city ?? "Mumbai",
  logo: getBookable("octave-sound-labs")?.hero ?? studios[0]!.photo,
  verified: true,
  username: "octavesoundlabs",
  code: "octave-labs",
};

/** Seeded destinations, one per result screen plus every failure state. */
export const destinations: QrDestination[] = [
  {
    code: myIdentity.code,
    type: "profile",
    entityId: myIdentity.entityId,
    publicRoute: `/profile/${myIdentity.entityId}`,
    status: "active",
  },
  {
    code: "ananya",
    type: "profile",
    entityId: talents[0]!.id,
    publicRoute: `/profile/${talents[0]!.id}`,
    status: "active",
  },
  {
    code: myBusiness.code,
    type: "business",
    entityId: myBusiness.entityId,
    publicRoute: `/booking/${myBusiness.entityId}`,
    status: "active",
  },
  {
    code: "live-room-a",
    type: "service",
    entityId: "live-room-a",
    publicRoute: `/booking/${myBusiness.entityId}/service`,
    status: "active",
  },
  {
    code: "strat-62",
    type: "listing",
    entityId: listings[0]!.id,
    publicRoute: `/marketplace/l/${listings[0]!.id}`,
    status: "active",
  },
  {
    code: "neon-monsoon",
    type: "portfolioItem",
    entityId: demoPortfolio[0]!.id,
    publicRoute: `/portfolio/${demoPortfolio[0]!.id}`,
    status: "active",
  },
  {
    code: "old-poster",
    type: "profile",
    entityId: talents[2]!.id,
    publicRoute: `/profile/${talents[2]!.id}`,
    status: "expired",
  },
  {
    code: "private-band",
    type: "band",
    entityId: "the-kite-notes",
    publicRoute: "/bands/the-kite-notes",
    status: "private",
  },
  { code: "gone", type: "profile", entityId: "removed-user", publicRoute: "/", status: "deleted" },
  {
    code: "paused",
    type: "business",
    entityId: myBusiness.entityId,
    publicRoute: `/booking/${myBusiness.entityId}`,
    status: "deactivated",
  },
];

export function resolveCode(code: string): QrDestination {
  return (
    destinations.find((d) => d.code === code) ?? {
      code,
      type: "profile",
      entityId: "",
      publicRoute: "/",
      status: "invalid",
    }
  );
}

/** What a result screen shows before the user opens the canonical destination. */
export type DestinationPreview = {
  kind: QrEntityType;
  title: string;
  subtitle: string;
  meta: string;
  extra?: string | undefined;
  image: string;
  verified?: boolean;
  /** Route the primary CTA opens. */
  route: string;
};

export function previewFor(d: QrDestination): DestinationPreview | null {
  if (d.status !== "active") return null;
  if (d.type === "profile") {
    const t = talents.find((x) => x.id === d.entityId);
    if (!t) return null;
    return {
      kind: "profile",
      title: t.name,
      subtitle: t.role,
      meta: t.location,
      extra: t.genres.slice(0, 3).join(" · "),
      image: t.photo,
      verified: t.verified,
      route: d.publicRoute,
    };
  }
  if (d.type === "business") {
    const b = getBookable(d.entityId);
    return {
      kind: "business",
      title: b?.name ?? myBusiness.name,
      subtitle: myBusiness.category,
      meta: `${b?.area ?? ""}, ${b?.city ?? myBusiness.city}`.replace(/^, /, ""),
      extra: b ? `${b.rating} · ${b.reviews} reviews` : undefined,
      image: b?.hero ?? myBusiness.logo,
      verified: true,
      route: d.publicRoute,
    };
  }
  if (d.type === "service") {
    const b = getBookable(myBusiness.entityId);
    const r = b?.resources.find((x) => x.id === d.entityId);
    if (!r || !b) return null;
    const from = Math.min(...r.tiers.map((t) => t.price));
    return {
      kind: "service",
      title: r.name,
      subtitle: b.name,
      meta: `${inr(from)} onwards · ${r.tiers[0]?.label ?? "per hour"}`,
      extra: `${b.area}, ${b.city}`,
      image: r.photo,
      verified: true,
      route: d.publicRoute,
    };
  }
  if (d.type === "listing") {
    const l = listings.find((x) => x.id === d.entityId);
    if (!l) return null;
    const seller = sellerById(l.sellerId);
    return {
      kind: "listing",
      title: l.title,
      subtitle: `${l.price}${l.condition ? ` · ${l.condition}` : ""}`,
      meta: l.location,
      // Only the seller's public display name — never phone, email or address.
      extra: seller ? `Sold by ${seller.name}` : undefined,
      image: l.photos[0] ?? "",
      route: d.publicRoute,
    };
  }
  if (d.type === "portfolioItem") {
    const w = demoPortfolio.find((x) => x.id === d.entityId);
    if (!w) return null;
    return {
      kind: "portfolioItem",
      title: w.title,
      subtitle: `${myIdentity.name} · ${w.role ?? "Creator"}`,
      meta: w.description ?? "",
      extra: w.release_year ? `${w.release_year}` : undefined,
      image: w.cover_url ?? myIdentity.photo,
      route: d.publicRoute,
    };
  }
  return null;
}

/** Copy for every non-active resolution, so no screen leaks a reason it shouldn't. */
export const statusCopy: Record<
  Exclude<QrStatus, "active">,
  { title: string; body: string; cta: string }
> = {
  invalid: {
    title: "This isn't a valid MusicLinkd QR code",
    body: "The code didn't match anything on MusicLinkd. Check you're scanning a MusicLinkd code and try again.",
    cta: "Scan again",
  },
  expired: {
    title: "This MusicLinkd link is no longer available",
    body: "The code was replaced or has passed its validity. You can still find people and spaces on MusicLinkd.",
    cta: "Go to MusicLinkd",
  },
  private: {
    title: "This content isn't publicly available",
    body: "The owner keeps this profile private. Ask them to share it with you directly.",
    cta: "Go to MusicLinkd",
  },
  deleted: {
    title: "This profile or content is no longer available",
    body: "It may have been removed by its owner.",
    cta: "Discover on MusicLinkd",
  },
  deactivated: {
    title: "This QR is no longer active",
    body: "The owner turned off sharing for this code.",
    cta: "Go to MusicLinkd",
  },
};

/** Controlled presentation styles — nothing that harms scannability. */
export type QrStyle = "light" | "dark" | "branded" | "minimal";

export const qrStyles: {
  value: QrStyle;
  label: string;
  blurb: string;
  dark: string;
  light: string;
}[] = [
  {
    value: "light",
    label: "Light",
    blurb: "Black on white — the most reliable scan.",
    dark: "#111827",
    light: "#FFFFFF",
  },
  {
    value: "dark",
    label: "Dark",
    blurb: "White on ink for dark posters and stages.",
    dark: "#FAFAFA",
    light: "#111827",
  },
  {
    value: "branded",
    label: "MusicLinkd",
    blurb: "Brand pink on white, contrast checked.",
    dark: "#B31E58",
    light: "#FFFFFF",
  },
  {
    value: "minimal",
    label: "Minimal",
    blurb: "Soft charcoal, no frame, no wordmark.",
    dark: "#1F2937",
    light: "#FAFAFA",
  },
];

export function styleFor(value: QrStyle) {
  return qrStyles.find((s) => s.value === value) ?? qrStyles[0]!;
}

/** Print layouts are previews only — no print-production pipeline. */
export const printFormats = [
  {
    id: "business-card",
    label: "Business card",
    size: "89 × 51 mm",
    blurb: "Name, role and QR on the back.",
  },
  { id: "poster", label: "Poster", size: "A3", blurb: "Big QR for a venue wall or noticeboard." },
  {
    id: "studio-sign",
    label: "Studio sign",
    size: "150 × 150 mm",
    blurb: "Reception or door sign for your space.",
  },
  {
    id: "event-badge",
    label: "Event badge",
    size: "100 × 140 mm",
    blurb: "Conference or showcase badge insert.",
  },
  {
    id: "portfolio-card",
    label: "Portfolio card",
    size: "A6",
    blurb: "Hand out with a release or demo.",
  },
] as const;

/** Analytics are read-only demo figures surfaced from the existing profile analytics. */
export const qrAnalytics = {
  scans: 284,
  unique: 196,
  profileVisits: 158,
  follows: 41,
  messages: 23,
  bookings: 6,
  bySource: [
    { label: "Studio sign", value: 96 },
    { label: "Business card", value: 71 },
    { label: "Event badge", value: 64 },
    { label: "Shared link", value: 53 },
  ],
};

export type ScanHistoryEntry = { code: string; label: string; kind: QrEntityType; when: string };

export const scanHistory: ScanHistoryEntry[] = [
  { code: "ananya", label: talents[0]!.name, kind: "profile", when: "Today · 4:12 PM" },
  { code: "strat-62", label: listings[0]!.title, kind: "listing", when: "Yesterday" },
  { code: myBusiness.code, label: myBusiness.name, kind: "business", when: "2 days ago" },
];

/** Screen data contract — mirrors the flow spec, used for documentation in code. */
export const qrContract = {
  flow: "FLOW-23",
  module: "QR & Digital Identity",
  dataSource: ["profile", "businessProfile", "share"],
  entities: ["user", "profile", "business", "portfolio", "service", "listing"],
  states: [
    "loading",
    "ready",
    "scanning",
    "resolved",
    "invalid",
    "private",
    "deleted",
    "offline",
    "error",
  ],
  actions: ["scan", "share", "download", "copy", "saveContact", "open"],
} as const;
