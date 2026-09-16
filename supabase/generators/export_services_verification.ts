// Prints the app's services and verification data as JSON, for
// supabase/generators/services_verification.py. Run from the repo root:
//   bun run supabase/generators/export_services_verification.ts > /tmp/services-verification.json
//
// Which verification types each person type gets is read from the app's own verificationTypesFor and
// eligibility, run against the person_types options stored by 20260915110000 (what useTaxonomy reads).
import { readFileSync } from "node:fs";
import { myServices, pricingModelLabel, serviceCategories } from "../../src/data/services";
import {
  eligibility,
  myVerifications,
  verificationTypes,
  verificationTypesFor,
  type VerificationRequest,
} from "../../src/data/verification";

type Option = { category_key: string; slug: string; metadata: { flow?: string } | null };

const migration = readFileSync(
  "supabase/migrations/20260915110000_taxonomy_single_names_and_options.sql",
  "utf8",
);
const payload = /v_options jsonb := \$json\$(.*?)\$json\$;/s.exec(migration);
if (!payload) throw new Error("person_types payload not found in 20260915110000");
const personTypes = (JSON.parse(payload[1]!) as Option[]).filter(
  (o) => o.category_key === "person_types",
);

const keys = (roles: string[]) => verificationTypesFor(roles, personTypes).map((t) => t.key);
const verified = (key: string): VerificationRequest[] => [
  { id: "probe", type: key as VerificationRequest["type"], status: "verified", documents: [] },
];

console.log(
  JSON.stringify({
    serviceCategories: serviceCategories.map(({ key, label }) => ({ key, label })),
    pricingModelLabel,
    myServices,
    verificationTypes,
    myVerifications,
    personTypes: personTypes.map(({ slug, metadata }) => ({ slug, flow: metadata?.flow ?? null })),
    typesForRole: Object.fromEntries(personTypes.map((o) => [o.slug, keys([o.slug])])),
    typesForNoRole: keys([]),
    // A role the taxonomy does not have (the app treats it as talent).
    typesForUnknownRole: keys(["not_a_person_type"]),
    // Per type: whether it can start with no requests, and which verified type unlocks it.
    gates: verificationTypes.map((t) => {
      const open = eligibility(t.key, []);
      return {
        key: t.key,
        allowed: open.allowed,
        reason: open.reason,
        unlockedBy: verificationTypes
          .filter((u) => u.key !== t.key && eligibility(t.key, verified(u.key)).allowed)
          .map((u) => u.key),
      };
    }),
  }),
);
