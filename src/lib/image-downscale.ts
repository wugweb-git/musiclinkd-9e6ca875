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
 * It never blocks an upload: anything unexpected — an undecodable file, no canvas, a re-encode
 * that somehow comes out bigger — returns the original file and the upload proceeds as before.
 */

export type DownscaleOptions = {
  /** Longest edge, in CSS pixels, after scaling. Smaller side keeps the aspect ratio. */
  maxEdge: number;
  /** JPEG/WebP quality, 0–1. */
  quality?: number;
};

/** Below this, re-encoding costs more than it saves. */
const SKIP_UNDER_BYTES = 200 * 1024;

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
  if (!file.type.startsWith("image/")) return file;
  // A GIF would lose its animation, and an SVG has no pixels to scale.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size <= SKIP_UNDER_BYTES) return file;

  try {
    const source = await bitmapOf(file);
    const w = "width" in source ? source.width : 0;
    const h = "height" in source ? source.height : 0;
    if (!w || !h) return file;

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    // Already small enough and already cheap: nothing to do.
    if (scale === 1 && file.size <= 600 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    if ("close" in source) source.close();

    const type = outputType();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg");
    return new File([blob], name, { type, lastModified: Date.now() });
  } catch {
    return file;
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
