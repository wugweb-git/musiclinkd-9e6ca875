/**
 * FLOW 13 — NOTIFICATIONS (design-only mock data).
 * Canonical names: notification, notification_category, notification_channel, notification_preference.
 * Notifications never own the underlying object — they link into the flow that does.
 */

export type NotificationCategory =
  | "opportunities"
  | "bookings"
  | "messages"
  | "collaboration"
  | "verification"
  | "reviews"
  | "marketplace"
  | "system";

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  when: string;
  read: boolean;
  actor?: { name: string; photo: string };
  to: string;
  cta?: string;
};

/** `icon` names a lucide icon the notification screens map. Icons, never emoji. */
export const categoryMeta: Record<NotificationCategory, { label: string; icon: string }> = {
  opportunities: { label: "Opportunities", icon: "target" },
  bookings: { label: "Bookings", icon: "calendar" },
  messages: { label: "Messages", icon: "message" },
  collaboration: { label: "Collaboration", icon: "sliders" },
  verification: { label: "Verification", icon: "shield" },
  reviews: { label: "Reviews", icon: "star" },
  marketplace: { label: "Marketplace", icon: "store" },
  system: { label: "Account", icon: "settings" },
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=120&q=80`;

export const notifications: NotificationItem[] = [
  {
    id: "n-1",
    category: "opportunities",
    title: "You were shortlisted",
    body: "Sunburn Studios moved your application for “Playback singer — Hindi indie single” to shortlist.",
    when: "12m ago",
    read: false,
    actor: { name: "Sunburn Studios", photo: img("photo-1598488035139-bdbb2231ce04") },
    to: "/opportunities/applications",
    cta: "View application",
  },
  {
    id: "n-2",
    category: "bookings",
    title: "Booking request",
    body: "Kabir Menon requested Studio A on 14 Sep, 4–8pm.",
    when: "1h ago",
    read: false,
    actor: { name: "Kabir Menon", photo: img("photo-1500648767791-00dcc994a43e") },
    to: "/business/bookings/requests",
    cta: "Review request",
  },
  {
    id: "n-3",
    category: "verification",
    title: "Pro verification approved",
    body: "Your credited work was confirmed. The Pro badge is now live on your profile.",
    when: "3h ago",
    read: false,
    to: "/verification",
    cta: "See badge",
  },
  {
    id: "n-4",
    category: "messages",
    title: "New message",
    body: "Ananya Rao: “Sending the reference mix tonight.”",
    when: "5h ago",
    read: true,
    actor: { name: "Ananya Rao", photo: img("photo-1494790108377-be9c29b29330") },
    to: "/messages",
  },
  {
    id: "n-5",
    category: "collaboration",
    title: "Milestone due tomorrow",
    body: "“Vocal comps” on Neon Monsoon is due 4 Sep.",
    when: "Yesterday",
    read: true,
    to: "/collab",
    cta: "Open project",
  },
  {
    id: "n-6",
    category: "reviews",
    title: "New review",
    body: "Farah Sheikh left a 5-star review after your mixing session.",
    when: "Yesterday",
    read: true,
    to: "/reviews",
  },
  {
    id: "n-7",
    category: "marketplace",
    title: "Price drop on a saved listing",
    body: "Fender Rhodes Mk I dropped to ₹1,85,000.",
    when: "2d ago",
    read: true,
    to: "/marketplace",
  },
  {
    id: "n-8",
    category: "system",
    title: "New sign-in",
    body: "Signed in on Chrome, Mumbai. If this was not you, secure your account.",
    when: "3d ago",
    read: true,
    to: "/settings/security",
    cta: "Review security",
  },
];

export const unreadCount = (items: NotificationItem[] = notifications) =>
  items.filter((n) => !n.read).length;

/* ── Preferences ──────────────────────────────────────────── */

export type Channel = "push" | "email" | "sms";
export const channels: { key: Channel; label: string; hint: string }[] = [
  { key: "push", label: "Push", hint: "On this device" },
  { key: "email", label: "Email", hint: "To your account address" },
  { key: "sms", label: "SMS", hint: "Only for time-critical bookings" },
];

export type NotificationPreference = {
  category: NotificationCategory;
  push: boolean;
  email: boolean;
  sms: boolean;
};

export const defaultPreferences: NotificationPreference[] = [
  { category: "opportunities", push: true, email: true, sms: false },
  { category: "bookings", push: true, email: true, sms: true },
  { category: "messages", push: true, email: false, sms: false },
  { category: "collaboration", push: true, email: false, sms: false },
  { category: "verification", push: true, email: true, sms: false },
  { category: "reviews", push: true, email: false, sms: false },
  { category: "marketplace", push: false, email: false, sms: false },
  { category: "system", push: true, email: true, sms: false },
];

export const quietHours = { enabled: true, from: "23:00", to: "08:00" };

export const notificationPrefsKey = "ml.notifications.prefs";
export const notificationReadKey = "ml.notifications.read";

export function storedReadIds(): string[] {
  try {
    const raw = window.localStorage.getItem(notificationReadKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function storeReadIds(ids: string[]) {
  try {
    window.localStorage.setItem(notificationReadKey, JSON.stringify(ids));
  } catch {
    /* storage may be unavailable */
  }
}

export function withStoredRead(items: NotificationItem[] = notifications) {
  const read = new Set(storedReadIds());
  return items.map((n) => (read.has(n.id) ? { ...n, read: true } : n));
}
