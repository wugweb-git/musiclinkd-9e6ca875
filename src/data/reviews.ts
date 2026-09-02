/**
 * FLOW 17 — REVIEWS. Design-only.
 * Canonical names: review, review_criteria, review_response, review_request, review_flag.
 * Reviews are only ever created from a completed booking, order or rental.
 */
export type ReviewSourceKind = "booking" | "service" | "marketplace" | "rental";

export type ReviewCriterion = { key: string; label: string; value: number };

export type Review = {
  /** review.id — EXISTING */
  id: string;
  /** Polymorphic source: booking.id | order.id | rental.id — EXISTING */
  sourceKind: ReviewSourceKind;
  sourceLabel: string;
  authorName: string;
  authorPhoto: string;
  subjectName: string;
  rating: number;
  criteria: ReviewCriterion[];
  body: string;
  createdAt: string;
  verifiedTransaction: true;
  response?: { body: string; at: string };
  helpful: number;
};

const u = (id: string, w = 300) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const receivedReviews: Review[] = [
  {
    id: "rv-1",
    sourceKind: "booking",
    sourceLabel: "Studio session · 14 Aug",
    authorName: "Ananya Sharma",
    authorPhoto: u("photo-1534528741775-53994a69daeb"),
    subjectName: "Rahul Iyer",
    rating: 5,
    criteria: [
      { key: "communication", label: "Communication", value: 5 },
      { key: "professionalism", label: "Professionalism", value: 5 },
      { key: "value", label: "Value", value: 4 },
    ],
    body: "Turned a rough voice memo into a finished master in two sessions. Sent stems the same night without being asked.",
    createdAt: "3 weeks ago",
    verifiedTransaction: true,
    response: { body: "Thank you Ananya — the arrangement did most of the work.", at: "3 weeks ago" },
    helpful: 12,
  },
  {
    id: "rv-2",
    sourceKind: "service",
    sourceLabel: "Mixing service · 2 Aug",
    authorName: "DJ Noor",
    authorPhoto: u("photo-1571019613454-1cb2f99b2d8b"),
    subjectName: "Rahul Iyer",
    rating: 4,
    criteria: [
      { key: "communication", label: "Communication", value: 4 },
      { key: "professionalism", label: "Professionalism", value: 5 },
      { key: "value", label: "Value", value: 4 },
    ],
    body: "Good mix, one extra revision round needed on the low end. Clear about scope from the start.",
    createdAt: "1 month ago",
    verifiedTransaction: true,
    helpful: 4,
  },
];

export const givenReviews: Review[] = [
  {
    id: "rv-3",
    sourceKind: "rental",
    sourceLabel: "Rental · Neumann TLM 103 · 5 days",
    authorName: "You",
    authorPhoto: u("photo-1507003211169-0a1dd7228f2d"),
    subjectName: "Soundhouse Rentals",
    rating: 5,
    criteria: [
      { key: "condition", label: "Condition", value: 5 },
      { key: "handover", label: "Handover", value: 5 },
      { key: "value", label: "Value", value: 5 },
    ],
    body: "Mic arrived cleaned and calibrated with a spare cable. Pickup took four minutes.",
    createdAt: "2 weeks ago",
    verifiedTransaction: true,
    helpful: 2,
  },
];

/** review_request rows: completed transactions still awaiting a review. */
export const pendingReviews = [
  {
    id: "prv-1",
    sourceKind: "booking" as ReviewSourceKind,
    title: "Octave Sound Labs — Studio A",
    subtitle: "Session completed 6 Sep · review closes in 9 days",
    photo: u("photo-1598488035139-bdbb2231ce04", 400),
    criteria: ["Communication", "Space & equipment", "Value"],
  },
  {
    id: "prv-2",
    sourceKind: "marketplace" as ReviewSourceKind,
    title: "Fender Rhodes Mk1 — Kabir S.",
    subtitle: "Delivered 1 Sep · review closes in 4 days",
    photo: u("photo-1520523839897-bd0b52f945a0", 400),
    criteria: ["Item as described", "Communication", "Packaging"],
  },
];

export const ratingSummary = {
  average: 4.9,
  total: 38,
  distribution: [
    { stars: 5, count: 33 },
    { stars: 4, count: 4 },
    { stars: 3, count: 1 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ],
  criteria: [
    { label: "Communication", value: 4.9 },
    { label: "Professionalism", value: 5.0 },
    { label: "Value", value: 4.7 },
  ],
};

export const reviewPolicy = [
  "Only completed bookings, orders and rentals can be reviewed.",
  "Both sides submit blind — reviews publish after both are in or after 14 days.",
  "Ratings cannot be edited after publishing; you can add one response.",
  "Contact details, abuse and off-platform payment requests are removed.",
];

export const flagReasons = ["Not about this transaction", "Abusive or hateful", "Contains contact details", "Spam or fake", "Other"];
