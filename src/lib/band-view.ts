// What the band screens render, from a stored band (src/lib/bands.functions.ts). Members are talent
// profiles; their name, photo and badge come from the profile. Empty values are skipped by the
// screens. There is no follower count, invitation or QR code in the database.

import type { Band } from "@/data/band";
import { getBandBySlug, listBands, type BandRow } from "@/lib/bands.functions";
import { taxonomyLabel } from "@/lib/catalog.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { joinParts } from "@/lib/utils";

export type BandEventView = {
  id: string;
  title: string;
  place: string;
  date: string;
  status?: "confirmed" | "hold" | "past" | undefined;
  ticketNote?: string | undefined;
};

export type BandReleaseView = {
  id: string;
  title: string;
  kind: string;
  year: number | null;
  cover: string;
};

export type BandLiveVideoView = {
  id: string;
  title: string;
  url: string;
};

/**
 * A rider line split at its first colon, so "Monitors: 5 wedges" reads as a label and a value.
 * A line without one is all value.
 */
export function riderLine(line: string): { label: string; value: string } {
  const at = line.indexOf(":");
  if (at <= 0) return { label: "", value: line };
  return { label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() };
}

export type BandMemberView = {
  key: string;
  profileId: string;
  name: string;
  photo: string;
  instrument: string;
  detail: string;
  verified: boolean;
  username?: string | undefined;
  role: Band["members"][number]["role"];
};

export type BandView = {
  id: string;
  /** The real bands.id (uuid) — `id` above is the slug, used for routing. */
  dbId: string;
  name: string;
  verified: boolean;
  avatar: string;
  cover: string;
  genres: string[];
  city: string;
  subtitle: string;
  tagline: string;
  bio: string;
  availability?: Band["availability"] | undefined;
  rate: PriceParts | null;
  lookingFor: string[];
  nextShow: string;
  portfolioCount: number;
  members: BandMemberView[];
  events: BandEventView[];
  releases: BandReleaseView[];
  /** Technical rider lines as stored, in order. */
  rider: string[];
  /** The stage plot image and its note; null when the band has not added one. */
  stagePlot: { url: string; note: string } | null;
  liveVideos: BandLiveVideoView[];
  /** The showcase photos, in order. */
  gallery: string[];
  /** The viewer created the band, or is its owner or an admin. */
  owner: boolean;
};

const AVAILABILITY: Record<NonNullable<BandRow["availability"]>, Band["availability"]> = {
  available: "Available",
  selective: "Selective",
  booked: "Booked",
};

const RELEASE_KIND: Record<BandRow["releases"][number]["kind"], string> = {
  single: "Single",
  ep: "EP",
  album: "Album",
  live: "Live",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today as YYYY-MM-DD, to compare with stored event dates. */
function todayIso(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "9:00 PM" from "21:00:00". */
function showTime(time: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) return "";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "Sat 19 Sep · 9:00 PM" for a coming day; "Feb 2026" for a past date or a month. */
function showDate(e: BandRow["events"][number], past: boolean) {
  const [y, m, d] = (e.event_date ?? "").split("-").map(Number);
  if (!y || !m || !d) return "";
  if (past || e.date_precision === "month") return `${MONTHS[m - 1]} ${y}`;
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return joinParts(`${DAYS[day]} ${d} ${MONTHS[m - 1]}`, showTime(e.event_time));
}

function isPast(e: BandRow["events"][number], today: string) {
  if (!e.event_date) return false;
  // A month-only date is past once its month has ended.
  if (e.date_precision === "month") return e.event_date.slice(0, 7) < today.slice(0, 7);
  return e.event_date < today;
}

export function bandViewFromRow(
  row: BandRow,
  labels: TaxonomyLabels,
  viewerId: string | null,
): BandView {
  const today = todayIso();
  const events: BandEventView[] = row.events
    .map((e) => ({ e, past: isPast(e, today) }))
    // Coming shows first, soonest first; then past shows, latest first.
    .sort((a, b) =>
      a.past !== b.past
        ? Number(a.past) - Number(b.past)
        : a.past
          ? (b.e.event_date ?? "").localeCompare(a.e.event_date ?? "")
          : (a.e.event_date ?? "").localeCompare(b.e.event_date ?? ""),
    )
    .map(({ e, past }) => ({
      id: e.id,
      title: e.title,
      place: joinParts(e.venue, e.city),
      date: showDate(e, past),
      status: past ? "past" : (e.status ?? undefined),
      ticketNote: past ? undefined : (e.ticket_note ?? undefined),
    }));
  const next = events.find((e) => e.status !== "past");
  const genres = row.genres.map((g) => taxonomyLabel(labels, "genres", g));
  const members: BandMemberView[] = row.members
    .filter((m) => m.profile)
    .map((m) => ({
      key: m.profile_id,
      profileId: m.profile_id,
      name: m.profile?.display_name ?? m.profile?.username ?? "",
      photo: m.profile?.avatar_url ?? "",
      instrument: m.instrument ?? "",
      detail: joinParts(m.instrument, m.since_year ? `since ${m.since_year}` : ""),
      verified: m.profile?.is_verified ?? false,
      username: m.profile?.username ?? undefined,
      role: m.role,
    }));
  const owner =
    viewerId != null &&
    (row.created_by === viewerId ||
      members.some((m) => m.profileId === viewerId && m.role !== "member"));
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    verified: row.is_verified,
    avatar: row.avatar_url ?? "",
    cover: row.cover_url ?? "",
    genres,
    city: row.city ?? "",
    subtitle: joinParts(
      genres.join(" · "),
      row.city,
      row.formed_year ? `since ${row.formed_year}` : "",
    ),
    tagline: row.tagline ?? "",
    bio: row.bio ?? "",
    availability: row.availability ? AVAILABILITY[row.availability] : undefined,
    rate: priceParts(row.rate_paise, row.rate_unit),
    lookingFor: row.looking_for,
    nextShow: joinParts(next?.title ?? "No shows scheduled", next?.date),
    portfolioCount: row.releases.length,
    members,
    events,
    releases: row.releases.map((r) => ({
      id: r.id,
      title: r.title,
      kind: RELEASE_KIND[r.kind],
      year: r.release_year,
      cover: r.cover_url ?? "",
    })),
    rider: row.rider,
    stagePlot: row.stage_plot_url
      ? { url: row.stage_plot_url, note: row.stage_plot_note ?? "" }
      : null,
    liveVideos: row.live_videos.map((v) => ({ id: v.id, title: v.title, url: v.url })),
    gallery: row.gallery.map((g) => g.image_url),
    owner,
  };
}

/** Loader for one band's screens. A failed read is treated as not found. */
export async function loadBand(slug: string) {
  const [band, labels] = await Promise.all([
    getBandBySlug({ data: { slug } }).catch(() => null),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return { band, labels };
}

/** Loader for band lists. A failed read shows no bands. */
export async function loadBands() {
  const [bands, labels] = await Promise.all([
    listBands().catch((): BandRow[] => []),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return { bands, labels };
}
