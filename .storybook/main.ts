import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

/*
 * The component registry. Storybook builds with its own Vite config (.storybook/vite.config.ts):
 * the app's config is Lovable's managed TanStack Start setup (SSR, Nitro), which a story page
 * doesn't need. Stories sit next to their components as *.stories.tsx.
 */

/*
 * The design guide, served next to the stories at /guide — the same path it has in production
 * (https://musiclinkd.com/guide), so guide/index.html's absolute /guide/system/*.css links resolve
 * here exactly as they do there.
 *
 * guide/ is local-only and git-ignored, so this is conditional: without it, Storybook still builds.
 * Only the parts the guide's own pages reference are mounted. guide/musiclinkd-system (147M, and
 * built against Gestalt, which this app does not use) and guide/gestalt (33M, vendored reference)
 * are left out — nothing in styleguide.html or index.html asks for them, and copying 180M into
 * every build would be the whole cost of the guide for none of its value.
 */
const GUIDE_PARTS = [
  "styleguide.html",
  "index.html",
  "system",
  "brand",
  "docs",
  "tokens",
  "rules",
  "icons",
];

const guideRoot = resolve(import.meta.dirname, "../guide");
const guideDirs = existsSync(guideRoot)
  ? GUIDE_PARTS.filter((part) => existsSync(resolve(guideRoot, part))).map((part) => ({
      from: `../guide/${part}`,
      to: `/guide/${part}`,
    }))
  : [];

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
  ],
  staticDirs: guideDirs,
  core: { disableTelemetry: true },
  framework: {
    name: "@storybook/react-vite",
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
};

export default config;
