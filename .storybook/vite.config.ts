import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Storybook only: React, Tailwind and the @ alias, without the app's TanStack Start / Nitro plugins.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
});
