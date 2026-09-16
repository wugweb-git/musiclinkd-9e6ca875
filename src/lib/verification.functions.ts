import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";
import type { VerificationStatus } from "@/data/verification";

/*
 * Verification: the types a profile can apply for, their requirements, and the owner's requests.
 * A request starts as a draft (unverified); the owner fills one item per requirement (a file in the
 * private verification-documents bucket at <user id>/<request id>/<file>, or typed info; the phone
 * goes to verification_request_private) and submits it (in_review). The database guard checks the
 * roles, the prerequisite and the requirements on submit. Decisions (verified, rejected, expired) are
 * made in the admin panel with the server key, never here.
 * Schema: supabase/migrations/20260915170000_verification.sql.
 */

export const VERIFICATION_BUCKET = "verification-documents";

export type VerificationRequirementInfo = {
  id: string;
  slug: string;
  label: string;
  why: string;
  kind: "document" | "info";
  isOptional: boolean;
  /** Stored in verification_request_private instead of an item. */
  privateField: "phone" | null;
};

export type VerificationTypeInfo = {
  key: string;
  title: string;
  blurb: string;
  verifies: string;
  whatOthersSee: string;
  turnaround: string;
  appliesTo: string;
  /** The type that must be verified first, and the reason shown while it is not. */
  prerequisite: { key: string; reason: string } | null;
  requirements: VerificationRequirementInfo[];
};

export type VerificationItemInfo = {
  id: string;
  requirementId: string;
  kind: "document" | "info";
  state: "uploaded" | "missing" | "rejected";
  filePath: string | null;
  fileName: string | null;
  infoText: string | null;
};

export type VerificationRequestInfo = {
  id: string;
  type: string;
  status: VerificationStatus;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  items: VerificationItemInfo[];
  /** The phone on file for this request (E.164), the owner's own. */
  phone: string | null;
};

/** Every published verification type with its details and requirements, and those these roles fit. */
export const getVerificationTypes = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ roles: z.array(z.string().max(60)).max(12) }).parse(d))
  .handler(async ({ data }): Promise<{ types: VerificationTypeInfo[]; applicable: string[] }> => {
    const client = await anonClient();
    const rpc = client.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    const [options, details, requirements, applicable] = await Promise.all([
      client
        .from("taxonomy_options" as never)
        .select("slug, label, sort_order, metadata")
        .eq("category_key", "verification_types")
        .order("sort_order"),
      client.from("verification_type_details" as never).select("*"),
      client
        .from("verification_requirements" as never)
        .select("id, type_slug, slug, label, why, kind, is_optional, private_field, sort_order")
        .order("sort_order"),
      rpc.call(client, "verification_types_for", { p_roles: data.roles }),
    ]);
    const failed = [options, details, requirements, applicable].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);

    type OptionRow = { slug: string; label: string; metadata: { description?: string } | null };
    type DetailRow = {
      type_slug: string;
      verifies: string;
      what_others_see: string;
      turnaround: string;
      applies_to: string;
      prerequisite_slug: string | null;
      locked_reason: string | null;
    };
    type RequirementRow = {
      id: string;
      type_slug: string;
      slug: string;
      label: string;
      why: string;
      kind: "document" | "info";
      is_optional: boolean;
      private_field: "phone" | null;
    };
    const detailRows = (details.data ?? []) as unknown as DetailRow[];
    const requirementRows = (requirements.data ?? []) as unknown as RequirementRow[];

    const types = ((options.data ?? []) as unknown as OptionRow[]).flatMap(
      (o): VerificationTypeInfo[] => {
        const d = detailRows.find((r) => r.type_slug === o.slug);
        if (!d) return [];
        return [
          {
            key: o.slug,
            title: o.label,
            blurb: o.metadata?.description ?? "",
            verifies: d.verifies,
            whatOthersSee: d.what_others_see,
            turnaround: d.turnaround,
            appliesTo: d.applies_to,
            prerequisite:
              d.prerequisite_slug && d.locked_reason
                ? { key: d.prerequisite_slug, reason: d.locked_reason }
                : null,
            requirements: requirementRows
              .filter((q) => q.type_slug === o.slug)
              .map((q) => ({
                id: q.id,
                slug: q.slug,
                label: q.label,
                why: q.why,
                kind: q.kind,
                isOptional: q.is_optional,
                privateField: q.private_field,
              })),
          },
        ];
      },
    );
    // A set-returning function of text comes back as bare strings; tolerate { slug } rows too.
    const slugs = (applicable.data ?? []).map((r) =>
      typeof r === "string" ? r : String(Object.values(r as Record<string, unknown>)[0]),
    );
    return { types, applicable: slugs.filter((s) => types.some((t) => t.key === s)) };
  });

const REQUEST =
  "id, type_slug, status, created_at, submitted_at, reviewed_at, expires_at, rejection_reason";
const ITEM =
  "id, request_id, requirement_id, kind, state, file_path, file_name, info_text, sort_order";

type RequestRow = {
  id: string;
  type_slug: string;
  status: VerificationStatus;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
};
type ItemRow = {
  id: string;
  request_id: string;
  requirement_id: string;
  kind: "document" | "info";
  state: "uploaded" | "missing" | "rejected";
  file_path: string | null;
  file_name: string | null;
  info_text: string | null;
};

/** The signed-in profile's requests, newest first, with their items and phone. */
export const listMyVerificationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VerificationRequestInfo[]> => {
    const client = context.supabase as unknown as SupabaseClient;
    const [requests, items, privates] = await Promise.all([
      client
        .from("verification_requests")
        .select(REQUEST)
        .eq("profile_id", context.userId)
        .order("created_at", { ascending: false }),
      client
        .from("verification_request_items")
        .select(ITEM)
        .eq("profile_id", context.userId)
        .order("sort_order"),
      client
        .from("verification_request_private")
        .select("request_id, phone")
        .eq("profile_id", context.userId),
    ]);
    const failed = [requests, items, privates].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);

    const itemRows = (items.data ?? []) as ItemRow[];
    const privateRows = (privates.data ?? []) as { request_id: string; phone: string | null }[];
    return ((requests.data ?? []) as RequestRow[]).map((r) => ({
      id: r.id,
      type: r.type_slug,
      status: r.status,
      createdAt: r.created_at,
      submittedAt: r.submitted_at,
      reviewedAt: r.reviewed_at,
      expiresAt: r.expires_at,
      rejectionReason: r.rejection_reason,
      items: itemRows
        .filter((i) => i.request_id === r.id)
        .map((i) => ({
          id: i.id,
          requirementId: i.requirement_id,
          kind: i.kind,
          state: i.state,
          filePath: i.file_path,
          fileName: i.file_name,
          infoText: i.info_text,
        })),
      phone: privateRows.find((p) => p.request_id === r.id)?.phone ?? null,
    }));
  });

/** The files stored in one request's folder. */
async function folderFiles(client: SupabaseClient, userId: string, requestId: string) {
  const folder = `${userId}/${requestId}`;
  const { data, error } = await client.storage
    .from(VERIFICATION_BUCKET)
    .list(folder, { limit: 100 });
  if (error) throw new Error(error.message);
  return (data ?? []).filter((f) => f.id !== null).map((f) => `${folder}/${f.name}`);
}

/** The signed-in profile's open draft of this type, or a new one. */
export const startVerificationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ type: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: draft, error } = await client
      .from("verification_requests")
      .select("id")
      .eq("profile_id", context.userId)
      .eq("type_slug", data.type)
      .eq("status", "unverified")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (draft) return draft as { id: string };

    const { data: row, error: insertError } = await client
      .from("verification_requests")
      .insert({ profile_id: context.userId, type_slug: data.type })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);
    return row as { id: string };
  });

const itemInput = z.object({
  requirementId: z.string().uuid(),
  kind: z.enum(["document", "info"]),
  filePath: z.string().max(400).nullable(),
  fileName: z.string().max(200).nullable(),
  infoText: z.string().trim().max(1000).nullable(),
});

/**
 * Writes a draft's items and phone, removes files no item uses, and submits it for review. The
 * database refuses the submit when the type does not fit, the prerequisite is missing, or a required
 * item is.
 */
export const submitVerificationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        requestId: z.string().uuid(),
        items: z.array(itemInput).max(30),
        phone: z
          .string()
          .regex(/^\+[1-9][0-9]{7,14}$/)
          .nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ status: VerificationStatus }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: request, error } = await client
      .from("verification_requests")
      .select("id, type_slug, status")
      .eq("id", data.requestId)
      .eq("profile_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const draft = request as { id: string; type_slug: string; status: string } | null;
    if (!draft || draft.status !== "unverified") throw new Error("Verification request not found");

    const folder = `${context.userId}/${draft.id}/`;
    if (data.items.some((i) => i.filePath && !i.filePath.startsWith(folder))) {
      throw new Error("A document is not in this request's folder");
    }

    const removed = await client
      .from("verification_request_items")
      .delete()
      .eq("request_id", draft.id);
    if (removed.error) throw new Error(removed.error.message);
    if (data.items.length) {
      const inserted = await client.from("verification_request_items").insert(
        data.items.map((i, n) => ({
          request_id: draft.id,
          profile_id: context.userId,
          type_slug: draft.type_slug,
          requirement_id: i.requirementId,
          kind: i.kind,
          state: "uploaded",
          file_path: i.kind === "document" ? i.filePath : null,
          file_name: i.kind === "document" ? i.fileName : null,
          info_text: i.kind === "info" ? i.infoText || null : null,
          sort_order: n,
        })),
      );
      if (inserted.error) throw new Error(inserted.error.message);
    }

    if (data.phone) {
      const phone = await client
        .from("verification_request_private")
        .upsert(
          { request_id: draft.id, profile_id: context.userId, phone: data.phone },
          { onConflict: "request_id" },
        );
      if (phone.error) throw new Error(phone.error.message);
    }

    // Replaced files: only a draft's files can be removed, so before submitting.
    const kept = new Set(data.items.map((i) => i.filePath).filter(Boolean));
    const stale = (await folderFiles(client, context.userId, draft.id)).filter((p) => !kept.has(p));
    if (stale.length) await client.storage.from(VERIFICATION_BUCKET).remove(stale);

    const { data: submitted, error: submitError } = await client
      .from("verification_requests")
      .update({ status: "in_review" })
      .eq("id", draft.id)
      .eq("profile_id", context.userId)
      .select("status")
      .single();
    if (submitError) throw new Error(submitError.message);
    return submitted as { status: VerificationStatus };
  });

/** Withdraws a draft or a request in review, then deletes its files. */
export const withdrawVerificationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: rows, error } = await client
      .from("verification_requests")
      .delete()
      .eq("id", data.id)
      .eq("profile_id", context.userId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("Verification request not found");

    // Storage lets the owner delete a folder's files once its request no longer exists.
    const files = await folderFiles(client, context.userId, data.id);
    if (files.length) {
      const removed = await client.storage.from(VERIFICATION_BUCKET).remove(files);
      if (removed.error) throw new Error(removed.error.message);
    }
    return { ok: true };
  });

/**
 * A new draft after a rejection, carrying over what was accepted: typed info, documents (copied into
 * the new request's folder; one that cannot be copied is left out) and the phone.
 */
export const resubmitVerificationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ fromId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const [source, items, privateRow] = await Promise.all([
      client
        .from("verification_requests")
        .select("id, type_slug, status")
        .eq("id", data.fromId)
        .eq("profile_id", context.userId)
        .maybeSingle(),
      client
        .from("verification_request_items")
        .select(ITEM)
        .eq("request_id", data.fromId)
        .eq("profile_id", context.userId)
        .order("sort_order"),
      client
        .from("verification_request_private")
        .select("phone, id_type, id_number")
        .eq("request_id", data.fromId)
        .eq("profile_id", context.userId)
        .maybeSingle(),
    ]);
    const failed = [source, items, privateRow].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    const from = source.data as { id: string; type_slug: string; status: string } | null;
    if (!from || from.status !== "rejected") throw new Error("Verification request not found");

    const { data: row, error } = await client
      .from("verification_requests")
      .insert({ profile_id: context.userId, type_slug: from.type_slug })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const id = (row as { id: string }).id;

    const bucket = client.storage.from(VERIFICATION_BUCKET);
    const copies = [];
    for (const item of (items.data ?? []) as ItemRow[]) {
      if (item.state !== "uploaded") continue;
      let filePath: string | null = null;
      if (item.kind === "document") {
        if (!item.file_path) continue;
        const name = item.file_path.split("/").pop();
        const target = `${context.userId}/${id}/${name}`;
        const copied = await bucket.copy(item.file_path, target);
        if (copied.error) continue;
        filePath = target;
      }
      copies.push({
        request_id: id,
        profile_id: context.userId,
        type_slug: from.type_slug,
        requirement_id: item.requirement_id,
        kind: item.kind,
        state: "uploaded",
        file_path: filePath,
        file_name: item.kind === "document" ? item.file_name : null,
        info_text: item.kind === "info" ? item.info_text : null,
        sort_order: copies.length,
      });
    }
    if (copies.length) {
      const inserted = await client.from("verification_request_items").insert(copies);
      if (inserted.error) throw new Error(inserted.error.message);
    }

    const kept = privateRow.data as {
      phone: string | null;
      id_type: string | null;
      id_number: string | null;
    } | null;
    if (kept && (kept.phone || kept.id_type)) {
      const copied = await client
        .from("verification_request_private")
        .insert({ request_id: id, profile_id: context.userId, ...kept });
      if (copied.error) throw new Error(copied.error.message);
    }
    return { id };
  });
