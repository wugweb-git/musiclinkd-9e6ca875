/**
 * FLOW 16 — VERIFICATION.
 * Canonical names: verification_request, verification_type, verification_status, trust_signal.
 * Spec state mapping: not_started → unverified, pending → in_review.
 * Types, requirements and requests are stored (src/lib/verification.functions.ts); screens read those.
 * What screens still use here: status labels and tones, overallStatus, the wizard steps and the
 * static copy. verificationTypes, myVerifications, verificationTypesFor and eligibility are no
 * screen's: supabase/generators/export_services_verification.ts exports them for the migration.
 */
export type VerificationStatus = "unverified" | "in_review" | "verified" | "rejected" | "expired";

export type VerificationRequirement = {
  /** Short document / evidence name shown in the checklist. */
  label: string;
  /** Why the Trust team needs it — never ask without a reason. */
  why: string;
  /** Not needed to submit. */
  optional?: boolean;
  /** Upload of a file, or information typed into the form. */
  kind: "document" | "info";
};

export type VerificationType = {
  /** verification_type.key — EXISTING */
  key: "identity" | "professional" | "business" | "studio";
  title: string;
  blurb: string;
  /** What the badge proves. */
  verifies: string;
  /** What other people actually see once approved. */
  whatOthersSee: string;
  requirements: VerificationRequirement[];
  turnaround: string;
  appliesTo: string;
  /** Set when the level cannot be started yet. */
  locked?: { reason: string; needs: VerificationType["key"] };
};

export const verificationTypes: VerificationType[] = [
  {
    key: "identity",
    title: "Identity verification",
    blurb: "Confirms you are a real person. Required before any other badge.",
    verifies: "That the person behind this account is real and matches the ID on file.",
    whatOthersSee: "An ID-verified badge next to your name. Never your documents or ID number.",
    requirements: [
      {
        label: "Government photo ID",
        why: "Confirms your legal name matches this account.",
        kind: "document",
      },
      {
        label: "Selfie match",
        why: "Confirms the ID belongs to you and not someone else.",
        kind: "document",
      },
      {
        label: "Phone number on file",
        why: "Used only to contact you about this review.",
        kind: "info",
      },
    ],
    turnaround: "Usually 1–2 days",
    appliesTo: "Every profile",
  },
  {
    key: "professional",
    title: "Professional verification",
    blurb: "Confirms credited work as an artist, engineer or producer.",
    verifies: "That you have real credited work in the industry.",
    whatOthersSee: "A Pro badge on your profile, in Discover, on services and on reviews.",
    requirements: [
      {
        label: "2 credited releases or clients",
        why: "Evidence the work is genuinely yours.",
        kind: "info",
      },
      {
        label: "Portfolio with published work",
        why: "Reviewers check credits against your portfolio.",
        kind: "info",
      },
      {
        label: "Affiliation",
        why: "Label, studio or agency you work with, if any.",
        kind: "info",
        optional: true,
      },
    ],
    turnaround: "3–5 days",
    appliesTo: "Talent profiles",
  },
  {
    key: "business",
    title: "Business verification",
    blurb: "Confirms a registered label, agency or management company.",
    verifies: "That the business is registered and this account may act for it.",
    whatOthersSee: "A verified business badge on the business profile and its listings.",
    requirements: [
      {
        label: "GST or registration certificate",
        why: "Confirms the business legally exists.",
        kind: "document",
      },
      {
        label: "Business address",
        why: "Matched against the registration certificate.",
        kind: "info",
      },
      {
        label: "Authorised signatory ID",
        why: "Confirms you may represent this business.",
        kind: "document",
      },
    ],
    turnaround: "3–7 days",
    appliesTo: "Business profiles",
  },
  {
    key: "studio",
    title: "Studio & space verification",
    blurb: "Confirms a physical bookable space with real photos.",
    verifies: "That the space exists, is bookable and looks like its photos.",
    whatOthersSee: "A verified space badge on the listing and in booking search.",
    requirements: [
      {
        label: "Address proof",
        why: "Confirms the space is at the address you list.",
        kind: "document",
      },
      {
        label: "6 room photos",
        why: "Renters must see the real room, not stock images.",
        kind: "document",
      },
      {
        label: "Equipment list",
        why: "Shown to renters so expectations match reality.",
        kind: "info",
      },
    ],
    turnaround: "3–5 days",
    appliesTo: "Bookable resources",
  },
];

export type VerificationRequest = {
  id: string;
  type: VerificationType["key"];
  status: VerificationStatus;
  submitted?: string;
  decided?: string;
  reviewer?: string;
  /** Reviewer note shown to the applicant on rejection. */
  reason?: string;
  /** Set on verified badges that need renewal. */
  expiresOn?: string;
  documents: { name: string; state: "uploaded" | "missing" | "rejected" }[];
};

export const myVerifications: VerificationRequest[] = [
  {
    id: "vr-1",
    type: "identity",
    status: "verified",
    submitted: "12 Aug",
    decided: "13 Aug",
    reviewer: "MusicLinkd Trust",
    documents: [
      { name: "Government photo ID", state: "uploaded" },
      { name: "Selfie match", state: "uploaded" },
    ],
  },
  {
    id: "vr-2",
    type: "professional",
    status: "in_review",
    submitted: "2 days ago",
    documents: [
      { name: "2 credited releases or clients", state: "uploaded" },
      { name: "Portfolio with published work", state: "uploaded" },
    ],
  },
  {
    id: "vr-3",
    type: "business",
    status: "rejected",
    submitted: "20 Jul",
    decided: "24 Jul",
    reason:
      "The registration certificate did not match the business name on the profile. Re-submit with a matching legal name.",
    documents: [
      { name: "GST or registration certificate", state: "rejected" },
      { name: "Business address", state: "uploaded" },
    ],
  },
  {
    id: "vr-4",
    type: "studio",
    status: "expired",
    submitted: "4 Mar",
    decided: "8 Mar",
    reviewer: "MusicLinkd Trust",
    expiresOn: "8 Mar this year",
    documents: [
      { name: "Address proof", state: "uploaded" },
      { name: "6 room photos", state: "missing" },
    ],
  },
];

export const statusTone: Record<VerificationStatus, "neutral" | "good" | "warn" | "bad"> = {
  unverified: "neutral",
  in_review: "warn",
  verified: "good",
  rejected: "bad",
  expired: "warn",
};

export const statusLabel: Record<VerificationStatus, string> = {
  unverified: "Not started",
  in_review: "In review",
  verified: "Verified",
  rejected: "Needs changes",
  expired: "Expired",
};

/** Overall account trust state derived from the individual requests. */
export function overallStatus(reqs: readonly { status: VerificationStatus }[]): VerificationStatus {
  if (reqs.some((r) => r.status === "rejected")) return "rejected";
  if (reqs.some((r) => r.status === "expired")) return "expired";
  if (reqs.some((r) => r.status === "in_review")) return "in_review";
  if (reqs.some((r) => r.status === "verified")) return "verified";
  return "unverified";
}

/** True when a level can be started — professional and business need identity first. */
export function eligibility(
  key: VerificationType["key"],
  reqs: VerificationRequest[] = myVerifications,
) {
  const identityDone = reqs.some((r) => r.type === "identity" && r.status === "verified");
  if (key !== "identity" && !identityDone) {
    return {
      allowed: false,
      reason: "Verify your identity first — every other badge builds on it.",
    };
  }
  return { allowed: true, reason: "" };
}

/** VERIFY-15 — the badge must read the same everywhere it appears. */
export const badgePlacements = [
  { surface: "Profile", detail: "Next to your name in the hero, at 16px." },
  { surface: "Search", detail: "After the name in every result row." },
  { surface: "Discovery", detail: "On talent cards and swipe cards." },
  {
    surface: "Marketplace",
    detail: "On the seller line of a listing, never on the listing title.",
  },
  { surface: "Business", detail: "On the business header and each of its spaces." },
  { surface: "Opportunities", detail: "On the poster of a call, so applicants know who is real." },
  { surface: "Messaging", detail: "In the conversation header only, not on every bubble." },
  { surface: "Reviews", detail: "On the reviewer name when that reviewer is verified." },
];

/** VERIFY-16 — plain-language privacy policy for the review. */
export const privacyPoints = [
  {
    title: "Documents are never public",
    body: "Only the badge and its status appear on your profile. Nobody browsing MusicLinkd can see the documents you upload.",
  },
  {
    title: "Used only for this review",
    body: "The Trust team reads your documents to make one decision. They are not used for ads, ranking inputs or shared with other members.",
  },
  {
    title: "Reviewed by people",
    body: "A small Trust team reviews each request by hand. Reviewer notes are shown to you when a request needs changes.",
  },
  {
    title: "You can withdraw",
    body: "While a request is in review you can withdraw it. Withdrawing removes the uploaded documents from the review queue.",
  },
];

export const verificationFaq = [
  {
    q: "Why verify?",
    a: "Verified profiles are easier to trust, rank higher in Discover and Search, and can be booked without a deposit.",
  },
  {
    q: "What is required?",
    a: "Identity needs a government photo ID and a selfie. Professional needs credited work. Business needs registration documents.",
  },
  {
    q: "How is my information used?",
    a: "Only to make the verification decision. Documents are never shown publicly and are not used for anything else.",
  },
  {
    q: "How long does review take?",
    a: "Each level shows its own turnaround. Identity is usually the fastest; business documents take longest.",
  },
  {
    q: "What happens if I am rejected?",
    a: "You get the reviewer's reason and can resubmit. Accepted documents are kept so you only fix what failed.",
  },
];

export const verificationSteps = [
  "Requirements",
  "Your details",
  "Documents",
  "Review",
  "Submitted",
] as const;
export type VerificationStep = (typeof verificationSteps)[number];

/** Business roles that run a bookable space, so the studio & space badge applies. */
const SPACE_ROLES = ["studio", "venue", "rental_provider"];

/**
 * The badges that fit a person, from their profile roles (taxonomy person_types slugs):
 * - everyone: identity
 * - talent roles (or no role yet): professional
 * - business roles: business
 * - studios, venues and rental providers: studio & space
 */
export function verificationTypesFor(
  roles: readonly string[],
  personTypes: readonly { slug: string; metadata: { flow?: string } | null }[],
): VerificationType[] {
  const flowOf = (slug: string) => personTypes.find((o) => o.slug === slug)?.metadata?.flow;
  // "business" on live rows until 20260921300000_business_types_cleanup.sql renames it.
  const isBusiness = (r: string) => flowOf(r) === "business_user" || flowOf(r) === "business";
  const business = roles.some(isBusiness);
  const talent = roles.length === 0 || roles.some((r) => !isBusiness(r));
  const space = roles.some((r) => SPACE_ROLES.includes(r));
  const keys: VerificationType["key"][] = [
    "identity",
    ...(talent ? (["professional"] as const) : []),
    ...(business ? (["business"] as const) : []),
    ...(space ? (["studio"] as const) : []),
  ];
  return verificationTypes.filter((t) => keys.includes(t.key));
}
