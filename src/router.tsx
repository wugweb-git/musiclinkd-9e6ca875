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
    // Registration-flow page motion; every other navigation returns false and stays instant.
    defaultViewTransition: { types: flowTransitionTypes },
  });
  trackHistory(router);

  return router;
};
