import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2, CheckCheck, BellOff } from "lucide-react";
import { Screen, TopBar, Chip, Btn } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/kit";
import { notificationIcon } from "@/components/ml/notification-icons";
import { invitations as seedInvitations } from "@/data/collab";
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
  const [invites, setInvites] = useState(seedInvitations);
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
        back="/home"
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
          className="inline-flex items-center gap-1.5 text-1 font-semibold text-foreground"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      {/* Invitations come first: they are the only rows that ask for an answer. */}
      {invites.length && (filter === "All" || filter === "Unread") ? (
        <section className="px-5 pt-5">
          <h2 className="pill mb-2 px-1 text-muted-foreground">Invitations</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {invites.map((inv) => (
              <li key={inv.id} className="p-4">
                <div className="flex gap-3">
                  <img
                    src={inv.inviterPhoto}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-2 font-semibold leading-snug">
                      {inv.inviter} invited you to {inv.projectName}
                    </p>
                    <p className="mt-0.5 truncate text-1 text-muted-foreground">
                      {inv.inviterRole}
                    </p>
                    <p className="mt-0.5 truncate text-1 text-muted-foreground">
                      As {inv.proposedRole} · {inv.sentAt}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Btn
                    variant="outline"
                    className="min-w-0 flex-1 px-3"
                    onClick={() => setInvites((all) => all.filter((i) => i.id !== inv.id))}
                  >
                    Ignore
                  </Btn>
                  <Btn
                    className="min-w-0 flex-1 px-3"
                    onClick={() => navigate({ to: "/collab/invites/$id", params: { id: inv.id } })}
                  >
                    Accept
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="px-5 pt-5 pb-6">
        <h2 className="pill mb-2 px-1 text-muted-foreground">Activity</h2>
        {list.length ? (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {list.map((n) => {
              const Icon = notificationIcon(n.category);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n.id, n.to)}
                    className={`state-layer flex w-full gap-3 px-4 py-3.5 text-left ${
                      n.read ? "" : "bg-subtle"
                    }`}
                  >
                    <span className="relative shrink-0">
                      {n.actor ? (
                        <img
                          src={n.actor.photo}
                          alt=""
                          loading="lazy"
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="grid h-11 w-11 place-items-center rounded-full bg-subtle"
                        >
                          <Icon size={20} strokeWidth={1.75} />
                        </span>
                      )}
                      {n.actor ? (
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-background"
                        >
                          <Icon size={12} strokeWidth={2} />
                        </span>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                          {n.title}
                        </span>
                        <span className="shrink-0 text-1 text-muted-foreground">{n.when}</span>
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-1 leading-snug text-muted-foreground">
                        {n.body}
                      </span>
                      {n.cta ? (
                        <span className="mt-1.5 block text-1 font-semibold text-pink-strong">
                          {n.cta}
                        </span>
                      ) : null}
                    </span>
                    {!n.read ? (
                      <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<BellOff size={20} className="text-muted-foreground" />}
            title="Nothing here"
            body="New activity on your bookings, applications and messages shows up here."
          />
        )}
      </section>
    </Screen>
  );
}
