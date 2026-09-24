/** Remembers the connect-an-app consent page across any sign-in method, then returns there. */
const KEY = "ml.oauthReturn";

export function rememberOAuthReturn(path: string) {
  if (path.startsWith("/") && !path.startsWith("//")) localStorage.setItem(KEY, path);
}

export function takeOAuthReturn(): string | null {
  const path = localStorage.getItem(KEY);
  localStorage.removeItem(KEY);
  return path && path.startsWith("/.lovable/oauth/consent") ? path : null;
}
