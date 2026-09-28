import { Browser } from "@capacitor/browser";
import { isNativeApp } from "@/lib/native-auth";

/*
 * Saving a file, and opening a link, from inside the Android wrap.
 *
 * Five places built a Blob, made an `<a download>` and clicked it: the .ics for a booking, the
 * .vcf contact card, the QR PNG, and the "download my data" export. An Android WebView ignores the
 * `download` attribute, so all four did nothing — and the .ics one then toasted "Calendar event
 * downloaded", which is worse than failing, because the user stops looking for the file.
 *
 * Adding @capacitor/filesystem would give a real save, but a new native plugin needs a store
 * release, and the whole point of the remote-URL shell is that web fixes ship without one. So
 * until that decision is made, this reports honestly rather than pretending.
 */

/**
 * Save a blob as a file. Returns false where the platform cannot, so the caller can say something
 * true instead of claiming success.
 */
export function downloadBlob(filename: string, blob: Blob): boolean {
  if (isNativeApp()) return false;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/** What to tell someone in the app when a download could not happen. */
export const DOWNLOAD_UNAVAILABLE =
  "Saving files isn't supported in the app yet. Open app.musiclinkd.com in your browser to save this.";

/**
 * Open an external link. `window.open` is a no-op in an Android WebView, so every "Directions"
 * button silently did nothing there; @capacitor/browser is already installed and opens a Chrome
 * Custom Tab, which is the same thing the sign-in flow uses.
 */
export function openExternal(url: string) {
  if (isNativeApp()) {
    void Browser.open({ url }).catch(() => {});
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
