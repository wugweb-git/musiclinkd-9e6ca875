/**
 * FLOW 21 — SETTINGS & SUPPORT (design-only mock data).
 * Settings never duplicates a flow — every row links into the flow that owns the setting.
 */

export type SettingsGroup = {
  key: string;
  title: string;
  rows: { key: string; label: string; hint: string; to: string }[];
};

export const settingsGroups: SettingsGroup[] = [
  {
    key: "account",
    title: "Account",
    rows: [
      { key: "profile", label: "Edit profile", hint: "Name, headline, roles, links", to: "/profile/edit" },
      { key: "account", label: "Account details", hint: "Email, phone, username", to: "/settings/account" },
      { key: "verification", label: "Verification", hint: "Identity and professional badges", to: "/verification" },
      { key: "plans", label: "Plan & billing", hint: "Your subscription and invoices", to: "/plans/manage" },
    ],
  },
  {
    key: "work",
    title: "Your work",
    rows: [
      { key: "services", label: "Services & availability", hint: "Pricing, packages, calendar", to: "/services" },
      { key: "business", label: "Business profiles", hint: "Studios, labels, venues", to: "/business" },
      { key: "portfolio", label: "Portfolio settings", hint: "Visibility and ordering", to: "/portfolio/settings" },
      { key: "earnings", label: "Earnings", hint: "Payouts and history", to: "/plans/earnings" },
    ],
  },
  {
    key: "privacy",
    title: "Privacy & security",
    rows: [
      { key: "privacy", label: "Privacy", hint: "Who can see and contact you", to: "/settings/privacy" },
      { key: "security", label: "Security", hint: "Password, sessions, 2-step", to: "/settings/security" },
      { key: "notifications", label: "Notifications", hint: "Channels and quiet hours", to: "/notifications/settings" },
      { key: "discovery", label: "Discovery preferences", hint: "What you get recommended", to: "/recommendations/settings" },
    ],
  },
  {
    key: "support",
    title: "Support",
    rows: [
      { key: "help", label: "Help centre", hint: "Guides and answers", to: "/help" },
      { key: "terms", label: "Terms of use", hint: "Last updated Jul 2026", to: "/legal/terms" },
      { key: "privacy-policy", label: "Privacy policy", hint: "How we handle your data", to: "/legal/privacy" },
      { key: "signout", label: "Sign out", hint: "On this device", to: "/auth/signout" },
    ],
  },
];

export const accountFields = [
  { key: "email", label: "Email", value: "ananya@musiclinkd.app", verified: true, action: "Change" },
  { key: "phone", label: "Phone", value: "+91 98••• ••210", verified: true, action: "Change" },
  { key: "username", label: "Username", value: "@ananya", verified: false, action: "Edit" },
  { key: "language", label: "Language", value: "English (India)", verified: false, action: "Change" },
  { key: "currency", label: "Currency", value: "INR ₹", verified: false, action: "Change" },
];

export const privacyControls = [
  {
    key: "visibility",
    label: "Profile visibility",
    hint: "Who can open your full profile",
    value: "Public",
    options: ["Public", "Connections only", "Private"],
  },
  {
    key: "contact",
    label: "Who can message you",
    hint: "Direct messages from strangers",
    value: "Anyone",
    options: ["Anyone", "Connections only", "Nobody"],
  },
  {
    key: "phone",
    label: "Show phone number",
    hint: "Only after a booking is confirmed",
    value: "After booking",
    options: ["Never", "After booking", "Always"],
  },
  {
    key: "discovery",
    label: "Appear in Discover",
    hint: "Swipe cards and search results",
    value: "Yes",
    options: ["Yes", "No"],
  },
];

export const sessions = [
  { id: "s-1", device: "Pixel 8 · Chrome", place: "Mumbai, IN", when: "Active now", current: true },
  { id: "s-2", device: "MacBook Air · Safari", place: "Mumbai, IN", when: "2 days ago", current: false },
  { id: "s-3", device: "iPad · Chrome", place: "Pune, IN", when: "3 weeks ago", current: false },
];

export const securityRows = [
  { key: "password", label: "Change password", hint: "Last changed 4 months ago", to: "/auth/forgot" },
  { key: "2fa", label: "Two-step verification", hint: "Off — recommended for sellers", to: "/auth/phone" },
  { key: "delete", label: "Delete account", hint: "Permanently remove your data", to: "/settings/delete-account" },
];

export const supportTopics = [
  { key: "bookings", label: "A booking went wrong", to: "/help" },
  { key: "payments", label: "Payments and payouts", to: "/help" },
  { key: "safety", label: "Report someone", to: "/help" },
  { key: "account", label: "I cannot access my account", to: "/auth/forgot" },
];
