/*
 * Collaboration types (owner, 4 Oct 2026, queue item 7): a band and the other standing groups of
 * talent. `project` is not one — a one-off creative project is proof of work, in Portfolio →
 * Project. Keys are the stored `collabs.type` values (CHECK in 20261004190000); labels live in
 * src/data/collab-types.ts. Every one is shown with the band screens (/bands).
 */
export const COLLAB_TYPES = [
  "band",
  "duo",
  "collective",
  "ensemble",
  "production_team",
  "crew",
] as const;

export type CollabType = (typeof COLLAB_TYPES)[number];

export function isCollabType(value: unknown): value is CollabType {
  return typeof value === "string" && (COLLAB_TYPES as readonly string[]).includes(value);
}
