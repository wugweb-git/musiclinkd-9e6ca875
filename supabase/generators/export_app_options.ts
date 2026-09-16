// Prints the app's option lists that become taxonomy categories, as JSON, for
// supabase/generators/taxonomy_single_names.py. Run from the repo root:
//   bun run supabase/generators/export_app_options.ts > /tmp/app-options.json
import {
  availabilityFor,
  intents,
  linkPlatforms,
  visibilityOptions,
  workModes,
} from "../../src/data/onboarding";
import { workTypes } from "../../src/data/portfolio";
import { pricingModelLabel, serviceCategories } from "../../src/data/services";
import { verificationTypes } from "../../src/data/verification";

console.log(
  JSON.stringify({
    verificationTypes: verificationTypes.map(({ key, title, blurb }) => ({ key, title, blurb })),
    workTypes: workTypes.map(({ kind, label, blurb, media }) => ({ kind, label, blurb, media })),
    visibilityOptions,
    linkPlatforms,
    intents,
    workModes,
    availabilityFor,
    serviceCategories: serviceCategories.map(({ key, label }) => ({ key, label })),
    pricingModelLabel,
  }),
);
