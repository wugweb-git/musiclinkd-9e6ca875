import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const sent = new Set<string>();

/**
 * Count one play of a portfolio item toward Trending. The database decides what counts: signed-in
 * viewers only, never the owner, once per 30 minutes. This page load sends each item once.
 */
export function recordPlay(itemId: string) {
  if (sent.has(itemId)) return;
  sent.add(itemId);
  // record_portfolio_play is not in the generated types yet.
  const client = supabase as unknown as SupabaseClient;
  void Promise.resolve(client.rpc("record_portfolio_play", { item: itemId })).catch(() => {
    sent.delete(itemId);
  });
}
