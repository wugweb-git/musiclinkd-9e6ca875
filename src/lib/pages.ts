/** Business page sign-ins use this domain, which receives no mail (src/lib/pages.functions.ts). */
export const PAGE_EMAIL_DOMAIN = "pages.musiclinkd.com";

/** True for a business page's own sign-in address, which is never shown or changed. */
export function isPageEmail(email: string | null | undefined) {
  return Boolean(email?.toLowerCase().endsWith(`@${PAGE_EMAIL_DOMAIN}`));
}
