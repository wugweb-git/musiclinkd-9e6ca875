// Prints the portfolio sections and cover of the 11 linked seed profiles as JSON, for
// supabase/generators/import_profiles.py. Run from the repo root:
//   bun run supabase/generators/export_linked_profiles.ts > /tmp/linked.json
import { linkedProfileSeeds } from "../../src/data/linked-profiles";

console.log(
  JSON.stringify(
    linkedProfileSeeds.map((s) => ({
      id: s.id,
      username: s.profile.username,
      cover: s.profile.cover,
      audio: s.profile.audio,
      video: s.profile.video,
      projects: s.profile.projects,
      discography: s.profile.discography,
    })),
  ),
);
