/**
 * FLOW 18 — SUBSCRIPTION / MONETIZATION. Design-only.
 * Canonical names: plan, subscription, entitlement, invoice, payout_account, boost.
 * No payment infrastructure is implemented here.
 */
export type PlanKey = "free" | "pro" | "business";

export type Plan = {
  key: PlanKey;
  name: string;
  price: string;
  period: string;
  yearly: string;
  tagline: string;
  best?: boolean;
  features: { label: string; included: boolean }[];
};

export const plans: Plan[] = [
  {
    key: "free",
    name: "Starter",
    price: "₹0",
    period: "forever",
    yearly: "₹0",
    tagline: "Be findable and take your first bookings.",
    features: [
      { label: "Public profile & QR identity", included: true },
      { label: "6 portfolio items", included: true },
      { label: "Accept bookings & reviews", included: true },
      { label: "Priority in Discover", included: false },
      { label: "Advanced availability & pricing rules", included: false },
      { label: "Listing boosts", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹499",
    period: "per month",
    yearly: "₹4,990 per year · 2 months free",
    tagline: "For working professionals taking regular work.",
    best: true,
    features: [
      { label: "Everything in Starter", included: true },
      { label: "Unlimited portfolio items", included: true },
      { label: "Priority in Discover & Search", included: true },
      { label: "Advanced availability & pricing rules", included: true },
      { label: "2 listing boosts per month", included: true },
      { label: "Team seats & shared workspace", included: false },
    ],
  },
  {
    key: "business",
    name: "Business",
    price: "₹1,499",
    period: "per month",
    yearly: "₹14,990 per year · 2 months free",
    tagline: "For studios, labels and agencies with a team.",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "5 team seats & role permissions", included: true },
      { label: "Multiple bookable resources", included: true },
      { label: "Business verification fast-track", included: true },
      { label: "6 listing boosts per month", included: true },
      { label: "Invoice & payout exports", included: true },
    ],
  },
];

export const currentSubscription = {
  planKey: "pro" as PlanKey,
  status: "active" as "active" | "past_due" | "cancelled" | "trialing",
  renewsOn: "12 Oct 2026",
  billingCycle: "monthly" as "monthly" | "yearly",
  amount: "₹499",
  method: "UPI · rahul@okhdfc",
};

export const entitlements = [
  { label: "Portfolio items", used: 14, limit: null as number | null, hint: "Unlimited on Pro" },
  { label: "Listing boosts this month", used: 1, limit: 2, hint: "1 of 2 used" },
  { label: "Team seats", used: 1, limit: 1, hint: "Business unlocks 5" },
];

export const invoices = [
  { id: "in-2609", date: "12 Sep 2026", amount: "₹499", status: "paid" as const, plan: "Pro monthly" },
  { id: "in-2481", date: "12 Aug 2026", amount: "₹499", status: "paid" as const, plan: "Pro monthly" },
  { id: "in-2350", date: "12 Jul 2026", amount: "₹499", status: "refunded" as const, plan: "Pro monthly" },
];

export const boosts = [
  { id: "bo-1", target: "Mixing & mastering service", state: "active" as const, detail: "3 days left · 2.4× profile views" },
  { id: "bo-2", target: "Fender Rhodes Mk1 listing", state: "available" as const, detail: "Boost for 7 days" },
];

export const payoutAccount = {
  state: "verified" as "missing" | "pending" | "verified",
  label: "HDFC •••• 4412",
  nextPayout: "₹18,400 on 18 Sep",
  pending: "₹6,200 clearing",
};

export const earnings = {
  range: "Last 30 days",
  net: "₹64,800",
  lines: [
    { label: "Bookings", value: "₹42,000" },
    { label: "Services", value: "₹15,800" },
    { label: "Rentals", value: "₹7,000" },
  ],
  fees: "Platform fee 8% · shown on every invoice",
};

export const cancelReasons = ["Too expensive", "Not getting enough work", "Missing a feature", "Taking a break", "Other"];
