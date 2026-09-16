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
      "src/components/ui/{tour,stepper,media-player,phone-input,message,markdown,code-block,floating-dock,stateful-button,skeleton-loader}.tsx",
      "src/components/{dropzone,file-upload-01,onboarding-01,command-menu-01,pricing-table-one-demo,tab-switcher,visually-hidden-input}.tsx",
      "src/lib/{compose-refs,billingsdk-config,glass-variants,styles-prop,internal-glyphs,provider,wave-cn}.*",
      "src/hooks/{use-as-ref,use-lazy-ref,use-isomorphic-layout-effect,use-liquid-glass,use-controlled-state,use-auto-height}.*",
      "src/lib/get-strict-context.tsx",
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
