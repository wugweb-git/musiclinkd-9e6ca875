/**
 * QR & sharing settings (/identity/settings), stored in profiles.discovery_prefs.qr. Every key
 * defaults to on: the card shares a contact field the profile has unless it is switched off.
 */
export type QrPrefs = {
  active: boolean;
  discoverable: boolean;
  phone: boolean;
  email: boolean;
  website: boolean;
  company: boolean;
  analytics: boolean;
};
export const defaultQrPrefs: QrPrefs = {
  active: true,
  discoverable: true,
  phone: true,
  email: true,
  website: true,
  company: true,
  analytics: true,
};
export function qrPrefsOf(discoveryPrefs: unknown): QrPrefs {
  const stored = (discoveryPrefs as { qr?: Partial<QrPrefs> } | null | undefined)?.qr;
  return { ...defaultQrPrefs, ...(stored && typeof stored === "object" ? stored : {}) };
}
