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

export type EnquiryStatus = "new" | "replied" | "booked" | "closed";

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

/** Ask a business about a room, mixing, a live date, or something else. */
export const sendEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        businessProfileId: z.string().uuid(),
        intent: z.string().trim().min(1).max(60),
        message: z.string().trim().min(8).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string; conversationId: string | null }> => {
    const { data: row, error } = await db(context.supabase)
      .from("enquiries")
      .insert({
        business_profile_id: data.businessProfileId,
        sender_profile_id: context.userId,
        intent: data.intent,
        message: data.message,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // The enquiry also opens (or continues) the conversation with the business, so both sides
    // carry on in Messages. The lead is already saved if this part fails.
    let conversationId: string | null = null;
    const { data: convo } = await db(context.supabase).rpc("start_conversation", {
      p_other_profile_id: data.businessProfileId,
    });
    if (typeof convo === "string") {
      const { error: messageError } = await db(context.supabase)
        .from("messages")
        .insert({
          conversation_id: convo,
          sender_id: context.userId,
          body: `${data.intent}\n\n${data.message}`,
        } as never);
      if (!messageError) conversationId = convo;
    }
    return { id: (row as { id: string }).id, conversationId };
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

/** The business moves a lead along: replied, booked or closed. */
export const setLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["replied", "booked", "closed"]) }).parse(d),
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
