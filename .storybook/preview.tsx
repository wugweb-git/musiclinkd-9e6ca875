import type { Decorator, Preview } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

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
  decorators: [withPhone, withRouter],
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    a11y: { test: "todo" },
  },
  tags: ["autodocs"],
};

export default preview;
