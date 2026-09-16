// Storybook-only stand-in for "@tanstack/react-start/server". Only server middleware imports it,
// and nothing server-side runs in a story, so each accessor fails if it is ever called.
const unavailable = () => {
  throw new Error("Server request context is not available in Storybook.");
};

export const getRequest = unavailable;
export const getRequestHeader = unavailable;
