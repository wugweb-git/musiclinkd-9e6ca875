import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { flowTransitionTypes } from "./lib/flow-motion";
import { trackHistory } from "./lib/flow-back";

export const getRouter = () => {
  /*
   * Defaults, because there were none: 136 `useQuery` call sites and 6 that set `staleTime`.
   * React Query's own default is `staleTime: 0` plus refetch on mount and on window focus, so
   * every tab switch and every resume from the background refired the server function — on a
   * phone on mobile data, for a list that had not changed.
   *
   * 30s is long enough to cover a tab switch and a resume, short enough that a list the user
   * comes back to a minute later is fresh. A query that genuinely needs to be live still says so
   * itself; this only changes what the other 130 do when nobody has decided.
   *
   * Retry is 1, not 3: on a flaky connection three silent retries with backoff means the error
   * state arrives after several seconds of spinner, which reads as a hang.
   */
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    /*
     * The loader that ran on touch-intent used to be stale by the time the navigation committed,
     * so every preloaded navigation cost two server calls instead of one. This is the window in
     * which the preload still counts — comfortably longer than the gap between a finger landing
     * and the tap completing.
     */
    defaultPreloadStaleTime: 30_000,
    // Page motion: the registration flow in order, everyday navigation as push, pop or fade.
    defaultViewTransition: { types: flowTransitionTypes },
  });
  trackHistory(router);

  return router;
};
