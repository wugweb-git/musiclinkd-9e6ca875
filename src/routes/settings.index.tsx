import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AtSign,
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  ChevronRight,
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
import { MadeByWugweb, SoonBadge } from "@/components/ml/kit";
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
        {settingsGroups.map((g) => (
          <section key={g.key}>
            <h2 className="pill mb-2 px-1 text-muted-foreground">{g.title}</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
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
                  const inner = (
                    <>
                      <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                        <Icon size={24} strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-2 font-semibold">{r.label}</span>
                        <span className="block truncate text-1 text-muted-foreground">
                          {r.hint}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={r.key}>
                      {r.soon ? (
                        <div aria-disabled="true" className="flex items-center gap-3 px-4 py-3.5">
                          {inner}
                          <SoonBadge />
                        </div>
                      ) : (
                        <Link to={r.to} className="state-layer flex items-center gap-3 px-4 py-3.5">
                          {inner}
                          <ChevronRight
                            size={iconSize.md}
                            className="shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        </Link>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
        <p className="px-1 text-center text-1 text-muted-foreground">MusicLinkd · v1.0 preview</p>
        <MadeByWugweb />
      </div>
    </Screen>
  );
}
