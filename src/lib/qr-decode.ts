/*
 * Reads the text of a QR code from a camera frame or a picture. Uses the browser's own
 * BarcodeDetector where it exists (Chrome on Android) and jsQR everywhere else (iPhone Safari,
 * Firefox), so the scanner works on every phone. jsQR is loaded only when it is needed.
 */

type Source = HTMLVideoElement | ImageBitmap;

type Detector = { detect: (source: Source) => Promise<{ rawValue?: string }[]> };

let native: Detector | null | undefined;

function nativeDetector(): Detector | null {
  if (native !== undefined) return native;
  const Ctor = (globalThis as { BarcodeDetector?: new (o: { formats: string[] }) => Detector })
    .BarcodeDetector;
  native = Ctor ? new Ctor({ formats: ["qr_code"] }) : null;
  return native;
}

let canvas: HTMLCanvasElement | null = null;

async function withJsQr(source: Source): Promise<string | null> {
  const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  if (!width || !height) return null;
  // Big photos are scaled down: a QR stays readable and decoding stays quick.
  const scale = Math.min(1, 960 / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  canvas ??= document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  // Styled codes can be light on dark, so both ways round are tried.
  const { default: jsQR } = await import("jsqr");
  const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
  return found?.data ?? null;
}

/** The text in the first QR code found, or null. */
export async function decodeQr(source: Source): Promise<string | null> {
  const detector = nativeDetector();
  if (detector) {
    try {
      const codes = await detector.detect(source);
      return codes[0]?.rawValue ?? null;
    } catch {
      // Fall through to jsQR.
    }
  }
  return withJsQr(source);
}
