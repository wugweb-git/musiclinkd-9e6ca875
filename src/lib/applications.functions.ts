import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Applying to an opportunity, and posting one.
 *
 * One application per person per opportunity. The poster reads every application to their own
 * opportunity and moves it along; the applicant reads and withdraws their own. The applicant count
 * every list shows is kept by a trigger, not by the screens.
 * Schema: supabase/migrations/20260917160000_applications.sql
 */

/** The generated types cover two tables; every other table is read through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected" | "withdrawn";

export type ApplicantSummary = {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  portfolio_item_ids: string[];
  person: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    city: string | null;
    is_verified: boolean;
  } | null;
};

export type MyApplication = {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  opportunity: {
    id: string;
    slug: string;
    title: string;
    location: string | null;
    status: string;
  } | null;
};

const PERSON = "id, username, display_name, avatar_url, headline, city, is_verified";

/**
 * Screens address an opportunity by its slug (a seed opportunity has no row at all), so every call
 * here takes the slug and finds the row. A slug with no row cannot be applied to.
 */
async function opportunityIdFor(client: SupabaseClient, slug: string) {
  const { data, error } = await client
    .from("opportunities")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as { id: string } | null;
  if (!row) throw new Error("That opportunity is not open for applications.");
  return row.id;
}

/** Send an application. A second one for the same opportunity updates the first. */
export const applyToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(1).max(120),
        message: z.string().max(2000).optional(),
        portfolioItemIds: z.array(z.string().uuid()).max(12).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const opportunityId = await opportunityIdFor(client, data.slug);
    const { error } = await client.from("opportunity_applications").upsert(
      {
        opportunity_id: opportunityId,
        applicant_profile_id: context.userId,
        message: data.message ?? null,
        portfolio_item_ids: data.portfolioItemIds ?? [],
        status: "pending",
      } as never,
      { onConflict: "opportunity_id,applicant_profile_id" },
    );
    if (error) throw new Error(error.message);
    return { applied: true };
  });

/** Where this account stands with one opportunity, for the Apply button. */
export const myApplicationTo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ context, data }): Promise<{ status: ApplicationStatus | null }> => {
    const client = db(context.supabase);
    const { data: opportunity } = await client
      .from("opportunities")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    const opportunityId = (opportunity as { id: string } | null)?.id;
    if (!opportunityId) return { status: null };
    const { data: row, error } = await client
      .from("opportunity_applications")
      .select("status")
      .eq("opportunity_id", opportunityId)
      .eq("applicant_profile_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { status: (row as { status: ApplicationStatus } | null)?.status ?? null };
  });

/** Everything this account has applied to, newest first. */
export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyApplication[]> => {
    const { data, error } = await db(context.supabase)
      .from("opportunity_applications")
      .select(
        "id, status, message, created_at, opportunity:opportunities(id, slug, title, location, status)",
      )
      .eq("applicant_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MyApplication[];
  });

/** The applications to one of this account's own opportunities. */
export const listApplicants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ context, data }): Promise<ApplicantSummary[]> => {
    const client = db(context.supabase);
    const opportunityId = await opportunityIdFor(client, data.slug);
    const { data: rows, error } = await client
      .from("opportunity_applications")
      .select(
        `id, status, message, created_at, portfolio_item_ids, person:profiles!opportunity_applications_applicant_profile_id_fkey(${PERSON})`,
      )
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ApplicantSummary[];
  });

/** The poster moves an application along: shortlisted, accepted, rejected. */
export const setApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "shortlisted", "accepted", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("opportunity_applications")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { status: data.status };
  });

/** The applicant pulls out. The row stays, so the poster sees what happened. */
export const withdrawApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ context, data }) => {
    const client = db(context.supabase);
    const opportunityId = await opportunityIdFor(client, data.slug);
    const { error } = await client
      .from("opportunity_applications")
      .update({ status: "withdrawn" } as never)
      .eq("opportunity_id", opportunityId)
      .eq("applicant_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { status: "withdrawn" as const };
  });

/** A URL-safe slug from the title, with a short suffix so two posts can share a title. */
function slugFor(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "opportunity"}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Post an opportunity, or save it as a draft only the poster can see. */
export const createOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        title: z.string().trim().min(3).max(140),
        roleRequired: z.string().max(80).optional(),
        genres: z.array(z.string().max(60)).max(12).optional(),
        budgetPaise: z.number().int().min(0).optional(),
        budgetUnit: z.string().max(24).optional(),
        budgetNote: z.string().max(200).optional(),
        collaborationType: z.string().max(60).optional(),
        location: z.string().max(120).optional(),
        status: z.enum(["draft", "open"]).default("open"),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await db(context.supabase)
      .from("opportunities")
      .insert({
        creator_profile_id: context.userId,
        slug: slugFor(data.title),
        title: data.title,
        role_required: data.roleRequired ?? null,
        genres: data.genres ?? [],
        budget_paise: data.budgetPaise ?? null,
        budget_unit: data.budgetUnit ?? null,
        budget_note: data.budgetNote ?? null,
        collaboration_type: data.collaborationType ?? null,
        location: data.location ?? null,
        status: data.status,
      } as never)
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string; slug: string };
  });
