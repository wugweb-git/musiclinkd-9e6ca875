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
 * Schema: supabase/migrations/20260918230000_section_sources.sql; the 'global' scope (/search, every
 * kind of result at once) is 20260921170000_search.sql — until that is applied a 'global' read is
 * simply empty and a 'global' save is refused.
 */

const db = (client: unknown) => client as unknown as SupabaseClient;

export type SearchScope = "market" | "rent" | "discover" | "global";
export type SavedSearchScope = "market" | "rent" | "global";

export type SavedSearch = {
  id: string;
  scope: SavedSearchScope;
  query: string;
  createdAt: string;
};

/**
 * `searched` says whether the list is what people searched for, or — until enough searches have
 * been run — what's most listed, so a heading can say which.
 */
export type PopularSearches = { items: string[]; searched: boolean };

/** The most-run searches in one scope over the last 30 days, optionally in one Market city. */
export const popularSearches = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        scope: z.enum(["market", "rent", "discover", "global"]),
        city: z.string().min(1).max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<PopularSearches> => {
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
    const run = error ? [] : (rows ?? []).map((r) => r.query);
    if (run.length >= 6) return { items: run, searched: true };
    // Until enough searches have been run, what people can find stands in: the kinds of item
    // with the most live listings (Market, Rent), the genres most profiles work in (Discover), or
    // both together (everywhere at once).
    const fill = await mostListed(client as unknown as SupabaseClient, data.scope);
    const seen = new Set(run.map((q) => q.toLowerCase()));
    return {
      items: [...run, ...fill.filter((q) => !seen.has(q.toLowerCase()))].slice(0, 8),
      searched: false,
    };
  });

async function mostListed(client: SupabaseClient, scope: SearchScope): Promise<string[]> {
  const counts = new Map<string, { key: string; n: number }>();
  const bump = (key: string, slug: string) => {
    const id = `${key}:${slug}`;
    counts.set(id, { key, n: (counts.get(id)?.n ?? 0) + 1 });
  };
  if (scope === "discover" || scope === "global") {
    const { data } = await client.from("profiles").select("genres").eq("visibility", "public");
    for (const p of (data ?? []) as { genres: string[] | null }[])
      for (const g of p.genres ?? []) bump("genres", g);
  }
  if (scope !== "discover") {
    let listings = client.from("marketplace_listings").select("item_category, item_category_kind");
    if (scope !== "global")
      listings = listings.eq("category", scope === "rent" ? "gear_rental" : "gear_sale");
    const { data } = await listings;
    for (const l of (data ?? []) as {
      item_category: string | null;
      item_category_kind: string | null;
    }[])
      if (l.item_category)
        bump(
          l.item_category_kind === "instrument" ? "instruments" : "equipment_categories",
          l.item_category,
        );
  }
  const top = [...counts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8);
  if (!top.length) return [];
  const { data: options } = await client
    .from("taxonomy_options")
    .select("category_key, slug, label")
    .in(
      "slug",
      top.map(([id]) => id.split(":")[1]!),
    );
  const label = new Map(
    ((options ?? []) as { category_key: string; slug: string; label: string }[]).map((o) => [
      `${o.category_key}:${o.slug}`,
      o.label,
    ]),
  );
  return top.map(([id]) => label.get(id)).filter((l): l is string => Boolean(l));
}

/** This account's saved searches in one scope, newest first. */
export const listMySavedSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ scope: z.enum(["market", "rent", "global"]) }).parse(d))
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
        scope: z.enum(["market", "rent", "global"]),
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
