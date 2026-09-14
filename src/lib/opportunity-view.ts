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

/** "5 hours ago", "1 day ago" — the format the static opportunities use. */
function postedAgo(iso: string, now: number): string {
  const minutes = Math.max(1, Math.floor((now - new Date(iso).getTime()) / 60000));
  const [n, unit] =
    minutes < 60
      ? [minutes, "minute"]
      : minutes < 60 * 24
        ? [Math.floor(minutes / 60), "hour"]
        : [Math.floor(minutes / (60 * 24)), "day"];
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

/**
 * A single role that names an existing person category ("Guitarist", "Singer / Vocalist") uses
 * that category. Several roles, or a role with no matching category, is a collaborator request.
 */
function categoryFromRole(role: string | null): Pick<Opportunity, "categoryKey" | "kind"> {
  if (role && !role.includes(",")) {
    const parts = role.split("/").map((p) => p.trim().toLowerCase());
    const match = opportunityCategories.find(
      (c) => c.kind === "Person" && parts.includes(c.label.toLowerCase()),
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
      unit: row.budget_unit ? `per ${row.budget_unit.toLowerCase()}` : "",
      negotiable: false,
      ...note,
    };
  }
  // Co-writes carry no type: neither revenue share nor unpaid is certain. The note shows instead.
  const type: Opportunity["compensation"]["type"] =
    row.collaboration_type === "royalties_split"
      ? "Revenue share"
      : row.collaboration_type === "session_payment" || row.collaboration_type === "work_for_hire"
        ? "Paid"
        : undefined;
  return { ...(type ? { type } : {}), unit: "", negotiable: false, ...note };
}

export function opportunityFromRow(
  row: OpportunityRow,
  labels: TaxonomyLabels,
  now = Date.now(),
): Opportunity {
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
    workMode: "",
    postedAt: postedAgo(row.created_at, now),
    closesAt: "",
    compensation: compensationFromRow(row),
    summary: "",
    brief: [],
    requirements: (row.role_required ?? "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
      .map((label) => ({ label, must: true })),
    genres: row.genres.map((g) => taxonomyLabel(labels, "genres", g)),
    languages: [],
    dates: "",
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
  const now = Date.now();
  return rows.map((r) => opportunityFromRow(r, labels, now));
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
  const now = Date.now();
  return rows.map((r) => opportunityFromRow(r, labels, now));
}
