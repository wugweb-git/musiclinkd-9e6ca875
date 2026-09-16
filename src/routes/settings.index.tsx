import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card } from "@/components/ml/kit";
import { settingsGroups } from "@/data/settings";

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
      <TopBar title="Settings" subtitle="Account and preferences" back="/me" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        {settingsGroups.map((g) => (
          <div key={g.key} className="space-y-2">
            <h2 className="px-1 pill bg-subtle text-muted-foreground">{g.title}</h2>
            <Card className="p-0">
              {g.rows.map((r) => (
                <Link
                  key={r.key}
                  to={r.to}
                  className="flex items-center gap-3 border-b border-border p-4 last:border-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-1 font-semibold">{r.label}</span>
                    <span className="block truncate text-0 text-muted-foreground">{r.hint}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </Card>
          </div>
        ))}
        <p className="px-1 text-center text-0 text-muted-foreground">MusicLinkd · v1.0 preview</p>
      </div>
    </Screen>
  );
}
