import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MAX_SKIPPED, recommendPrefsOf, type RecommendPrefs } from "@/lib/discovery-settings";

/*
 * Reads and writes profiles.discovery_prefs.recommend for the signed-in person
 * (src/lib/discovery-settings.ts). Every write merges into the stored discovery_prefs, so the
 * keys other screens keep there (appear, who_can_message, qr, topics) are never dropped.
 */

async function storedPrefs(client: SupabaseClient, me: string) {
  const { data, error } = await client
    .from("profiles")
    .select("discovery_prefs")
    .eq("id", me)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const prefs = (data as { discovery_prefs?: unknown } | null)?.discovery_prefs;
  return prefs && typeof prefs === "object" && !Array.isArray(prefs)
    ? (prefs as Record<string, unknown>)
    : {};
}

async function writeRecommend(
  client: SupabaseClient,
  me: string,
  change: (current: RecommendPrefs) => RecommendPrefs,
) {
  const all = await storedPrefs(client, me);
  const next = change(recommendPrefsOf(all));
  const { error } = await client
    .from("profiles")
    .update({ discovery_prefs: { ...all, recommend: next } } as never)
    .eq("id", me);
  if (error) throw new Error(error.message);
  return next;
}

export const getMyDiscoverySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RecommendPrefs> => {
    const client = context.supabase as unknown as SupabaseClient;
    return recommendPrefsOf(await storedPrefs(client, context.userId));
  });

const slugs = (max: number) => z.array(z.string().trim().min(1).max(80)).max(max);

export const saveMyDiscoverySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        roles: slugs(20),
        genres: slugs(20),
        cities: slugs(10),
        radius: z.enum(["near", "city", "anywhere"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<RecommendPrefs> => {
    const client = context.supabase as unknown as SupabaseClient;
    return writeRecommend(client, context.userId, (current) => ({ ...current, ...data }));
  });

/** Swiped left on the deck: that person is not suggested again until feedback is cleared. */
export const skipRecommendedPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const client = context.supabase as unknown as SupabaseClient;
    await writeRecommend(client, context.userId, (current) => ({
      ...current,
      skipped: [data.profileId, ...current.skipped.filter((id) => id !== data.profileId)].slice(
        0,
        MAX_SKIPPED,
      ),
    }));
    return { ok: true };
  });

/** Brings back everyone skipped on the deck. */
export const clearRecommendationFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ cleared: number }> => {
    const client = context.supabase as unknown as SupabaseClient;
    let cleared = 0;
    await writeRecommend(client, context.userId, (current) => {
      cleared = current.skipped.length;
      return { ...current, skipped: [] };
    });
    return { cleared };
  });
