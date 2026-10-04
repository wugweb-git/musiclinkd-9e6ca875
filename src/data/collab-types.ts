import type { CollabType } from "@/lib/collab-types";

/** What each collaboration type is called, and the one-line hint in "Start a collaboration". */
export const collabTypeCopy: Record<CollabType, { label: string; hint: string }> = {
  band: { label: "Band", hint: "An ongoing group, with a public band page" },
  duo: { label: "Duo", hint: "Two artists working as one act" },
  collective: { label: "Collective", hint: "A loose group that makes work together" },
  ensemble: { label: "Ensemble", hint: "A classical, folk or jazz group" },
  production_team: { label: "Production Team", hint: "Producers and engineers working as one" },
  crew: { label: "Crew", hint: "A live or touring crew" },
};
