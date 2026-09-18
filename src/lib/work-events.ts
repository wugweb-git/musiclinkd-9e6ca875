import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type WorkEventKind = "view" | "share" | "profile_click" | "link_click";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const viewed = new Set<string>();

/**
 * Count one thing that happened to a portfolio work, for its owner's Performance figures: seen on
 * a profile or in Discover, shared, or followed to its owner's profile or its media link. The
 * database decides what counts — published works only, never the owner's own looks (a share
 * counts whoever sends it). A view is sent once per page load. Never throws.
 * Schema: supabase/migrations/20260918230000_section_sources.sql
 */
export function recordWorkEvent(itemId: string, kind: WorkEventKind) {
  // Works that are not stored rows have no events to count.
  if (!UUID.test(itemId)) return;
  if (kind === "view") {
    if (viewed.has(itemId)) return;
    viewed.add(itemId);
  }
  // portfolio_item_events is not in the generated types yet.
  const client = supabase as unknown as SupabaseClient;
  void Promise.resolve(
    client.from("portfolio_item_events").insert({ item_id: itemId, kind }),
  ).catch(() => {});
}
