import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { listOpportunities, type OpportunityRow } from "@/lib/catalog.functions";
import { searchPeople, type DirectoryPerson } from "@/lib/profile-groups.functions";

export type AiMatchResult =
  | {
      ok: true;
      people: { person: DirectoryPerson; reason: string }[];
      opportunities: { row: OpportunityRow; reason: string }[];
    }
  | { ok: false; status: number; message: string };

/**
 * A member describes who or what they need; the model picks from real public profiles and open
 * opportunities. Nothing returned is invented: every match is a row read here.
 */
export const findAiMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ brief: z.string().trim().min(10).max(600) }).parse(d))
  .handler(async ({ data, context }): Promise<AiMatchResult> => {
    const { pickMatches, MatchError } = await import("./ai-match.server");
    const [people, opps] = await Promise.all([
      searchPeople({ data: { limit: 60, withTotal: false } }).then((r) => r.people),
      listOpportunities().catch((): OpportunityRow[] => []),
    ]);
    const others = people.filter((p) => p.id !== context.userId);
    const candidates = {
      people: others.map((p) => ({
        id: p.id,
        name: p.name,
        headline: p.headline,
        city: p.city,
        roles: p.roles,
        genres: p.genres,
        verified: p.verified,
      })),
      opportunities: opps.slice(0, 40).map((o) => ({
        id: o.id,
        title: o.title,
        role: o.role_required,
        genres: o.genres,
        location: o.location,
      })),
    };
    try {
      const picks = await pickMatches(data.brief, candidates);
      const byPerson = new Map(others.map((p) => [p.id, p]));
      const byOpp = new Map(opps.map((o) => [o.id, o]));
      return {
        ok: true,
        people: picks.people.flatMap((p) => {
          const person = byPerson.get(p.id);
          return person ? [{ person, reason: p.reason }] : [];
        }),
        opportunities: picks.opportunities.flatMap((p) => {
          const row = byOpp.get(p.id);
          return row ? [{ row, reason: p.reason }] : [];
        }),
      };
    } catch (e) {
      if (e instanceof MatchError) return { ok: false, status: e.status, message: e.message };
      return { ok: false, status: 500, message: "AI matching failed. Try again in a moment." };
    }
  });
