import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * What feeds a business's Leads inbox. One record both sides read: the sender's own enquiry
 * history, and the business's own queue — not two disconnected screens.
 * Schema: supabase/migrations/20260918200000_enquiries.sql.
 */

const db = (client: unknown) => client as unknown as SupabaseClient;

/** Enquiry (conversation) state; `booked` removed 4 Oct 2026 (queue item 10). */
export type EnquiryStatus = "new" | "replied" | "closed";

export type EnquiryRow = {
  id: string;
  intent: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
  sender: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

const SELECT = `id, intent, message, status, created_at,
  sender:profiles!enquiries_sender_profile_id_fkey(id, username, display_name, avatar_url)`;

/**
 * Who answers for a service: the person who offers it, or for a band's service the band's owner —
 * always its first person (owner, 4 Oct 2026), as booking requests do (20261004180000).
 */
async function serviceOwner(client: SupabaseClient, serviceId: string): Promise<string | null> {
  // "*" so this reads the same before and after collab_id exists.
  const { data, error } = await client
    .from("profile_services")
    .select("*")
    .eq("id", serviceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const service = data as { profile_id: string | null; collab_id?: string | null } | null;
  if (!service) return null;
  if (service.profile_id) return service.profile_id;
  if (!service.collab_id) return null;
  const { data: owner } = await client
    .from("collab_members")
    .select("profile_id")
    .eq("collab_id", service.collab_id)
    .eq("role", "owner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return (owner as { profile_id: string } | null)?.profile_id ?? null;
}

/** Ask a business about a room, mixing, a live date, or something else. */
export const sendEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        // Optional when the enquiry is about a service: the server sends it to the service's owner.
        businessProfileId: z.string().uuid().optional(),
        intent: z.string().trim().min(1).max(60),
        message: z.string().trim().min(8).max(2000),
        // The service asked about, when the enquiry starts on one; its thread then opens with it.
        serviceId: z.string().uuid().optional(),
      })
      .refine((d) => d.businessProfileId || d.serviceId, "Say who the enquiry is for")
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string; conversationId: string | null }> => {
    const recipient = data.serviceId
      ? await serviceOwner(db(context.supabase), data.serviceId)
      : (data.businessProfileId ?? null);
    if (!recipient) throw new Error("This service isn't taking enquiries.");
    // The enquiry also opens (or continues) the conversation with the business, so both sides
    // carry on in Messages. Opened first so the enquiry can point at it; the lead is still saved
    // if this part fails.
    const { data: convo, error: convoError } = await db(context.supabase).rpc(
      "start_conversation",
      {
        p_other_profile_id: recipient,
      },
    );
    if (convoError) console.error("enquiry: start_conversation failed", convoError.message);
    const conversation = typeof convo === "string" ? convo : null;

    const row = {
      business_profile_id: recipient,
      sender_profile_id: context.userId,
      intent: data.intent,
      message: data.message,
    };
    // service_id / conversation_id arrive with 20261004220000_enquiry_service_link.sql; until it
    // is applied the insert without them still saves the lead.
    let insert = await db(context.supabase)
      .from("enquiries")
      .insert({
        ...row,
        ...(data.serviceId ? { service_id: data.serviceId } : {}),
        ...(conversation ? { conversation_id: conversation } : {}),
      } as never)
      .select("id")
      .single();
    if (insert.error && /service_id|conversation_id/.test(insert.error.message)) {
      insert = await db(context.supabase)
        .from("enquiries")
        .insert(row as never)
        .select("id")
        .single();
    }
    if (insert.error) throw new Error(insert.error.message);

    let conversationId: string | null = null;
    if (conversation) {
      const { error: messageError } = await db(context.supabase)
        .from("messages")
        .insert({
          conversation_id: conversation,
          sender_id: context.userId,
          body: `${data.intent}\n\n${data.message}`,
        } as never);
      if (!messageError) conversationId = conversation;
    }
    return { id: (insert.data as { id: string }).id, conversationId };
  });

/** The signed-in business's own leads inbox, newest first. */
export const listMyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EnquiryRow[]> => {
    const { data, error } = await db(context.supabase)
      .from("enquiries")
      .select(SELECT)
      .eq("business_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as EnquiryRow[];
  });

/** The provider moves an enquiry along: replied or closed. */
export const setLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["replied", "closed"]) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ status: EnquiryStatus }> => {
    const { error } = await db(context.supabase)
      .from("enquiries")
      .update({ status: data.status } as never)
      .eq("id", data.id)
      .eq("business_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { status: data.status };
  });
