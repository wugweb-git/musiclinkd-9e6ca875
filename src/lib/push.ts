import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

/*
 * Push registration, for the Android wrap only.
 *
 * Every call here is a no-op on the web. The browser build has no Firebase Cloud Messaging and no
 * service worker, so asking for notification permission in a tab would prompt a person for
 * something that cannot then deliver anything. `Capacitor.isNativePlatform()` is false in a
 * browser, which is what gates it.
 *
 * Nothing registers a device that is not signed in: a token is stored against a profile, so it is
 * meaningless without one.
 */

export type PushRegistration = { token: string; platform: "android" | "ios" };

/** True only inside the native wrap, so the web build never prompts. */
export function pushAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications");
}

/**
 * Ask for permission and register with FCM, resolving with the device's token.
 *
 * Returns null rather than throwing when the person declines, because a refused permission is an
 * ordinary answer and not an error — the app carries on without pushes, and can ask again later
 * from notification settings.
 */
export async function registerForPush(): Promise<PushRegistration | null> {
  if (!pushAvailable()) return null;

  const existing = await PushNotifications.checkPermissions();
  const status =
    existing.receive === "prompt" || existing.receive === "prompt-with-rationale"
      ? (await PushNotifications.requestPermissions()).receive
      : existing.receive;
  if (status !== "granted") return null;

  return new Promise<PushRegistration | null>((resolve) => {
    // Registration answers on one of two events and never both. Whichever arrives first settles
    // the promise; the listeners are removed either way so a later token rotation does not try to
    // resolve an already-settled promise.
    let settled = false;
    const finish = async (value: PushRegistration | null) => {
      if (settled) return;
      settled = true;
      await PushNotifications.removeAllListeners();
      resolve(value);
    };

    void PushNotifications.addListener("registration", (t) => {
      void finish({
        token: t.value,
        platform: Capacitor.getPlatform() === "ios" ? "ios" : "android",
      });
    });
    void PushNotifications.addListener("registrationError", () => {
      void finish(null);
    });
    void PushNotifications.register();

    // A device with no Play Services, or no google-services.json in the build, simply never
    // answers. Without this the promise would hang and the caller would wait forever.
    window.setTimeout(() => void finish(null), 15_000);
  });
}

/** Clear the notification tray and the badge, e.g. when the inbox is opened. */
export async function clearDeliveredPushes() {
  if (!pushAvailable()) return;
  await PushNotifications.removeAllDeliveredNotifications();
}
