import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

/*
 * Storybook's stories run as browser tests. This mirrors .storybook/vite.config.ts — React,
 * Tailwind and the @ alias — because the app's own Vite config is Lovable's TanStack Start setup,
 * which a story page doesn't need. The addon applies ./preview's decorators and its
 * `a11y: { test: "todo" }` on its own, so there is no setup file: axe reports violations without
 * failing the run. Turn that to "error" once the existing ones are cleared.
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths(), storybookTest({ configDir: ".storybook" })],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
