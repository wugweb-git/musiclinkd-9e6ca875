import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my profile",
  description:
    "Read the signed-in member's MusicLinkd profile: name, username, headline, roles, genres and city.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to MusicLinkd first.");
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select("display_name, username, headline, bio, roles, genres, city, country")
      .eq("id", ctx.getUserId()!)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("No profile yet — finish onboarding in the app.");
    const profile = {
      displayName: data.display_name,
      username: data.username,
      headline: data.headline,
      bio: data.bio,
      roles: data.roles,
      genres: data.genres,
      city: data.city,
      country: data.country,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(profile) }],
      structuredContent: { profile },
    };
  },
});
