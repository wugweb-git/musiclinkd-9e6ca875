import { useState } from "react";
import type { Decorator, Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

// Lab only: @liquefy-ui component styles, loaded before the app stylesheet so Tailwind utilities win.
import "./layers.css";
import "../src/styles/liquefy-ui.css";
import "../src/styles.css";

/*
 * Components use TanStack Router links, so every story renders inside a throwaway memory router.
 * Links render and can be focused; following one goes nowhere.
 */
const withRouter: Decorator = (Story) => {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return <RouterProvider router={router} />;
};

/*
 * Components like ViewerAvatar call useQuery (see src/components/ml/viewer.tsx) — without a
 * client, React Query throws "No QueryClient set" the moment such a story renders. A fresh
 * client per story avoids cache bleed between stories; retries are off so a failed fetch
 * (e.g. the useServerFn stub throwing, see .storybook/stubs) settles immediately instead of
 * retrying for several seconds.
 */
const withQueryClient: Decorator = (Story) => {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return (
    <QueryClientProvider client={client}>
      <Story />
    </QueryClientProvider>
  );
};

/** Phone frame: the app is designed and tested at 412px. */
const withPhone: Decorator = (Story, ctx) =>
  ctx.parameters.layout === "fullscreen" ? (
    <Story />
  ) : (
    <div className="mx-auto w-[412px] max-w-full bg-background p-5 text-foreground">
      <Story />
    </div>
  );

const preview: Preview = {
  decorators: [withPhone, withRouter, withQueryClient],
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    a11y: { test: "todo" },
  },
  tags: ["autodocs"],
};

export default preview;
