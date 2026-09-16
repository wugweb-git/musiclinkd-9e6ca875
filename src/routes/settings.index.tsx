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
  CreditCard,
  FileText,
  FolderKanban,
  LifeBuoy,
  Lock,
  LogOut,
  ScrollText,
  Shield,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { settingsGroups } from "@/data/settings";

/** The icon name each settings row carries, resolved once here. */
const rowIcons: Record<string, LucideIcon> = {
  user: User,
  "at-sign": AtSign,
  "badge-check": BadgeCheck,
  "credit-card": CreditCard,
  briefcase: Briefcase,
  building: Building2,
  folder: FolderKanban,
  wallet: Wallet,
  lock: Lock,
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
  return (
    <Screen>
      <TopBar title="Settings" subtitle="Account and preferences" back="/profile" />
      <div className="space-y-6 px-5 pt-4 pb-6">
        {settingsGroups.map((g) => (
          <section key={g.key}>
            <h2 className="pill mb-2 px-1 text-muted-foreground">{g.title}</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {g.rows.map((r) => {
                const Icon = rowIcons[r.icon] ?? Circle;
                return (
                  <li key={r.key}>
                    <Link to={r.to} className="state-layer flex items-center gap-3 px-4 py-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-subtle">
                        <Icon size={20} strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-2 font-semibold">{r.label}</span>
                        <span className="block truncate text-1 text-muted-foreground">
                          {r.hint}
                        </span>
                      </span>
                      <ChevronRight
                        size={20}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <p className="px-1 text-center text-1 text-muted-foreground">MusicLinkd · v1.0 preview</p>
      </div>
    </Screen>
  );
}
