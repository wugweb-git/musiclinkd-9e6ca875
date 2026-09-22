/*
 * The launch map: which modules carry a label, in one place. The menu, the bottom nav and
 * Discover's shortcuts all read it, so moving a module between stages is a one-line change.
 *
 *   beta — open and usable, but new: it keeps its link and shows a quiet "Beta" pill.
 *   soon — not open yet: shown with the "Soon" pill, and where a surface can, not tappable.
 *
 * A path that isn't listed is launched and carries no label. Being built doesn't make a module
 * launched — that's the owner's call, made here.
 */
export type Stage = "beta" | "soon";

export const release: Record<string, Stage> = {
  "/messages": "beta",
  "/notifications": "beta",
  "/collab": "soon",
  "/verification": "soon",
  "/bands": "beta",
  "/reviews": "beta",
  "/bookings": "beta",
  "/recently-viewed": "beta",
  "/search": "soon",
  "/help": "soon",
};

export const stageOf = (path: string): Stage | undefined => release[path];
