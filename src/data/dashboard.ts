import { talents, studios, trending } from "./discover";

export type Stat = {
  key: string;
  label: string;
  value: number;
  hint: string;
  to: "/messages" | "/me" | "/recommended" | "/saved";
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
  user: { firstName: string; role: string; photo: string; profileCompletion: number; available: boolean };
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
    { key: "requests", label: "Connection requests", value: 6, hint: "3 new today", to: "/messages" },
    { key: "messages", label: "Unread messages", value: 3, hint: "Beta", to: "/messages" },
    { key: "views", label: "Profile views", value: 148, hint: "+24 this week", to: "/me" },
    { key: "collabs", label: "Collab opportunities", value: 9, hint: "Matched to you", to: "/recommended" },
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
    { id: "b1", title: "Yash Raj Sound Studios", meta: "Mix session · 11:00–16:00", day: "14", month: "Aug" },
    { id: "b2", title: "Vocal cut with Tanvi Rao", meta: "Krimson Avenue, Bengaluru", day: "19", month: "Aug" },
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
