// Prints the demo businesses, their reviews and the demo bands as JSON, for
// supabase/generators/import_groups.py. Run from the repo root:
//   bun run supabase/generators/export_demo_groups.ts > /tmp/groups.json
import { bands } from "../../src/data/band";
import { businessReviews, myBusinesses } from "../../src/data/business";

console.log(JSON.stringify({ businesses: myBusinesses, businessReviews, bands }));
