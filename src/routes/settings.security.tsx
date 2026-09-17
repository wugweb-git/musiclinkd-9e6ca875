import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, SoonBadge } from "@/components/ml/kit";
import { securityRows } from "@/data/settings";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/settings/security")({
  head: () => ({
    meta: [
      { title: "Security | MusicLinkd" },
      {
        name: "description",
        content: "Password, two-step verification and the devices signed in to your account.",
      },
      { property: "og:title", content: "Security | MusicLinkd" },
      { property: "og:description", content: "Keep your MusicLinkd account safe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityScreen,
});

function SecurityScreen() {
  return (
    <Screen>
      <TopBar title="Security" subtitle="Password and devices" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="p-0">
          {securityRows.map((r) =>
            r.soon ? (
              <div
                key={r.key}
                aria-disabled="true"
                onClick={() => toast(`${r.label} — coming soon`)}
                className="flex items-center gap-3 border-b border-border p-4 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-1 font-semibold">{r.label}</span>
                  <span className="block truncate text-1 text-muted-foreground">{r.hint}</span>
                </span>
                <SoonBadge />
              </div>
            ) : (
              <Link
                key={r.key}
                to={r.to}
                className="flex items-center gap-3 border-b border-border p-4 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-1 font-semibold">{r.label}</span>
                  <span className="block truncate text-1 text-muted-foreground">{r.hint}</span>
                </span>
                <ChevronRight size={iconSize.sm} className="shrink-0 text-muted-foreground" />
              </Link>
            ),
          )}
        </Card>

        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-7 shrink-0 items-center justify-center">
            <ShieldCheck size={iconSize.lg} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 text-1 text-muted-foreground">
            Device and session management is coming soon.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
