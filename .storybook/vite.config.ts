import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Storybook only: React, Tailwind and the @ alias, without the app's TanStack Start / Nitro plugins.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  resolve: {
    // Array form so each stub matches its exact specifier: a plain "@tanstack/react-start" key also
    // captured "@tanstack/react-start/server" and pointed the production build at a path inside
    // the stub file.
    alias: [
      // Without the TanStack Start plugin, the real package's server-core can't resolve its
      // "#tanstack-*-entry" subpath imports and crashes Vite's optimizer. See the stub file.
      {
        find: /^@tanstack\/react-start$/,
        replacement: resolve(import.meta.dirname, "./stubs/tanstack-react-start.ts"),
      },
      {
        find: /^@tanstack\/react-start\/server$/,
        replacement: resolve(import.meta.dirname, "./stubs/tanstack-react-start-server.ts"),
      },
      // Renders every story signed-out with no live Supabase call — see the stub file.
      {
        find: /^@\/hooks\/use-auth$/,
        replacement: resolve(import.meta.dirname, "./stubs/use-auth.ts"),
      },
      // vite-tsconfig-paths only resolves "@/" inside files the app tsconfig includes, so the kept
      // registry components (excluded from type-checking) 404 without this. It sits after the
      // use-auth stub: Vite matches aliases in order.
      { find: /^@\//, replacement: `${resolve(import.meta.dirname, "../src")}/` },
    ],
  },
});
