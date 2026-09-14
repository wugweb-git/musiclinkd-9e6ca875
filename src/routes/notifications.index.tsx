import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2, CheckCheck } from "lucide-react";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import {
  notifications as seed,
  categoryMeta,
  unreadCount,
  type NotificationCategory,
} from "@/data/notifications";

export const Route = createFileRoute("/notifications/")({
  head: () => ({
    meta: [
      { title: "Notifications | MusicLinkd" },
      {
        name: "description",
        content: "Bookings, applications, messages and verification updates in one timeline.",
      },
      { property: "og:title", content: "Notifications | MusicLinkd" },
      { property: "og:description", content: "Everything that needs your attention." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsScreen,
});

const filters = ["All", "Unread", "Opportunities", "Bookings", "Messages", "Account"] as const;

const filterMatch: Record<string, NotificationCategory[]> = {
  Opportunities: ["opportunities"],
  Bookings: ["bookings"],
  Messages: ["messages", "collaboration"],
  Account: ["system", "verification", "reviews", "marketplace"],
};

function NotificationsScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState(seed);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const list = items.filter((n) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return filterMatch[filter]?.includes(n.category) ?? true;
  });

  const open = (id: string, to: string) => {
    setItems((all) => all.map((n) => (n.id === id ? { ...n, read: true } : n)));
    navigate({ to });
  };

  return (
    <Screen>
      <TopBar
        title="Notifications"
        subtitle={unreadCount(items) ? `${unreadCount(items)} unread` : "You are all caught up"}
        back="/feed"
        right={
          <Link
            to="/notifications/settings"
            aria-label="Notification settings"
            className="grid h-10 w-10 place-items-center rounded-full bg-subtle"
          >
            <Settings2 size={16} />
          </Link>
        }
      />

      <div className="rail no-scrollbar flex gap-2 overflow-x-auto px-5 pt-3">
        {filters.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <div className="px-5 pt-3">
        <button
          type="button"
          onClick={() => setItems((all) => all.map((n) => ({ ...n, read: true })))}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground"
        >
          <CheckCheck size={14} /> Mark all as read
        </button>
      </div>

      <div className="space-y-2 px-5 pt-3 pb-6">
        {list.length ? (
          list.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => open(n.id, n.to)}
              className="block w-full text-left"
            >
              <Card className={`flex gap-3 ${n.read ? "" : "border-primary/40 bg-subtle"}`}>
                {n.actor ? (
                  <img
                    src={n.actor.photo}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-subtle text-[16px]"
                  >
                    {categoryMeta[n.category].emoji}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{n.when}</span>
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                    {n.body}
                  </span>
                  {n.cta ? (
                    <span className="mt-1.5 block text-[12px] font-semibold text-foreground">
                      {n.cta} →
                    </span>
                  ) : null}
                </span>
                {!n.read ? (
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                ) : null}
              </Card>
            </button>
          ))
        ) : (
          <EmptyState
            title="Nothing here"
            body="New activity on your bookings, applications and messages shows up here."
          />
        )}
      </div>
    </Screen>
  );
}
