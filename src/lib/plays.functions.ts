import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * One play of a portfolio item, as the signed-in caller. The database decides what counts
 * (record_portfolio_play): signed-in viewers only, never the owner, once per 30 minutes.
 */
export const recordPortfolioPlay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    // record_portfolio_play is not in the generated types yet.
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client.rpc("record_portfolio_play", { item: data.itemId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
