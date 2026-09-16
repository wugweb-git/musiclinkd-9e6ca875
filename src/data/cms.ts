/**
 * FLOW 22 — CMS / CONTENT PAGES. Design-only.
 * Canonical names: content_page, content_category, content_block, content_status.
 */
import type { LinkProps } from "@tanstack/react-router";

export type ContentBlock =
  | { type: "para"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "cta"; label: string; link: LinkProps };

export type ContentPage = {
  /** content_page.slug — EXISTING */
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  updated: string;
  kind: "guide" | "policy" | "faq" | "release";
  blocks: ContentBlock[];
  related: string[];
};

export const contentCategories = [
  { key: "getting-started", label: "Getting started", blurb: "Set up a profile people book" },
  { key: "bookings", label: "Bookings & studios", blurb: "Availability, policies, no-shows" },
  { key: "marketplace", label: "Marketplace & rentals", blurb: "Buying, selling, renting gear" },
  { key: "trust", label: "Trust & safety", blurb: "Verification, reviews, reporting" },
  { key: "legal", label: "Legal", blurb: "Terms, privacy, community rules" },
];

export const contentPages: ContentPage[] = [
  {
    slug: "profile-that-gets-booked",
    title: "Building a profile that gets booked",
    summary: "The five things clients look at before they message you.",
    category: "getting-started",
    readTime: "5 min read",
    updated: "Updated 2 Sep 2026",
    kind: "guide",
    blocks: [
      {
        type: "para",
        text: "A MusicLinkd profile is a professional identity, not a social feed. Clients scan it in under a minute and look for the same five things every time.",
      },
      { type: "heading", text: "What clients check" },
      {
        type: "list",
        items: [
          "One clear role line",
          "Two audio samples that start strong",
          "A rate range",
          "Verification badges",
          "Recent reviews from completed work",
        ],
      },
      {
        type: "callout",
        text: "Profiles with two published portfolio items receive roughly three times more first messages.",
      },
      { type: "cta", label: "Open my portfolio", link: { to: "/portfolio" } },
    ],
    related: ["pricing-your-first-service", "how-verification-works"],
  },
  {
    slug: "pricing-your-first-service",
    title: "Pricing your first service",
    summary: "How to set a rate you can defend and still win work.",
    category: "getting-started",
    readTime: "6 min read",
    updated: "Updated 28 Aug 2026",
    kind: "guide",
    blocks: [
      {
        type: "para",
        text: "Price the outcome, not the hours. Clients compare a finished mix against other finished mixes, so publish a per-deliverable rate with a clear revision count.",
      },
      { type: "heading", text: "A simple structure" },
      {
        type: "list",
        items: [
          "Base deliverable and what is included",
          "Number of revisions",
          "Turnaround",
          "Add-ons priced separately",
          "Cancellation window",
        ],
      },
      { type: "cta", label: "Add a service", link: { to: "/profile/edit" } },
    ],
    related: ["profile-that-gets-booked", "booking-policies-explained"],
  },
  {
    slug: "how-verification-works",
    title: "How verification works",
    summary: "What each badge means and how the review is done.",
    category: "trust",
    readTime: "4 min read",
    updated: "Updated 5 Sep 2026",
    kind: "faq",
    blocks: [
      {
        type: "para",
        text: "Verification confirms specific facts, not quality. Each badge has its own evidence requirements and is reviewed by a person.",
      },
      {
        type: "list",
        items: [
          "Identity — a government ID and a selfie match",
          "Professional — two credited releases or clients",
          "Business — registration documents",
          "Studio — address proof and room photos",
        ],
      },
      {
        type: "callout",
        text: "Documents are only used for the review and are never shown on your public profile.",
      },
      { type: "cta", label: "Start verification", link: { to: "/verification" } },
    ],
    related: ["review-policy", "profile-that-gets-booked"],
  },
  {
    slug: "booking-policies-explained",
    title: "Booking policies explained",
    summary: "Cancellation windows, holds, deposits and no-shows.",
    category: "bookings",
    readTime: "7 min read",
    updated: "Updated 30 Aug 2026",
    kind: "guide",
    blocks: [
      {
        type: "para",
        text: "Every bookable resource publishes one policy set. Customers see it before they request, and it is attached to the booking record.",
      },
      { type: "heading", text: "The three settings that matter" },
      {
        type: "list",
        items: [
          "Cancellation window and refund tiers",
          "Whether a hold expires automatically",
          "Buffer time between sessions",
        ],
      },
      { type: "cta", label: "Open provider policies", link: { to: "/provider/policies" } },
    ],
    related: ["review-policy", "how-verification-works"],
  },
  {
    slug: "review-policy",
    title: "Review policy",
    summary: "Who can review, what gets removed and how responses work.",
    category: "trust",
    readTime: "3 min read",
    updated: "Updated 1 Sep 2026",
    kind: "policy",
    blocks: [
      {
        type: "para",
        text: "Reviews exist to describe completed work. Only a completed booking, order or rental unlocks a review, and both sides submit blind.",
      },
      {
        type: "list",
        items: [
          "No editing after publishing",
          "One response per review",
          "Contact details and off-platform payment requests are removed",
          "Flagged reviews are re-checked within 48 hours",
        ],
      },
      { type: "cta", label: "Open my reviews", link: { to: "/reviews" } },
    ],
    related: ["how-verification-works", "community-guidelines"],
  },
  {
    slug: "community-guidelines",
    title: "Community guidelines",
    summary: "What is expected of every account on MusicLinkd.",
    category: "legal",
    readTime: "4 min read",
    updated: "Updated 18 Aug 2026",
    kind: "policy",
    blocks: [
      {
        type: "para",
        text: "MusicLinkd is a professional network. Keep negotiations, briefs and payment discussions on the platform so both sides have a record.",
      },
      {
        type: "list",
        items: [
          "No harassment or discrimination",
          "No misrepresenting credits",
          "No off-platform payment pressure",
          "No reselling other people's work as your own",
        ],
      },
    ],
    related: ["review-policy"],
  },
  {
    slug: "whats-new",
    title: "What's new in MusicLinkd",
    summary: "Rentals, collaboration workspaces and QR identity shipped this quarter.",
    category: "getting-started",
    readTime: "2 min read",
    updated: "Updated 10 Sep 2026",
    kind: "release",
    blocks: [
      {
        type: "list",
        items: [
          "Equipment rentals with calendar availability",
          "Collaboration workspaces with milestones and files",
          "QR digital identity and share cards",
          "Provider pricing and policy controls",
        ],
      },
      { type: "cta", label: "Open my QR identity", link: { to: "/identity/qr" } },
    ],
    related: ["profile-that-gets-booked"],
  },
];

export const getPage = (slug: string) => contentPages.find((p) => p.slug === slug);
export const pagesInCategory = (key: string) => contentPages.filter((p) => p.category === key);
export const popularSlugs = [
  "profile-that-gets-booked",
  "how-verification-works",
  "booking-policies-explained",
];
