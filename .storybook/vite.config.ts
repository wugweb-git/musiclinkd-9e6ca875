import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Storybook only: React, Tailwind and the @ alias, without the app's TanStack Start / Nitro plugins.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  resolve: {
    alias: {
      // Without the TanStack Start plugin, the real package's server-core can't resolve
      // its "#tanstack-*-entry" subpath imports and crashes Vite's optimizer. See the stub
      // file for the full explanation.
      "@tanstack/react-start": resolve(import.meta.dirname, "./stubs/tanstack-react-start.ts"),
      // Renders every story signed-out with no live Supabase call — see the stub file.
      "@/hooks/use-auth": resolve(import.meta.dirname, "./stubs/use-auth.ts"),
    },
  },
});
