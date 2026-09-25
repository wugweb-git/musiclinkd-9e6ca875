import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_portfolio",
  title: "List my portfolio",
  description:
    "List the signed-in member's portfolio work (tracks, videos, credits) in their chosen order.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum items to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to MusicLinkd first.");
    const { data, error } = await supabaseForUser(ctx)
      .from("portfolio_items")
      .select("id, title, kind, role, description, release_year, media_url, featured, published")
      .eq("user_id", ctx.getUserId()!)
      .order("sort_order", { ascending: true })
      .limit(limit ?? 50);
    if (error) throw new ToolError(error.message);
    const items = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      kind: r.kind,
      role: r.role,
      description: r.description,
      releaseYear: r.release_year,
      mediaUrl: r.media_url,
      featured: r.featured,
      published: r.published,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
      structuredContent: { items },
    };
  },
});
