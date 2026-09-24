import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMyPortfolio from "./tools/list-my-portfolio";

// Issuer must be the direct auth host; the project ref is inlined at build time.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "musiclinkd",
  title: "MusicLinkd",
  version: "0.1.0",
  instructions:
    "Tools for MusicLinkd, India's professional network for the music industry. They act as the signed-in member. Use `get_my_profile` for their professional identity and `list_my_portfolio` for their work.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, listMyPortfolio],
});
