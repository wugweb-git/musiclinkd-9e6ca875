// Storybook-only stand-in for "@tanstack/react-start" (aliased in .storybook/vite.config.ts).
//
// The real package's client entry re-exports its server-core, whose SSR build injects
// "#tanstack-start-entry" / "#tanstack-router-entry" — subpath imports only the app's
// TanStack Start Vite plugin resolves. Storybook's Vite config deliberately omits that
// plugin (see .storybook/vite.config.ts), so pulling in the real package here crashes
// Vite's dependency optimizer for the whole Storybook instance, not just the one story.
//
// useServerFn is the only export any component/hook imports client-side (see the repo-wide
// grep this was verified against). Server functions can't run in Storybook regardless, so
// this preserves the existing "submit path fails rather than writing" behavior documented
// in work-form.stories.tsx, without dragging in server-core.
export function useServerFn<T extends (...args: never[]) => unknown>(fn: T): T {
  return (async () => {
    throw new Error("Server functions are not available in Storybook.");
  }) as unknown as T;
}
