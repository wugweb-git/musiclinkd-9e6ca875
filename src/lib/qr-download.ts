import { toast } from "sonner";
import { DOWNLOAD_UNAVAILABLE, downloadBlob } from "@/lib/download";

export const loadQrCode = () => import("qrcode").then((m) => m.default);

/** The QR for `value` as a printable PNG (black on white, quiet zone), with its file name. */
export async function qrPng(value: string, fileName: string) {
  const QRCode = await loadQrCode();
  const dataUrl = await QRCode.toDataURL(value, {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
  const name = `${fileName.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "musiclinkd"}-qr.png`;
  return { name, png: await (await fetch(dataUrl)).blob() };
}

/**
 * Saves the QR for `value` as a PNG through the browser (talent and business QR screens).
 * Black on white with a quiet zone, large enough to print.
 */
export async function downloadQr(value: string, fileName: string) {
  try {
    const { name, png } = await qrPng(value, fileName);
    if (downloadBlob(name, png)) toast.success("QR image saved");
    else toast.error(DOWNLOAD_UNAVAILABLE);
  } catch {
    toast.error("Couldn't make the QR image. Try again.");
  }
}

/** A MusicLinkd QR encodes a profile URL (short link /@username or legacy /profile/username) — extract the username. */
export function usernameFromScan(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Short link format: /@username or trailing /@username
  const atMatch = trimmed.match(/(?:^|\/)@([a-z0-9._]{3,30})\/?$/i);
  if (atMatch?.[1]) return atMatch[1];

  // 2. Legacy profile URL: /profile/username
  const legacyMatch = trimmed.match(/\/profile\/([a-z0-9._]{3,30})\/?$/i);
  if (legacyMatch?.[1]) return legacyMatch[1];

  // 3. Just the username string alone
  if (/^[a-z0-9._]{3,30}$/i.test(trimmed)) return trimmed;

  return null;
}
