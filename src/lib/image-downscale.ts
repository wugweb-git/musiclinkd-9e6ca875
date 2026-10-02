/*
 * Shrink a photo in the browser before it is uploaded.
 *
 * There was no image pipeline at all: the upload helpers only *validated*, with limits of 5–10 MB,
 * so a phone camera JPEG — 4–8 MB, 4000px on its long edge — went to storage verbatim and then
 * came back down to render into a 40px avatar. On metered 4G that was the app's biggest single
 * data cost, in both directions.
 *
 * This is deliberately the upload side only. Transforming on read would need Supabase's image
 * transformation add-on, which is a billing decision, not a code one.
 *
 * Every photo it returns has been re-drawn through a canvas, which also strips the file's metadata
 * (EXIF: camera, time and the GPS position it was taken at). Every caller uploads to a public
 * bucket, so it never hands back the original: not when it is already small, and not when the
 * re-encode comes out bigger. A photo the browser can't re-draw is refused with a reason rather
 * than uploaded with its location inside.
 */

/** Why a photo could not be prepared for upload. */
const CANT_PREPARE = "Couldn't prepare this photo. Try another one.";

export type DownscaleOptions = {
  /** Longest edge, in CSS pixels, after scaling. Smaller side keeps the aspect ratio. */
  maxEdge: number;
  /** JPEG/WebP quality, 0–1. */
  quality?: number;
};

/** WebP is smaller than JPEG at the same quality and all three buckets accept it. */
function outputType(): "image/webp" | "image/jpeg" {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp")
      ? "image/webp"
      : "image/jpeg";
  } catch {
    return "image/jpeg";
  }
}

async function bitmapOf(file: File) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  // Safari below 17 has no createImageBitmap for files.
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downscaleImage(file: File, opts: DownscaleOptions): Promise<File> {
  const { maxEdge, quality = 0.82 } = opts;
  // The upload helpers only pass JPEG, PNG and WebP (checkPickedImage); nothing else is re-drawn.
  if (!file.type.startsWith("image/")) throw new Error(CANT_PREPARE);

  try {
    const source = await bitmapOf(file);
    const w = "width" in source ? source.width : 0;
    const h = "height" in source ? source.height : 0;
    if (!w || !h) throw new Error(CANT_PREPARE);

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(CANT_PREPARE);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    if ("close" in source) source.close();

    const type = outputType();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    // Kept even when it comes out bigger than the original: only the re-drawn file is free of the
    // original's metadata.
    if (!blob) throw new Error(CANT_PREPARE);

    const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg");
    return new File([blob], name, { type, lastModified: Date.now() });
  } catch {
    throw new Error(CANT_PREPARE);
  }
}

/** What each kind of upload is actually displayed at, with room for a 3x screen. */
export const downscale = {
  /** Largest on-screen avatar is 136px. */
  avatar: { maxEdge: 512 } as DownscaleOptions,
  /** Full-bleed cover on a phone. */
  cover: { maxEdge: 1600 } as DownscaleOptions,
  /** Listing and studio photos open full-width and can be pinched. */
  photo: { maxEdge: 1600 } as DownscaleOptions,
};
