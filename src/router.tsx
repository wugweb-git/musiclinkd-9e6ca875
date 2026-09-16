import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { flowTransitionTypes } from "./lib/flow-motion";
import { trackHistory } from "./lib/flow-back";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Page motion: the registration flow in order, everyday navigation as push, pop or fade.
    defaultViewTransition: { types: flowTransitionTypes },
  });
  trackHistory(router);

  return router;
};
