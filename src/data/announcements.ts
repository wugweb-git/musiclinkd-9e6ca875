/**
 * FLOW 22 — announcements and FAQ, design-only.
 * Dates are epoch ms; formatted at render.
 */

export type Announcement = {
  /** announcement.id — EXISTING */
  id: string;
  title: string;
  body: string;
  kind: "release" | "policy" | "maintenance";
  publishedAt: number;
  unread: boolean;
};

const day = 86_400_000;
const now = Date.UTC(2026, 8, 13, 4, 0, 0);

export const announcements: Announcement[] = [
  {
    id: "an-1",
    title: "Verification badges now show on search results",
    body: "Identity and professional badges appear on profile cards across Discover and search, so hirers can shortlist with more confidence.",
    kind: "release",
    publishedAt: now - 2 * day,
    unread: true,
  },
  {
    id: "an-2",
    title: "Clearer booking cancellation windows",
    body: "Cancellation terms are shown before you pay, and again on the booking. Providers set their own window between 24 and 72 hours.",
    kind: "policy",
    publishedAt: now - 11 * day,
    unread: true,
  },
  {
    id: "an-3",
    title: "Rental listings can hold dates",
    body: "Providers can hold gear for 24 hours while a renter confirms, so a request no longer competes with walk-ins.",
    kind: "release",
    publishedAt: now - 23 * day,
    unread: false,
  },
  {
    id: "an-4",
    title: "Scheduled maintenance on 21 Sep",
    body: "Search and Discover may be slower between 02:00 and 03:00 IST while we move the index. Bookings and messages are unaffected.",
    kind: "maintenance",
    publishedAt: now - 30 * day,
    unread: false,
  },
];

export const announcementTone: Record<Announcement["kind"], "brand" | "warn" | "neutral"> = {
  release: "brand",
  policy: "warn",
  maintenance: "neutral",
};

export type Faq = { id: string; question: string; answer: string; topic: string };

export const faqs: Faq[] = [
  {
    id: "faq-1",
    topic: "Getting started",
    question: "Do I need a verified badge to get work?",
    answer:
      "No. Verification helps you win enquiries faster because hirers can trust who you are, but every profile is searchable and bookable without it.",
  },
  {
    id: "faq-2",
    topic: "Getting started",
    question: "How many portfolio items should I add?",
    answer:
      "Three is enough to be taken seriously; five to eight is where most profiles start receiving enquiries. Lead with the work closest to what you want to be hired for.",
  },
  {
    id: "faq-3",
    topic: "Bookings",
    question: "What happens if a session is cancelled?",
    answer:
      "The provider's cancellation window decides it. You see that window before you confirm, and it stays on the booking so nobody has to remember it.",
  },
  {
    id: "faq-4",
    topic: "Bookings",
    question: "Can I hold a date without confirming?",
    answer:
      "Yes. A request holds the slot while the provider replies. If they decline or the hold lapses, the date is released automatically.",
  },
  {
    id: "faq-5",
    topic: "Trust & safety",
    question: "Who can see my phone number?",
    answer:
      "Nobody, unless you add it as a contact channel and choose to show it. By default enquiries and bookings run through MusicLinkd messages.",
  },
  {
    id: "faq-6",
    topic: "Trust & safety",
    question: "Can I remove a review?",
    answer:
      "You cannot delete a review someone wrote about you, but you can reply publicly, and report it if it breaks the review policy.",
  },
  {
    id: "faq-7",
    topic: "Plans & payouts",
    question: "What does the platform fee cover?",
    answer:
      "Payment handling, dispute support and the trust checks that sit behind bookings. It is itemised on every invoice.",
  },
  {
    id: "faq-8",
    topic: "Plans & payouts",
    question: "Can I switch plans mid-month?",
    answer:
      "Yes. Upgrades apply immediately and are prorated; downgrades take effect at the end of the current period so you keep what you paid for.",
  },
];

export const faqTopics = ["Getting started", "Bookings", "Trust & safety", "Plans & payouts"];
