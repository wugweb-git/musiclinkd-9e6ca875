import { useMyTalentIdentity } from "@/hooks/use-my-talent-identity";
import { useMyBusinessIdentity } from "@/hooks/use-my-business-identity";
import type { QrStyle } from "@/data/identity";

export type QrSubjectKind = "talent" | "business";

/**
 * One QR screen, two subjects. `/identity/qr` shows the signed-in talent profile;
 * `/identity/qr?as=business` shows the same screen with the business page as its subject — the
 * pattern the Market already uses for `?view=Rent`, rather than a second hand-written screen that
 * drifts from the first (owner, 28 Sep 2026).
 *
 * The two identity hooks return the same facts under different names (`role`/`category`,
 * `photo`/`logo`); this normalises them so the screen does not care which it is looking at.
 */
export function useQrSubject(as: QrSubjectKind) {
  const talent = useMyTalentIdentity();
  const business = useMyBusinessIdentity();
  if (as === "business") {
    return {
      kind: "business" as const,
      ready: business.ready,
      /** False when the account has no business page — the screen says so instead of a blank code. */
      exists: business.hasBusiness,
      username: business.username,
      name: business.name,
      role: business.category,
      photo: business.logo,
      verified: business.verified,
      url: business.url,
      /** A business page has no per-subject QR style of its own. */
      qrStyle: "light" as QrStyle,
      styleable: false,
    };
  }
  return {
    kind: "talent" as const,
    ready: talent.ready,
    exists: true,
    username: talent.username,
    name: talent.name,
    role: talent.role,
    photo: talent.photo ?? "",
    verified: talent.verified,
    url: talent.url,
    qrStyle: talent.qrStyle,
    styleable: true,
  };
}
