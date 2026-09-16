import type { StorybookConfig } from "@storybook/react-vite";

/*
 * The component registry. Storybook builds with its own Vite config (.storybook/vite.config.ts):
 * the app's config is Lovable's managed TanStack Start setup (SSR, Nitro), which a story page
 * doesn't need. Stories sit next to their components as *.stories.tsx.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
  ],
  core: { disableTelemetry: true },
  framework: {
    name: "@storybook/react-vite",
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
};

export default config;
