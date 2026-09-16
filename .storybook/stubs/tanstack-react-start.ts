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

// The production build (unlike dev) checks every import in the graph, and story components reach
// modules that define server functions and middleware at load time. Each builder here accepts any
// chain (.middleware().inputValidator().handler()) and ends in a function that fails when called.
type Chain = { [method: string]: (...args: unknown[]) => Chain } & ((...args: unknown[]) => never);

function chain(): Chain {
  const unavailable = () => {
    throw new Error("Server functions are not available in Storybook.");
  };
  return new Proxy(unavailable, {
    get: () => () => chain(),
  }) as unknown as Chain;
}

export const createServerFn = (..._args: unknown[]) => chain();
export const createMiddleware = (..._args: unknown[]) => chain();
export const createCsrfMiddleware = (..._args: unknown[]) => chain();
export const createStart = (..._args: unknown[]) => chain();
