import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Searches people ran and searches they kept. Every search is recorded as a search_events row
 * (src/lib/search-events.ts writes them from the browser); what comes back out is only the
 * aggregate — the most-run searches per scope — never anyone's own rows. Saved searches are
 * owner-only. Both fail soft: before the tables exist every read here is empty.
 * Schema: supabase/migrations/20260918230000_section_sources.sql
 */

const db = (client: unknown) => client as unknown as SupabaseClient;

export type SearchScope = "market" | "rent" | "discover";
export type SavedSearchScope = "market" | "rent";

export type SavedSearch = {
  id: string;
  scope: SavedSearchScope;
  query: string;
  createdAt: string;
};

/** The most-run searches in one scope over the last 30 days, optionally in one Market city. */
export const popularSearches = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        scope: z.enum(["market", "rent", "discover"]),
        city: z.string().min(1).max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<string[]> => {
    const client = await anonClient();
    const rpc = client.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: { query: string }[] | null; error: { message: string } | null }>;
    const { data: rows, error } = await rpc.call(client, "popular_searches", {
      p_scope: data.scope,
      p_city: data.city ?? null,
      lim: 8,
    });
    if (error) return [];
    return (rows ?? []).map((r) => r.query);
  });

/** This account's saved searches in one scope, newest first. */
export const listMySavedSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ scope: z.enum(["market", "rent"]) }).parse(d))
  .handler(async ({ context, data }): Promise<SavedSearch[]> => {
    const { data: rows, error } = await db(context.supabase)
      .from("saved_searches")
      .select("id, scope, query, created_at")
      .eq("profile_id", context.userId)
      .eq("scope", data.scope)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (
      (rows ?? []) as { id: string; scope: SavedSearchScope; query: string; created_at: string }[]
    ).map((r) => ({ id: r.id, scope: r.scope, query: r.query, createdAt: r.created_at }));
  });

/** Keep a search. Saving the same words again changes nothing. */
export const saveSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        scope: z.enum(["market", "rent"]),
        query: z.string().trim().min(1).max(80),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await db(context.supabase)
      .from("saved_searches")
      .upsert({ profile_id: context.userId, scope: data.scope, query: data.query } as never, {
        onConflict: "profile_id,scope,query",
        ignoreDuplicates: true,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeSavedSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await db(context.supabase)
      .from("saved_searches")
      .delete()
      .eq("id", data.id)
      .eq("profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
