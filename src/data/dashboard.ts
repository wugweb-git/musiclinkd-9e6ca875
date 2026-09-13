import { talents, studios, trending } from "./discover";
import { categoryLabel, myApplications, opportunities } from "./opportunities";

export type Stat = {
  key: string;
  label: string;
  value: number;
  hint: string;
  to: "/messages" | "/me" | "/recommendations/swipe" | "/saved";
};

export type ActivityEvent = {
  id: string;
  kind: "request" | "view" | "booking" | "release" | "opportunity";
  title: string;
  meta: string;
  when: string;
  photo: string;
};

export type ContinueItem = {
  id: string;
  title: string;
  meta: string;
  progress: number;
  cta: string;
  to: "/me" | "/saved" | "/studio";
};

export type Booking = {
  id: string;
  title: string;
  meta: string;
  day: string;
  month: string;
};

export type DashboardData = {
  user: {
    firstName: string;
    role: string;
    photo: string;
    profileCompletion: number;
    available: boolean;
  };
  stats: Stat[];
  continueItems: ContinueItem[];
  forYou: typeof talents;
  studios: typeof studios;
  activity: ActivityEvent[];
  bookings: Booking[];
};

export const dashboardData: DashboardData = {
  user: {
    firstName: "Rahul",
    role: "Music Producer · Mix Engineer",
    photo: talents[1]!.photo,
    profileCompletion: 72,
    available: true,
  },
  stats: [
    {
      key: "requests",
      label: "Connection requests",
      value: 6,
      hint: "3 new today",
      to: "/messages",
    },
    { key: "messages", label: "Unread messages", value: 3, hint: "Beta", to: "/messages" },
    { key: "views", label: "Profile views", value: 148, hint: "+24 this week", to: "/me" },
    {
      key: "collabs",
      label: "Collab opportunities",
      value: 9,
      hint: "Matched to you",
      to: "/recommendations/swipe",
    },
  ],
  continueItems: [
    {
      id: "ep",
      title: "Finish uploading “Monsoon Tapes” EP",
      meta: "3 of 5 tracks added",
      progress: 60,
      cta: "Continue upload",
      to: "/me",
    },
    {
      id: "shortlist",
      title: "Shortlist for Mumbai session",
      meta: "4 vocalists saved · no invites sent",
      progress: 35,
      cta: "Review shortlist",
      to: "/saved",
    },
  ],
  forYou: [talents[0]!, talents[5]!, talents[2]!, talents[4]!],
  studios,
  activity: [
    {
      id: "a1",
      kind: "request",
      title: "Ananya Sharma wants to connect",
      meta: "Playback Vocalist · Mumbai",
      when: "2h",
      photo: talents[0]!.photo,
    },
    {
      id: "a2",
      kind: "view",
      title: "Arjun Menon viewed your profile",
      meta: "Film Composer · Kochi",
      when: "5h",
      photo: talents[4]!.photo,
    },
    {
      id: "a3",
      kind: "opportunity",
      title: "Indie label is looking for a mix engineer",
      meta: "Posted in Bengaluru · ₹25,000/track",
      when: "Yesterday",
      photo: trending[1]!.photo,
    },
    {
      id: "a4",
      kind: "release",
      title: "The Local Train released a new single",
      meta: "Indie Rock · Delhi NCR",
      when: "2d",
      photo: trending[0]!.photo,
    },
  ],
  bookings: [
    {
      id: "b1",
      title: "Yash Raj Sound Studios",
      meta: "Mix session · 11:00–16:00",
      day: "14",
      month: "Aug",
    },
    {
      id: "b2",
      title: "Vocal cut with Tanvi Rao",
      meta: "Krimson Avenue, Bengaluru",
      day: "19",
      month: "Aug",
    },
  ],
};

export const emptyDashboard: DashboardData = {
  ...dashboardData,
  stats: dashboardData.stats.map((s) => ({ ...s, value: 0, hint: "Nothing yet" })),
  continueItems: [],
  forYou: [],
  activity: [],
  bookings: [],
};

/* ------------------------------------------------------------------ */
/* Orchestrator selectors — derive "what matters now" from seeded data  */
/* ------------------------------------------------------------------ */

import { bookings, getBookable, getResource, formatDate, formatTime } from "./booking";

/** Routes the dashboard is allowed to link to (all already exist). */
export type DashLink =
  | "/"
  | "/messages"
  | "/me"
  | "/recommendations/swipe"
  | "/saved"
  | "/search"
  | "/studio"
  | "/bookings"
  | "/portfolio/new"
  | "/profile/edit"
  | "/opportunities"
  | "/opportunities/applications";

export type HeadlineUpdate = {
  id: string;
  value: number;
  title: string;
  body: string;
  cta: string;
  to: DashLink;
};

export type ContinueCard = {
  id: string;
  eyebrow: string;
  title: string;
  meta: string;
  detail: string;
  cta: string;
  /** Booking ref when the card points at a session, otherwise a flat route. */
  ref?: string;
  to?: DashLink;
  progress?: number;
};

export type ForYouTile = {
  id: string;
  value: string;
  label: string;
  hint: string;
  to: DashLink;
};

/** The single highest-value update — never a grid of four equal counters. */
export function headlineUpdate(d: DashboardData): HeadlineUpdate | null {
  const rank: Record<string, number> = { collabs: 3, requests: 2, messages: 1, views: 0 };
  const top = [...d.stats]
    .filter((s) => s.value > 0)
    .sort((a, b) => (rank[b.key] ?? 0) - (rank[a.key] ?? 0))[0];
  if (!top) return null;
  const copy: Record<string, { title: string; body: string; cta: string }> = {
    collabs: {
      title: `${top.value} new opportunities`,
      body: "Collaboration matches picked for your roles and city.",
      cta: "See opportunities",
    },
    requests: {
      title: `${top.value} connection requests`,
      body: "Musicians and studios want to work with you.",
      cta: "Review requests",
    },
    messages: {
      title: `${top.value} unread messages`,
      body: "Conversations waiting on your reply.",
      cta: "Open Connections",
    },
    views: {
      title: `${top.value} profile views`,
      body: "People are finding your work this week.",
      cta: "View profile",
    },
  };
  const c = copy[top.key]!;
  return { id: top.key, value: top.value, title: c.title, body: c.body, cta: c.cta, to: top.to };
}

/** Next confirmed/upcoming session from the Booking flow, so Home and Bookings agree. */
export function nextSession(): ContinueCard | null {
  const soon = bookings
    .filter((b) => b.status === "upcoming" || b.status === "confirmed" || b.status === "inProgress")
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!soon) return null;
  const entity = getBookable(soon.bookableId);
  const resource = getResource(entity, soon.resourceId);
  const today = new Date().toISOString().slice(0, 10);
  const when = soon.date === today ? "Today" : formatDate(soon.date);
  return {
    id: soon.ref,
    eyebrow: "Continue",
    title: entity?.name ?? "Studio session",
    meta: resource ? `${resource.name} · ${entity?.city ?? ""}`.trim() : "Studio booking",
    detail: `${when} · ${formatTime(soon.start)}–${formatTime(soon.end)}`,
    cta: "View booking",
    ref: soon.ref,
  };
}

/** Session first, then the most advanced unfinished action. */
export function continueCards(d: DashboardData): ContinueCard[] {
  const out: ContinueCard[] = [];
  const session = nextSession();
  if (session) out.push(session);
  const unfinished = [...d.continueItems].sort((a, b) => b.progress - a.progress)[0];
  if (unfinished) {
    out.push({
      id: unfinished.id,
      eyebrow: "Pick up where you left off",
      title: unfinished.title,
      meta: unfinished.meta,
      detail: `${unfinished.progress}% done`,
      cta: unfinished.cta,
      to: unfinished.to,
      progress: unfinished.progress,
    });
  }
  return out;
}

export function forYouTiles(d: DashboardData): ForYouTile[] {
  const tiles: ForYouTile[] = [];
  if (d.forYou.length)
    tiles.push({
      id: "artists",
      value: `${d.forYou.length}`,
      label: "artists to meet",
      hint: "Matched to your genres",
      to: "/",
    });
  if (d.studios.length)
    tiles.push({
      id: "studios",
      value: `${Math.min(d.studios.length, 4)}`,
      label: "studios nearby",
      hint: "Available this week",
      to: "/studio",
    });
  return tiles;
}

/** Home's opportunity counts, derived the way /opportunities derives them. */
export function opportunityTiles(): ForYouTile[] {
  const open = opportunities
    .filter((o) => o.status === "open")
    .sort((a, b) => b.matchScore - a.matchScore);
  const active = myApplications.filter((a) => a.status !== "rejected" && a.status !== "withdrawn");
  const shortlisted = myApplications.filter((a) => a.status === "shortlisted").length;
  return [
    {
      id: "matching",
      value: `${open.length}`,
      label: "Matching you",
      hint: open
        .slice(0, 3)
        .map((o) => categoryLabel(o.categoryKey))
        .join(", "),
      to: "/opportunities",
    },
    {
      id: "applications",
      value: `${active.length}`,
      label: "Your applications",
      hint: `${shortlisted} shortlisted`,
      to: "/opportunities/applications",
    },
  ];
}
