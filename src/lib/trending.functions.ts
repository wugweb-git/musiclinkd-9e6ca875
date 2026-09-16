import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Trending portfolio work: most plays in the last 7 days, counted by the database
 * (supabase/migrations/20260917100200_portfolio_plays_trending.sql), never by the client.
 */

export type TrendingItem = {
  id: string;
  title: string;
  kind: string;
  cover_url: string | null;
  media_url: string | null;
  plays: number;
  display_name: string | null;
  username: string | null;
};

export const listTrendingWork = createServerFn({ method: "GET" }).handler(async () => {
  const client = (await anonClient()) as unknown as SupabaseClient;
  const { data, error } = await client.rpc("trending_portfolio_items", { days: 7, lim: 10 });
  if (error) throw new Error(error.message);
  return ((data ?? []) as TrendingItem[]).map((r) => ({ ...r, plays: Number(r.plays) }));
});
