import { useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { rememberSearch, type SearchScope } from "@/lib/device-history";

/*
 * A search counts once the person stops typing: the words are remembered on this device (Recent
 * searches) and recorded as one search_events row (Popular searches). The row carries only the
 * words, the scope and the Market city; the database fills in who. Recording never throws — a
 * missing table or a dropped connection must not touch the search itself.
 * Schema: supabase/migrations/20260918230000_section_sources.sql
 */

/** How long the query has to sit still before it counts as a search rather than typing. */
const SETTLE_MS = 1200;

function recordSearchEvent(scope: SearchScope, query: string, city?: string) {
  // search_events is not in the generated types yet.
  const client = supabase as unknown as SupabaseClient;
  void Promise.resolve(
    client.from("search_events").insert({ scope, query, ...(city ? { city } : {}) }),
  ).catch(() => {});
}

/**
 * Remember and record a search once `query` has settled. Each distinct query counts once per
 * screen visit; `results` is what it found when it settled.
 */
export function useSearchRecorder(
  scope: SearchScope,
  query: string,
  results: number,
  city?: string,
) {
  const counted = useRef(new Set<string>());
  const latest = useRef(results);
  useEffect(() => {
    latest.current = results;
  }, [results]);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      const key = q.toLowerCase();
      if (counted.current.has(key)) return;
      counted.current.add(key);
      rememberSearch(q, latest.current, scope);
      recordSearchEvent(scope, q, city);
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [scope, query, city]);
}
