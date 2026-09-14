// Prints the services, experience, reviews and gallery of the 11 linked seed profiles as JSON, for
// supabase/generators/import_profile_sections.py. Run from the repo root:
//   bun run supabase/generators/export_linked_sections.ts > /tmp/sections.json
import { linkedProfileSeeds } from "../../src/data/linked-profiles";

console.log(
  JSON.stringify(
    linkedProfileSeeds.map((s) => ({
      id: s.id,
      username: s.profile.username,
      services: s.profile.services,
      experience: s.profile.experience,
      reviews: s.profile.reviews,
      gallery: s.profile.gallery,
    })),
  ),
);
