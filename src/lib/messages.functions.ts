import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Messages: a conversation between two people, and what they said in it. Anyone signed in can
 * write to a profile they can see; membership decides who reads a thread.
 * Schema: supabase/migrations/20260917140000_messages.sql
 */

/** The generated types cover two tables; every other table is read through the plain client. */
const db = (client: unknown) => client as unknown as SupabaseClient;

export type MessagePerson = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
};

export type ConversationSummary = {
  id: string;
  person: MessagePerson | null;
  lastMessage: string | null;
  lastMessageAt: string;
  /** The last line was this account's own ("You: …"). */
  lastMine: boolean;
  /** Messages from the other person since this account last opened the thread. */
  unread: number;
};

export type Message = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  mine: boolean;
};

const PERSON = "id, username, display_name, avatar_url, headline";

/** The service a thread started from: the latest enquiry about one that opened this conversation. */
export type ThreadService = {
  id: string;
  name: string;
  price_paise: number | null;
  price_unit: string | null;
  price_note: string | null;
};

/** Every conversation this account is in, newest first, with the other person and the last line. */
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConversationSummary[]> => {
    const client = db(context.supabase);
    const { data, error } = await client
      .from("conversations")
      .select(
        `id, last_message_at,
         members:conversation_members(profile_id, last_read_at, profile:profiles(${PERSON})),
         messages(id, body, created_at, sender_id)`,
      )
      .order("last_message_at", { ascending: false });
    if (error) throw new Error(error.message);
    type Row = {
      id: string;
      last_message_at: string;
      members: { profile_id: string; last_read_at: string | null; profile: MessagePerson | null }[];
      messages: { id: string; body: string; created_at: string; sender_id: string }[];
    };
    return ((data ?? []) as unknown as Row[]).map((row) => {
      const mine = row.members.find((m) => m.profile_id === context.userId);
      const other = row.members.find((m) => m.profile_id !== context.userId);
      const ordered = [...row.messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const last = ordered[ordered.length - 1];
      const since = mine?.last_read_at;
      return {
        id: row.id,
        person: other?.profile ?? null,
        lastMessage: last?.body ?? null,
        lastMessageAt: row.last_message_at,
        lastMine: last?.sender_id === context.userId,
        unread: ordered.filter(
          (m) => m.sender_id !== context.userId && (!since || m.created_at > since),
        ).length,
      };
    });
  });

/** Messages per page; older ones load as the reader scrolls up. */
const PAGE = 50;

/**
 * One thread: the other person and the newest page of messages, oldest first. `before` reads the
 * page older than that timestamp. Opening the newest page marks the thread read.
 */
export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ id: z.string().uuid(), before: z.string().datetime({ offset: true }).optional() })
      .parse(d),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      person: MessagePerson | null;
      service: ThreadService | null;
      messages: Message[];
      hasMore: boolean;
    }> => {
      const client = db(context.supabase);
      let page = client
        .from("messages")
        .select("id, body, created_at, sender_id")
        .eq("conversation_id", data.id)
        .order("created_at", { ascending: false })
        .limit(PAGE + 1);
      if (data.before) page = page.lt("created_at", data.before);
      const [members, messages, enquiry] = await Promise.all([
        client
          .from("conversation_members")
          .select(`profile_id, profile:profiles(${PERSON})`)
          .eq("conversation_id", data.id),
        page,
        // Only on the first page. Errors (the columns arrive with 20261004220000) mean no block.
        data.before
          ? null
          : client
              .from("enquiries")
              .select("service:profile_services(id, name, price_paise, price_unit, price_note)")
              .eq("conversation_id", data.id)
              .not("service_id", "is", null)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
      ]);
      if (members.error) throw new Error(members.error.message);
      if (messages.error) throw new Error(messages.error.message);
      const other = (
        (members.data ?? []) as unknown as { profile_id: string; profile: MessagePerson | null }[]
      ).find((m) => m.profile_id !== context.userId);
      if (!data.before) {
        await client
          .from("conversation_members")
          .update({ last_read_at: new Date().toISOString() } as never)
          .eq("conversation_id", data.id)
          .eq("profile_id", context.userId);
      }
      const rows = (messages.data ?? []) as unknown as Omit<Message, "mine">[];
      const hasMore = rows.length > PAGE;
      return {
        person: other?.profile ?? null,
        service:
          enquiry && !enquiry.error
            ? ((enquiry.data as unknown as { service: ThreadService | null } | null)?.service ??
              null)
            : null,
        hasMore,
        messages: rows
          .slice(0, PAGE)
          .reverse()
          .map((m) => ({ ...m, mine: m.sender_id === context.userId })),
      };
    },
  );

/** The conversation with one person, started if this is the first message. */
export const conversationWith = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    // Settings > Privacy > "Who can message you" (discovery_prefs.who_can_message): Nobody closes
    // new conversations, Connections needs an accepted connection. Anyone is the default.
    const { data: other } = await db(context.supabase)
      .from("profiles")
      .select("discovery_prefs")
      .eq("id", data.profileId)
      .maybeSingle();
    const who = (other as { discovery_prefs?: { who_can_message?: string } | null } | null)
      ?.discovery_prefs?.who_can_message;
    if (who === "nobody") throw new Error("This person isn't taking messages.");
    if (who === "connections") {
      const { data: link } = await db(context.supabase)
        .from("connections")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(requester_id.eq.${context.userId},addressee_id.eq.${data.profileId}),and(requester_id.eq.${data.profileId},addressee_id.eq.${context.userId})`,
        )
        .limit(1);
      if (!link?.length) throw new Error("Only their connections can message this person.");
    }
    // One call: the members-only policies leave no moment when a half-built conversation is
    // readable, so creating it and adding both people happens in the database.
    const { data: id, error } = await db(context.supabase).rpc("start_conversation", {
      p_other_profile_id: data.profileId,
    });
    if (error) throw new Error(error.message);
    return { id: id as string };
  });

/** Say something. The trigger moves the conversation to the top of both people's lists. */
export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ conversationId: z.string().uuid(), body: z.string().trim().min(1).max(4000) })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        sender_id: context.userId,
        body: data.body,
      } as never);
    if (error) throw new Error(error.message);
    return { sent: true };
  });
