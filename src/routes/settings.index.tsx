import { createFileRoute, type LinkProps } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { useMyTalentIdentity } from "@/hooks/use-my-talent-identity";
import {
  AtSign,
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  Circle,
  Compass,
  FileText,
  FolderKanban,
  LifeBuoy,
  Lock,
  QrCode,
  LogOut,
  KeyRound,
  ScrollText,
  Shield,
  User,
  Music,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { MadeByWugweb, Row, RowGroup, SoonBadge } from "@/components/ml/kit";
import { SpotifyRow } from "@/components/ml/spotify";
import { SignInMethodsRow } from "@/components/ml/identities";
import { settingsGroups } from "@/data/settings";
import { iconSize } from "@/lib/tokens";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { AuthNotice } from "@/components/ml/auth";
import { Btn } from "@/components/ml/ui";
import { getMyProfile } from "@/lib/portfolio.functions";
import { reactivateMyAccount } from "@/lib/account.functions";

/**
 * Your public address, at the top of Settings, always (owner, 25 Sep 2026).
 *
 * It was nowhere in Settings before, and everywhere else it appeared — the QR screen, the share
 * sheet — it was hidden until a username had been claimed, which is exactly when somebody most
 * wants to know what their link will be. So the row never disappears: with a username it shows the
 * address and copies it; without one it says so and goes where you claim it.
 */
function ProfileLinkRow() {
  const { username, url } = useMyTalentIdentity();
  if (!username || !url) {
    return (
      <Row
        icon={<AtSign size={iconSize.lg} aria-hidden />}
        title="Claim your profile link"
        subtitle="Your public address, once you pick a username"
        to="/profile/edit"
      />
    );
  }
  // Shown without the scheme, the way somebody would write it down.
  const shown = url.replace(/^https?:\/\//, "");
  return (
    <Row
      icon={<AtSign size={iconSize.lg} aria-hidden />}
      title={shown}
      subtitle="Your public profile. Tap to copy."
      right={<Copy size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />}
      onClick={() => {
        void navigator.clipboard
          ?.writeText(url)
          .then(() => toast.success("Profile link copied"))
          .catch(() => toast.error("Couldn't copy. Long-press the link instead."));
      }}
    />
  );
}

/** The icon name each settings row carries, resolved once here. */
const rowIcons: Record<string, LucideIcon> = {
  user: User,
  "at-sign": AtSign,
  "badge-check": BadgeCheck,
  briefcase: Briefcase,
  building: Building2,
  folder: FolderKanban,
  music: Music,
  key: KeyRound,
  lock: Lock,
  qr: QrCode,
  shield: Shield,
  bell: Bell,
  compass: Compass,
  "life-buoy": LifeBuoy,
  scroll: ScrollText,
  "file-text": FileText,
  "log-out": LogOut,
};

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings | MusicLinkd" },
      {
        name: "description",
        content: "Account, work, privacy, security and support — all in one place.",
      },
      { property: "og:title", content: "Settings | MusicLinkd" },
      { property: "og:description", content: "Manage your MusicLinkd account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  // One account is one journey: only a business account manages a business from here.
  const { allowed: isBusiness } = useRequireBusiness();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const loadMe = useServerFn(getMyProfile);
  const me = useQuery({ queryKey: ["profile", "me"], queryFn: () => loadMe(), enabled: signedIn });
  const deactivated =
    (me.data as { visibility?: string } | null | undefined)?.visibility === "deactivated";
  const reactivate = useServerFn(reactivateMyAccount);
  const [reactivating, setReactivating] = useState(false);

  async function onReactivate() {
    setReactivating(true);
    try {
      await reactivate();
      await queryClient.invalidateQueries();
      toast.success("Welcome back. Your profile is visible again.");
    } catch {
      toast.error("That didn't go through. Try again.");
    } finally {
      setReactivating(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Settings" subtitle="Account and preferences" back="/profile" />
      <div className="space-y-6 px-5 pt-4 pb-6">
        {deactivated ? (
          <AuthNotice
            tone="warn"
            title="Your account is deactivated"
            action={
              <Btn className="w-full" loading={reactivating} onClick={() => void onReactivate()}>
                Reactivate
              </Btn>
            }
          >
            Nobody can find or open your profile until you reactivate it.
          </AuthNotice>
        ) : null}
        <ProfileLinkRow />
        {settingsGroups.map((g) => (
          <RowGroup key={g.key} title={g.title}>
            {g.rows
              .filter((r) => r.key !== "business" || isBusiness)
              .map((r) => {
                const Icon = rowIcons[r.icon] ?? Circle;
                if (r.key === "spotify") {
                  return (
                    <li key={r.key}>
                      <SpotifyRow />
                    </li>
                  );
                }
                if (r.key === "sign-in-methods") {
                  return (
                    <li key={r.key}>
                      <SignInMethodsRow />
                    </li>
                  );
                }
                return (
                  <li key={r.key}>
                    <Row
                      grouped
                      icon={<Icon size={iconSize.lg} aria-hidden />}
                      title={r.label}
                      subtitle={r.hint}
                      {...(r.soon
                        ? { badge: <SoonBadge />, right: <span /> }
                        : {
                            to: r.to as LinkProps["to"],
                            ...(r.params ? { params: r.params } : {}),
                          })}
                    />
                  </li>
                );
              })}
          </RowGroup>
        ))}
        <p className="px-1 text-center text-1 text-muted-foreground">MusicLinkd · v1.0 preview</p>
        <MadeByWugweb />
      </div>
    </Screen>
  );
}
