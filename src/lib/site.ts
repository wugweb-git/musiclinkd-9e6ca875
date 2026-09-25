/*
 * Where MusicLinkd lives in public, and the one place that decides it (owner, 25 Sep 2026).
 *
 * Four hosts were claiming to be the address, and three of them were wrong:
 *
 *   app.musiclinkd.com   serves the app — /@username returns 200
 *   musiclinkd.com       the marketing site — /@username returns 404
 *   musiclinkd.app       no DNS record at all, yet every QR code pointed at it, so every printed
 *                        card, poster, studio sign and badge led nowhere
 *   window.location.origin   eleven share buttons built their link from whatever host the person
 *                        happened to be on, so a profile copied from the Lovable preview read
 *                        musiclinkd.lovable.app and one copied in dev read localhost:8080
 *
 * A link somebody sends is not about where they were standing when they copied it. It is a fixed
 * public address, so it is built from PUBLIC_ORIGIN and never from the current origin.
 *
 * The exceptions are deliberate and stay on `window.location.origin`: OAuth redirects and the
 * password-reset link have to come back to the deployment the person is actually using, and
 * analytics reports the page that was really loaded.
 */

export const PUBLIC_HOST = "app.musiclinkd.com";
export const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;

/** An absolute, shareable link to a path in the app: shareUrl("/bands/7") → https://app.…/bands/7 */
export function shareUrl(path: string) {
  return `${PUBLIC_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/** A person's or page's public profile: the short /@handle link, talent and business alike. */
export function profileUrl(username: string) {
  return shareUrl(`/@${username}`);
}

/** What a scanned QR code resolves to. */
export function codeUrl(code: string) {
  return shareUrl(`/q/${code}`);
}
