/*
 * Ask storage for the size the screen actually shows.
 *
 * Uploads are already capped at 1600px on their long edge (src/lib/image-downscale.ts), but a
 * 1600px cover still renders into a 40px avatar on a list row. Supabase's render endpoint resizes
 * on the fly and content-negotiates WebP, which on a real cover in this project's bucket is
 * 58 KB → 22 KB at width 400, and 9 KB once the browser asks for WebP. Verified against
 * gsqeymhtyzepwcnorjun on 29 Sep 2026; the add-on is enabled.
 *
 * Only this project's own storage URLs are rewritten. Anything else — an Unsplash URL that already
 * carries its own `?w=`, a Google avatar, a link someone pasted — is returned untouched, so this
 * is safe to apply anywhere an image URL is rendered.
 */

const OBJECT = "/storage/v1/object/public/";
const RENDER = "/storage/v1/render/image/public/";

export type ImageSize = {
  /** CSS pixels the image is displayed at. Doubled for the request, for 2x screens. */
  width: number;
  /** 1–100. 70 is indistinguishable at these sizes and noticeably smaller than the default 80. */
  quality?: number;
  /** How to fit the box. `cover` matches `object-cover`, which is what nearly every site uses. */
  resize?: "cover" | "contain" | "fill";
};

/**
 * A storage URL sized for where it is shown. Returns the input unchanged for any URL this project
 * does not serve, and for one that is already a render URL.
 */
export function sized<T extends string | null | undefined>(url: T, size: ImageSize): T {
  // Falsy and foreign URLs come back exactly as they went in — an `undefined` src must stay
  // `undefined`, because `src=""` makes the browser re-request the current page as an image.
  if (!url || !url.includes(OBJECT)) return url;

  const { width, quality = 70, resize = "cover" } = size;
  // 2x covers every phone worth optimising for; 3x is past the point the eye can tell at these
  // sizes and costs roughly twice the bytes again.
  const w = Math.round(width * 2);
  const params = new URLSearchParams({
    width: String(w),
    quality: String(quality),
    resize,
  });
  return `${url.replace(OBJECT, RENDER)}?${params.toString()}` as T;
}

/** The widths the app actually renders at, so a call site names a role rather than a number. */
export const imageWidth = {
  /** List-row and comment avatars: h-6 to h-12. */
  avatarSm: 48,
  /** Card and header avatars: h-14 to h-20. */
  avatarMd: 80,
  /** The profile photo at rest (136px). */
  avatarLg: 136,
  /** A card's thumbnail in a rail or list row. */
  thumb: 200,
  /** A full-width card image or a cover on a phone. */
  wide: 412,
  /** A full-bleed hero or an opened photo. */
  full: 800,
} as const;
