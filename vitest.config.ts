import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import storybookVite from "./.storybook/vite.config.ts";

/*
 * Storybook's stories run as browser tests. This extends .storybook/vite.config.ts — React,
 * Tailwind, the @ alias and the stubs — rather than copying it: without the stubs the real
 * @tanstack/react-start server package reaches the optimizer and every story file fails to load.
 * The app's own Vite config is Lovable's TanStack Start setup, which a story page doesn't need.
 * The addon applies ./preview's decorators and its `a11y: { test: "todo" }` on its own, so there
 * is no setup file: axe reports violations without failing the run. Turn that to "error" once the
 * existing ones are cleared.
 */
export default mergeConfig(
  storybookVite,
  defineConfig({
    plugins: [storybookTest({ configDir: ".storybook" })],
    test: {
      name: "storybook",
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: "chromium" }],
      },
    },
  }),
);
