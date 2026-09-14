// What the band screens render, from a static demo band or a stored profile with a line-up or
// shows. A stored band fills only what the database holds; the screens skip empty values. There is
// no formed year, availability, open seat, member photo, member profile, band role, show time,
// show status other than a past date, release or shared portfolio in the database.

import { myBandId, type Band, type BandRelease } from "@/data/band";
import { formatPaise, taxonomyLabel } from "@/lib/catalog.functions";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";
import type { BandRecord } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";

export type BandEventView = {
  id: string;
  title: string;
  place: string;
  date: string;
  status?: "confirmed" | "hold" | "past" | undefined;
  ticketNote?: string | undefined;
};

export type BandView = {
  id: string;
  name: string;
  verified: boolean;
  avatar: string;
  cover: string;
  subtitle: string;
  tagline: string;
  bio: string;
  availability?: Band["availability"] | undefined;
  rate: string;
  lookingFor: string[];
  nextShow: string;
  portfolioCount: number;
  members: {
    key: string;
    name: string;
    photo: string;
    detail: string;
    verified: boolean;
    username?: string | undefined;
    role?: Band["members"][number]["role"] | undefined;
  }[];
  events: BandEventView[];
  releases: BandRelease[];
  owner: boolean;
};

export function bandViewFromStatic(band: Band): BandView {
  return {
    id: band.id,
    name: band.name,
    verified: band.verified,
    avatar: band.avatar,
    cover: band.cover,
    subtitle: `${band.genres.join(" · ")} · ${band.city} · since ${band.formed}`,
    tagline: band.tagline,
    bio: band.bio,
    availability: band.availability,
    rate: band.rate,
    lookingFor: band.lookingFor,
    nextShow: `${band.events[0]?.title ?? "No shows scheduled"} · ${band.events[0]?.date ?? ""}`,
    portfolioCount: band.portfolioItemIds.length,
    members: band.members.map((m) => ({
      key: m.userId,
      name: m.name,
      photo: m.photo,
      detail: `${m.instrument} · since ${m.since}`,
      verified: m.verified,
      username: m.userId,
      role: m.role,
    })),
    events: band.events.map((e) => ({
      id: e.id,
      title: e.title,
      place: `${e.venue} · ${e.city}`,
      date: e.date,
      status: e.status,
      ticketNote: e.ticketNote,
    })),
    releases: band.releases,
    owner: band.id === myBandId,
  };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today as YYYY-MM-DD, to compare with stored event dates. */
function todayIso(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** In the static shows' formats: "Sat 19 Sep" for coming dates, "Feb 2026" for past ones. */
function showDate(iso: string, past: boolean) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  if (past) return `${MONTHS[m - 1]} ${y}`;
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[day]} ${d} ${MONTHS[m - 1]}`;
}

export function bandViewFromRecord(r: BandRecord, labels: TaxonomyLabels): BandView {
  const { profile } = r;
  const today = todayIso();
  const events: BandEventView[] = r.events.map((e) => {
    // Only a date before today is a known status; confirmed or on hold is not stored.
    const past = e.event_date != null && e.event_date < today;
    return {
      id: e.id,
      title: e.title,
      place: e.venue_name ?? "",
      date: e.event_date ? showDate(e.event_date, past) : "",
      status: past ? "past" : undefined,
    };
  });
  const next = events.find((e) => e.status !== "past");
  const genres = (profile.genres ?? []).map((g) => taxonomyLabel(labels, "genres", g));
  return {
    id: profile.username ?? profile.id,
    name: profile.display_name ?? profile.username ?? "",
    verified: profile.is_verified,
    avatar: profile.avatar_url ?? "",
    cover: profile.cover_url ?? "",
    subtitle: joinParts(genres.join(" · "), profile.city),
    tagline: profile.headline ?? "",
    bio: profile.bio ?? "",
    rate: formatPaise(profile.hourly_rate_paise, "hr"),
    lookingFor: [],
    nextShow: `${next?.title ?? "No shows scheduled"} · ${next?.date ?? ""}`,
    portfolioCount: 0,
    members: r.lineup.map((m) => ({
      key: m.id,
      name: m.name,
      photo: "",
      detail: m.role ?? "",
      verified: false,
    })),
    events,
    releases: [],
    owner: false,
  };
}
