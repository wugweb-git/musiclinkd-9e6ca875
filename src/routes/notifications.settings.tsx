import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoonStar } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card } from "@/components/ml/kit";
import { channels, defaultPreferences, categoryMeta, quietHours, type Channel } from "@/data/notifications";

export const Route = createFileRoute("/notifications/settings")({
  head: () => ({
    meta: [
      { title: "Notification settings | MusicLinkd" },
      { name: "description", content: "Choose what reaches you by push, email or SMS, and set quiet hours." },
      { property: "og:title", content: "Notification settings | MusicLinkd" },
      { property: "og:description", content: "Control how MusicLinkd reaches you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationSettings,
});

function NotificationSettings() {
  const [prefs, setPrefs] = useState(defaultPreferences);
  const [quiet, setQuiet] = useState(quietHours.enabled);

  const toggle = (category: string, ch: Channel) =>
    setPrefs((list) => list.map((p) => (p.category === category ? { ...p, [ch]: !p[ch] } : p)));

  return (
    <Screen>
      <TopBar title="Notifications" subtitle="Channels and quiet hours" back="/notifications" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-1">
          <h2 className="text-[15px]">How we reach you</h2>
          {channels.map((c) => (
            <p key={c.key} className="text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{c.label}</span> — {c.hint}
            </p>
          ))}
        </Card>

        {prefs.map((p) => (
          <Card key={p.category} className="space-y-3">
            <p className="text-[14px] font-semibold">
              <span aria-hidden className="mr-1.5">
                {categoryMeta[p.category].emoji}
              </span>
              {categoryMeta[p.category].label}
            </p>
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={p[c.key]}
                  onClick={() => toggle(p.category, c.key)}
                  className={`min-h-9 rounded-full px-3.5 text-[12px] font-semibold ${
                    p[c.key] ? "bg-primary text-primary-foreground" : "bg-subtle text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Card>
        ))}

        <Card className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <MoonStar size={15} /> Quiet hours
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={quiet}
              aria-label="Quiet hours"
              onClick={() => setQuiet((q) => !q)}
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${quiet ? "bg-primary" : "bg-subtle"}`}
            >
              <span className={`block h-5 w-5 rounded-full bg-background transition-transform ${quiet ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground">
            {quiet ? `Silent from ${quietHours.from} to ${quietHours.to}. Confirmed booking changes still come through.` : "Notifications arrive at any hour."}
          </p>
        </Card>
      </div>
    </Screen>
  );
}
