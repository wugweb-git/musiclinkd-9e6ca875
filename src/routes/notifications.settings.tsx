import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MoonStar } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, Switch } from "@/components/ml/kit";
import { notificationIcon } from "@/components/ml/notification-icons";
import {
  channels,
  defaultPreferences,
  categoryMeta,
  quietHours,
  type Channel,
} from "@/data/notifications";
import { iconSize } from "@/lib/tokens";
import { useAuth } from "@/hooks/use-auth";
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  type ChannelPrefs,
} from "@/lib/notifications.functions";

export const Route = createFileRoute("/notifications/settings")({
  head: () => ({
    meta: [
      { title: "Notification settings | MusicLinkd" },
      {
        name: "description",
        content: "Choose what reaches you by push, email or SMS, and set quiet hours.",
      },
      { property: "og:title", content: "Notification settings | MusicLinkd" },
      { property: "og:description", content: "Control how MusicLinkd reaches you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationSettings,
});

function NotificationSettings() {
  const { signedIn } = useAuth();
  const load = useServerFn(getNotificationPrefs);
  const save = useServerFn(saveNotificationPrefs);
  const stored = useQuery({
    queryKey: ["notifications", "prefs"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const [prefs, setPrefs] = useState(defaultPreferences);
  const [quiet, setQuiet] = useState(quietHours.enabled);

  // What's saved wins over the defaults, category by category, once it arrives.
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current || !stored.data) return;
    applied.current = true;
    const saved = stored.data;
    setPrefs((list) => list.map((p) => ({ ...p, ...saved.channels[p.category] })));
    setQuiet(saved.quietHours);
  }, [stored.data]);

  const persist = useMutation({
    mutationFn: (next: { prefs: typeof prefs; quiet: boolean }) =>
      save({
        data: {
          channels: Object.fromEntries(
            next.prefs.map((p) => [p.category, { push: p.push, email: p.email, sms: p.sms }]),
          ) as ChannelPrefs,
          quietHours: next.quiet,
        },
      }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  // Every change saves as it's made; signed out, the screen still works for this visit.
  const commit = (next: typeof prefs, nextQuiet: boolean) => {
    setPrefs(next);
    setQuiet(nextQuiet);
    if (signedIn) persist.mutate({ prefs: next, quiet: nextQuiet });
  };

  const toggle = (category: string, ch: Channel) =>
    commit(
      prefs.map((p) => (p.category === category ? { ...p, [ch]: !p[ch] } : p)),
      quiet,
    );

  return (
    <Screen>
      <TopBar title="Notifications" subtitle="Channels and quiet hours" back="/notifications" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-1">
          <h2 className="text-sm">How we reach you</h2>
          {channels.map((c) => (
            <p key={c.key} className="text-1 text-muted-foreground">
              <span className="font-semibold text-foreground">{c.label}</span> — {c.hint}
            </p>
          ))}
        </Card>

        {prefs.map((p) => (
          <Card key={p.category} className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              {(() => {
                const Icon = notificationIcon(p.category);
                return <Icon size={16} aria-hidden />;
              })()}
              {categoryMeta[p.category].label}
            </p>
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={p[c.key]}
                  onClick={() => toggle(p.category, c.key)}
                  className={`min-h-9 rounded-full px-3.5 text-1 font-semibold ${
                    p[c.key] ? "bg-ink text-ink-foreground" : "bg-background text-muted-foreground"
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
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MoonStar size={iconSize.sm} /> Quiet hours
            </p>
            <Switch checked={quiet} onChange={(next) => commit(prefs, next)} label="Quiet hours" />
          </div>
          <p className="text-1 text-muted-foreground">
            {quiet
              ? `Silent from ${quietHours.from} to ${quietHours.to}. Confirmed booking changes still come through.`
              : "Notifications arrive at any hour."}
          </p>
        </Card>
      </div>
    </Screen>
  );
}
