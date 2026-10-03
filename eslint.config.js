import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Trial components copied from shadcn registries: third-party code kept as downloaded, used only
  // by the Lab stories. They are excluded from tsconfig for the same reason.
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      "src/lab/**",
      "src/components/agents-ui/agent-audio-visualizer-wave.tsx",
      "src/components/agents-ui/react-shader-toy.tsx",
      "src/components/animate-ui/**",
      "src/components/animbits/**",
      "src/components/spectrumui/**",
      "src/components/waves-cn/**",
      "src/components/ui/glasscn/**",
      "src/components/ui/liquid-*.tsx",
      "src/components/ui/{phone-input,message,markdown,code-block,floating-dock,skeleton-loader}.tsx",
      "src/components/{dropzone,onboarding-01,command-menu-01,tab-switcher,visually-hidden-input}.tsx",
      "src/lib/{compose-refs,glass-variants,styles-prop,internal-glyphs,provider,wave-cn}.*",
      "src/hooks/{use-as-ref,use-lazy-ref,use-isomorphic-layout-effect,use-liquid-glass,use-controlled-state,use-auto-height}.*",
      "src/lib/get-strict-context.tsx",
      // Generated from the database schema and rewritten wholesale on every regeneration, the same
      // reason routeTree.gen.ts is left alone. It carried 3,309 of the repo's 3,336 lint errors, so
      // `bun run lint` was red no matter what anybody did — a gate nobody can pass is not a gate.
      "src/integrations/supabase/types.ts",
      // Lovable's preview auth broker, and its first line says "This file is automatically
      // generated. Do not edit it directly." It has been regenerated four times — 2, 13, 24 and 25
      // Sep — and each time it came back with `let timer` and single quotes, so the one lint error
      // was fixed by hand three times and reappeared within hours. CI was red on every push,
      // including every one of ours, for a file nobody is allowed to edit.
      "src/integrations/supabase/previewAuthStorage.ts",
      // Agent worktrees: six whole checkouts of this repo, 2,039 .tsx files against the 343 real
      // ones in src/. `eslint .` was linting all six copies — minutes of work, and every finding
      // about a stale copy of a file rather than the file. Git ignores nested worktrees on its own;
      // eslint does not.
      ".claude/**",
      // Build output, not source. `android/app/src/main/assets/public` is the web bundle that
      // `cap sync` copies in — 272 minified files, which a formatting rule will happily spend
      // minutes disagreeing with. Both are already gitignored; flat config does not read that.
      "android/**",
      "storybook-static/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // AGENTS.md mandates WCAG AA, 4.5:1 contrast, :focus-visible and a 48dp touch
      // floor. Until 2026-09-10 none of it was machine-checked: jsx-a11y was never
      // registered, so three `eslint-disable jsx-a11y/media-has-caption` comments sat
      // in ml/portfolio.tsx suppressing a rule that did not exist.
      ...jsxA11y.flatConfigs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Vendored shadcn/Radix primitives. Their headings and anchors receive content
    // from the consumer via {...props}, which these two rules cannot see, so they
    // report a false positive on every forwardRef wrapper. Every other jsx-a11y rule
    // still applies here.
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/anchor-has-content": "off",
    },
  },
  eslintPluginPrettier,
);
