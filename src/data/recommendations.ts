/**
 * FLOW 20 — RECOMMENDATIONS. Design-only.
 * Canonical names: recommendation, recommendation_reason, recommendation_feedback, recommendation_preference.
 * Every recommendation carries an explainable reason and a feedback control.
 */
import { talents, studios } from "./discover";

export type RecKind = "talent" | "studio" | "listing" | "opportunity" | "collaboration" | "content";

export type Recommendation = {
  /** recommendation.id — EXISTING */
  id: string;
  kind: RecKind;
  title: string;
  subtitle: string;
  image: string;
  meta: string;
  /** recommendation_reason.text — always shown, never a black box. */
  reason: string;
  /** Route the card opens — canonical entity route, never a duplicate screen. */
  route: string;
  verified?: boolean;
};

const u = (id: string, w = 500) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const recommendations: Recommendation[] = [
  {
    id: "rec-1",
    kind: "talent",
    title: talents[0]!.name,
    subtitle: talents[0]!.role,
    image: talents[0]!.photo,
    meta: talents[0]!.location,
    reason: "Works in your genres and is available the week of your next session",
    route: `/profile/${talents[0]!.id}`,
    verified: talents[0]!.verified,
  },
  {
    id: "rec-2",
    kind: "studio",
    title: studios[0]!.name,
    subtitle: "Recording studio",
    image: studios[0]!.photo,
    meta: studios[0]!.location,
    reason: "Similar to the studio you booked in August, 12% lower rate",
    route: "/booking",
  },
  {
    id: "rec-3",
    kind: "listing",
    title: "Fender Rhodes Mk1",
    subtitle: "Marketplace · ₹1,85,000",
    image: u("photo-1520523839897-bd0b52f945a0"),
    meta: "Mumbai · Seller verified",
    reason: "You saved two keys listings this month",
    route: "/marketplace",
  },
  {
    id: "rec-4",
    kind: "opportunity",
    title: "Session vocalist — indie folk EP",
    subtitle: "Paid · 2 days of tracking",
    image: u("photo-1516280440614-37939bbacd81"),
    meta: "Closes in 5 days",
    reason: "Matches your role, city and stated rate range",
    route: "/",
  },
  {
    id: "rec-5",
    kind: "collaboration",
    title: "Monsoon Sessions EP",
    subtitle: "Open collaboration · 3 seats",
    image: u("photo-1470229722913-7c0e2dbbafd3"),
    meta: "Brass and keys wanted",
    reason: "Two of your collaborators are already on this project",
    route: "/collab",
  },
  {
    id: "rec-6",
    kind: "content",
    title: "Pricing your first mixing service",
    subtitle: "Guide · 6 min read",
    image: u("photo-1487180144351-b8472da7d491"),
    meta: "MusicLinkd Guides",
    reason: "You added a service last week without a rate",
    route: "/help/pricing-your-first-service",
  },
];

export const recSections: { key: string; title: string; blurb: string; ids: string[] }[] = [
  {
    key: "next",
    title: "Because of your next session",
    blurb: "Tied to your confirmed booking on 19 Sep",
    ids: ["rec-1", "rec-2"],
  },
  {
    key: "saved",
    title: "From things you saved",
    blurb: "Based on saved listings and profiles",
    ids: ["rec-3"],
  },
  {
    key: "work",
    title: "Work you could take",
    blurb: "Opportunities and collaborations that fit your profile",
    ids: ["rec-4", "rec-5"],
  },
  {
    key: "learn",
    title: "Worth reading",
    blurb: "Short guides matched to what you are setting up",
    ids: ["rec-6"],
  },
];

export const feedbackOptions = [
  "Not relevant",
  "Already know them",
  "Wrong city",
  "Wrong budget",
  "Show less like this",
];

export const recPreferences = [
  { key: "genres", label: "Use my genres", on: true, hint: "Indie folk, alt pop" },
  { key: "city", label: "Prefer my city", on: true, hint: "Mumbai + 50 km" },
  { key: "budget", label: "Match my rate range", on: true, hint: "₹15,000 – ₹60,000" },
  { key: "saved", label: "Use saved items", on: true, hint: "Saved profiles and listings" },
  { key: "activity", label: "Use booking history", on: false, hint: "Past bookings and rentals" },
];

export const recEmptyCopy = {
  title: "Not enough to go on yet",
  body: "Add your genres, city and two portfolio items and recommendations will start filling in.",
};
