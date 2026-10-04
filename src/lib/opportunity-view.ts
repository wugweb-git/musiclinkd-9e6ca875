// Shapes stored opportunities for the opportunity screens, next to the static demo opportunities.
// Only stored fields are filled; everything the table does not hold stays empty and the screens
// skip it.

import {
  opportunityCategories,
  type Opportunity,
  type PostedOpportunity,
} from "@/data/opportunities";
import {
  getOpportunityRow,
  listMyOpportunities,
  listOpportunities,
  taxonomyLabel,
  type OpportunityRow,
} from "@/lib/catalog.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";

/**
 * A single role that names an existing person category ("Guitarist", "Singer") uses that category.
 * Roles are single names (no "/", 15 Sep 2026). Several roles, or a role with no matching category,
 * is a collaborator request.
 */
function categoryFromRole(role: string | null): Pick<Opportunity, "categoryKey" | "kind"> {
  if (role && !role.includes(",")) {
    const name = role.trim().toLowerCase();
    const match = opportunityCategories.find(
      (c) => c.kind === "Person" && c.label.toLowerCase() === name,
    );
    if (match) return { categoryKey: match.key, kind: match.kind };
  }
  return { categoryKey: "collab", kind: "Collaborator" };
}

function compensationFromRow(row: OpportunityRow): Opportunity["compensation"] {
  const note = row.budget_note ? { note: row.budget_note } : {};
  if (row.budget_paise != null) {
    return {
      type: "Paid",
      min: row.budget_paise / 100,
      unit: row.budget_unit ? row.budget_unit.toLowerCase() : "",
      negotiable: false,
      ...note,
    };
  }
  // A co-write is paid in the song itself; its stored note ("Co-Write", "Under Discussion") shows
  // when there is one.
  const type: Opportunity["compensation"]["type"] =
    row.collaboration_type === "royalties_split"
      ? "Revenue share"
      : row.collaboration_type === "co_write"
        ? "Co-write"
        : row.collaboration_type === "session_payment" || row.collaboration_type === "work_for_hire"
          ? "Paid"
          : undefined;
  return { ...(type ? { type } : {}), unit: "", negotiable: false, ...note };
}

export function opportunityFromRow(row: OpportunityRow, labels: TaxonomyLabels): Opportunity {
  const creator = row.creator;
  return {
    id: row.slug,
    title: row.title,
    ...categoryFromRole(row.role_required),
    status: row.status,
    poster: {
      id: creator?.username ?? "",
      name: creator?.display_name ?? creator?.username ?? "",
      username: creator?.username ?? "",
      photo: creator?.avatar_url ?? "",
      kindLabel: "",
      verified: creator?.is_verified ?? false,
      rating: 0,
      hires: 0,
    },
    city: row.location ?? "",
    workMode:
      row.work_mode === "On-site" || row.work_mode === "Remote" || row.work_mode === "Hybrid"
        ? row.work_mode
        : "",
    // The stored timestamp; the card formats it. Never "3 weeks ago" in the data.
    postedAt: row.created_at,
    closesAt: "",
    compensation: compensationFromRow(row),
    summary: row.summary ?? "",
    brief: [],
    requirements: (row.requirements?.length
      ? row.requirements
      : (row.role_required ?? "").split(",")
    )
      .map((r) => r.trim())
      .filter(Boolean)
      .map((label) => ({ label, must: true })),
    genres: row.genres.map((g) => taxonomyLabel(labels, "genres", g)),
    genreKeys: row.genres,
    collaborationType: row.collaboration_type,
    languages: [],
    dates: row.date_window ?? "",
    applicants: row.applicant_count,
    views: 0,
    saved: false,
    matchScore: 0,
    matchReasons: [],
  };
}

/** Open stored opportunities, newest first. Empty when the database is unreachable. */
export async function loadDbOpportunities(): Promise<Opportunity[]> {
  const [rows, labels] = await Promise.all([
    listOpportunities().catch((): OpportunityRow[] => []),
    // Without labels the genre chips fall back to slugs.
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return rows.map((r) => opportunityFromRow(r, labels));
}

/** One stored opportunity by slug, or null when there is none or the database is unreachable. */
export async function loadDbOpportunity(slug: string): Promise<Opportunity | null> {
  const [row, labels] = await Promise.all([
    getOpportunityRow({ data: { slug } }).catch(() => null),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return row ? opportunityFromRow(row, labels) : null;
}

/**
 * The signed-in user's stored opportunities, every status, newest first. They carry no
 * applicantSummary: there is no application tracking behind them. Empty when unreachable.
 */
export async function loadMyDbOpportunities(): Promise<PostedOpportunity[]> {
  const [rows, labels] = await Promise.all([
    listMyOpportunities().catch((): OpportunityRow[] => []),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return rows.map((r) => opportunityFromRow(r, labels));
}

export type OpportunityViewSource =
  "discover" | "search" | "profile" | "opportunities" | "direct" | "other";

/**
 * Which screen an opportunity was opened from, for "Where views come from". `previous` is the
 * in-app path behind the opportunity (usePreviousPath); none means it was opened directly.
 */
export function opportunityViewSource(previous: string | null): OpportunityViewSource {
  if (!previous) return "direct";
  if (previous.startsWith("/search") || previous.startsWith("/opportunities/search"))
    return "search";
  if (previous === "/" || previous.startsWith("/discover") || previous.startsWith("/home"))
    return "discover";
  if (
    previous.startsWith("/profile") ||
    previous.startsWith("/business/") ||
    previous.startsWith("/bands/")
  )
    return "profile";
  if (previous.startsWith("/opportunities")) return "opportunities";
  return "other";
}
