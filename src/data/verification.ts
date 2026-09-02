/**
 * FLOW 16 — VERIFICATION. Design-only trust model.
 * Canonical names: verification_request, verification_type, verification_status, trust_signal.
 */
export type VerificationStatus = "unverified" | "in_review" | "verified" | "rejected" | "expired";

export type VerificationType = {
  /** verification_type.key — EXISTING */
  key: "identity" | "professional" | "business" | "studio";
  title: string;
  blurb: string;
  requirements: string[];
  turnaround: string;
  appliesTo: string;
};

export const verificationTypes: VerificationType[] = [
  {
    key: "identity",
    title: "Identity verification",
    blurb: "Confirms you are a real person. Required before any other badge.",
    requirements: ["Government photo ID", "Selfie match", "Phone number on file"],
    turnaround: "Usually 1–2 days",
    appliesTo: "Every profile",
  },
  {
    key: "professional",
    title: "Professional verification",
    blurb: "Confirms credited work as an artist, engineer or producer.",
    requirements: ["2 credited releases or clients", "Portfolio with published work", "Identity verified"],
    turnaround: "3–5 days",
    appliesTo: "Talent profiles",
  },
  {
    key: "business",
    title: "Business verification",
    blurb: "Confirms a registered label, agency or management company.",
    requirements: ["GST or registration certificate", "Business address", "Authorised signatory ID"],
    turnaround: "3–7 days",
    appliesTo: "Business profiles",
  },
  {
    key: "studio",
    title: "Studio & space verification",
    blurb: "Confirms a physical bookable space with real photos.",
    requirements: ["Address proof", "6 room photos", "Equipment list"],
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
    documents: [{ name: "Aadhaar (masked)", state: "uploaded" }, { name: "Selfie match", state: "uploaded" }],
  },
  {
    id: "vr-2",
    type: "professional",
    status: "in_review",
    submitted: "2 days ago",
    documents: [
      { name: "Release credits — Paper Kites EP", state: "uploaded" },
      { name: "Client letter — Octave Sound Labs", state: "uploaded" },
    ],
  },
  {
    id: "vr-3",
    type: "business",
    status: "rejected",
    submitted: "20 Jul",
    decided: "24 Jul",
    reason: "The registration certificate did not match the business name on the profile. Re-submit with a matching legal name.",
    documents: [{ name: "GST certificate", state: "rejected" }, { name: "Address proof", state: "uploaded" }],
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

/** Trust signals surfaced on profiles, search results, listings and reviews. */
export const trustSignals = [
  { key: "identity", label: "ID verified", detail: "Government ID checked by the Trust team." },
  { key: "professional", label: "Pro verified", detail: "Credited work confirmed on 2+ releases." },
  { key: "response", label: "Responds in 2h", detail: "Median first reply over the last 30 days." },
  { key: "reviews", label: "4.9 from 38 reviews", detail: "Reviews only from completed bookings." },
  { key: "since", label: "On MusicLinkd since 2019", detail: "Account age and continuous activity." },
];

export const verificationSteps = ["Choose type", "Requirements", "Documents", "Review", "Submitted"] as const;
export type VerificationStep = (typeof verificationSteps)[number];
