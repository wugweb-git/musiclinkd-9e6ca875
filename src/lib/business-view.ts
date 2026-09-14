// What the business profile screen renders, from the static demo business or a stored one.
// A stored business fills only what the database holds; everything else is empty and the screen
// skips it. There is no founding year, follower or booking count, contact detail, space photo,
// space type or credit in the database.

import { businessRoleLabel, businessTypeLabel, type BusinessProfile } from "@/data/business";
import { formatPaise, taxonomyLabel } from "@/lib/catalog.functions";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";
import type { BusinessRecord } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";

export type BusinessView = {
  id: string;
  name: string;
  typeLabel: string;
  verified: boolean;
  cover: string;
  logo: string;
  subtitle: string;
  tagline: string;
  stats: [label: string, value: string][] | null;
  about: string;
  services: { id: string; label: string; price: string }[];
  hours: { day: string; hours: string }[];
  address: string;
  contact: BusinessProfile["contact"] | null;
  spaces: {
    id: string;
    name: string;
    rate: string;
    detail: string;
    gear: string[];
    photo: string;
  }[];
  members: { id: string; name: string; photo: string; detail: string; invited: boolean }[];
  credits: BusinessProfile["credits"];
};

export function businessViewFromStatic(b: BusinessProfile): BusinessView {
  return {
    id: b.id,
    name: b.name,
    typeLabel: businessTypeLabel(b.type),
    verified: b.verified,
    cover: b.cover,
    logo: b.logo,
    subtitle: `${businessTypeLabel(b.type)} · ${b.city} · since ${b.founded}`,
    tagline: b.tagline,
    stats: [
      ["Followers", b.stats.followers],
      ["Bookings", String(b.stats.bookings)],
      ["Rating", String(b.stats.rating)],
      ["Reviews", String(b.stats.reviews)],
    ],
    about: b.about,
    services: b.services,
    hours: b.hours,
    address: b.address,
    contact: b.contact,
    spaces: b.spaces.map((sp) => ({
      id: sp.id,
      name: sp.name,
      rate: sp.rate,
      detail: `${sp.kind} · ${sp.capacity}`,
      gear: sp.gear,
      photo: sp.photo,
    })),
    members: b.members
      .filter((m) => m.status !== "removed")
      .map((m) => ({
        id: m.id,
        name: m.name,
        photo: m.photo,
        detail: `${businessRoleLabel[m.role]} · since ${m.since}`,
        invited: m.status === "invited",
      })),
    credits: b.credits,
  };
}

export function businessViewFromRecord(r: BusinessRecord, labels: TaxonomyLabels): BusinessView {
  const { profile, business, studio } = r;
  const role = profile.roles?.[0];
  const typeLabel = role ? taxonomyLabel(labels, "person_types", role) : "";
  return {
    id: profile.username ?? profile.id,
    name: profile.display_name ?? profile.username ?? "",
    typeLabel,
    verified: profile.is_verified,
    cover: business.hero_banner_url ?? profile.cover_url ?? "",
    logo: business.logo_url ?? profile.avatar_url ?? "",
    subtitle: joinParts(typeLabel, profile.city),
    tagline: profile.headline ?? "",
    // Only a studio stores a rating and review count; followers and bookings are not stored.
    stats: studio
      ? [
          ["Followers", "—"],
          ["Bookings", "—"],
          ["Rating", studio.rating == null ? "—" : String(studio.rating)],
          ["Reviews", String(studio.review_count)],
        ]
      : null,
    about: profile.bio ?? "",
    services: r.services.map((s) => ({
      id: s.id,
      label: s.name,
      price: formatPaise(s.price_paise, s.price_unit, s.price_note),
    })),
    hours: business.operating_hours ? [{ day: "", hours: business.operating_hours }] : [],
    address: business.business_address ?? "",
    contact: null,
    spaces: (studio?.rooms ?? []).map((room) => ({
      id: room.id,
      name: room.name,
      rate: formatPaise(room.hourly_rate_paise, "hr"),
      detail: "",
      gear: [],
      photo: "",
    })),
    members: r.team.map((m) => ({
      id: m.id,
      name: m.name,
      photo: "",
      detail: joinParts(m.role, m.experience),
      invited: false,
    })),
    credits: [],
  };
}
