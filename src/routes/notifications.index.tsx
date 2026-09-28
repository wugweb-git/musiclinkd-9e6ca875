import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BellOff,
  BriefcaseBusiness,
  CalendarCheck,
  MessageCircle,
  Inbox,
  Package,
  Star,
  UsersRound,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { EmptyState, LoadError, Loading, Segmented } from "@/components/ml/kit";
import {
  listNotifications,
  markRead,
  type Notification,
  type NotificationKind,
} from "@/lib/notifications.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

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

const filters = ["All", "Unread", "Opportunities", "Bookings", "Messages"] as const;

/** One icon per kind of thing that happened. */
const kindIcon: Record<NotificationKind, LucideIcon> = {
  connection_request: UserRoundPlus,
  connection_accepted: UserRoundPlus,
  message: MessageCircle,
  application_received: BriefcaseBusiness,
  application_status: BriefcaseBusiness,
  booking_requested: CalendarCheck,
  booking_answered: CalendarCheck,
  review_received: Star,
  review_reply: Star,
  review_request: Star,
  collab_invite: UsersRound,
  collab_joined: UsersRound,
  rental_requested: Package,
  rental_answered: Package,
  enquiry_received: Inbox,
};

const groupOf: Record<NotificationKind, (typeof filters)[number]> = {
  connection_request: "Messages",
  connection_accepted: "Messages",
  message: "Messages",
  application_received: "Opportunities",
  application_status: "Opportunities",
  booking_requested: "Bookings",
  booking_answered: "Bookings",
  review_received: "All",
  review_reply: "All",
  review_request: "All",
  collab_invite: "All",
  collab_joined: "All",
  rental_requested: "Bookings",
  rental_answered: "Bookings",
  enquiry_received: "Bookings",
};

/** "4 minutes ago" is a lie the moment the tab sits idle; this says the day and time instead. */
function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Everything that happened, written by the database as it happened. */
function NotificationsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const { signedIn, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listNotifications);
  const read = useServerFn(markRead);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const mark = useMutation({
    mutationFn: (id?: string) => read({ data: id ? { id } : {} }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
  });

  const all = q.data ?? [];
  const unread = all.filter((n) => !n.read_at).length;
  const list = all.filter((n) =>
    filter === "All" ? true : filter === "Unread" ? !n.read_at : groupOf[n.kind] === filter,
  );

  return (
    <Screen>
      <TopBar
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "Everything that needs you"}
        right={
          unread ? (
            <button
              type="button"
              onClick={() => mark.mutate(undefined)}
              className="pill bg-background text-muted-foreground"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="px-5 pt-3">
        <Segmented value={filter} options={filters} onChange={setFilter} />
      </div>

      <main className="px-5 pt-3">
        {!signedIn && !authLoading ? (
          <EmptyState
            title="Sign in to see your notifications"
            body="Requests, replies and messages land here."
          />
        ) : q.isLoading ? (
          <Loading rows={4} />
        ) : q.isError ? (
          <LoadError what="your notifications" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<BellOff size={iconSize.md} className="text-muted-foreground" />}
            title={filter === "All" ? "Nothing yet" : `Nothing under ${filter}`}
            body="When someone connects, writes, applies or answers you, it appears here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {list.map((n) => (
              <li key={n.id}>
                <NotificationRow n={n} onRead={() => mark.mutate(n.id)} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </Screen>
  );
}

function NotificationRow({ n, onRead }: { n: Notification; onRead: () => void }) {
  const Icon = kindIcon[n.kind];
  const inner = (
    <>
      <span className="relative shrink-0">
        {n.actor?.avatar_url ? (
          <img src={n.actor.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background">
            <Icon size={iconSize.md} aria-hidden />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{n.title}</span>
        {n.body ? (
          <span className="mt-0.5 block line-clamp-2 text-1 text-muted-foreground">{n.body}</span>
        ) : null}
        <span className="mt-1 block text-1 text-muted-foreground">{when(n.created_at)}</span>
      </span>
      {n.read_at ? null : (
        <span aria-label="Unread" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
      )}
    </>
  );
  const className = "state-layer flex w-full items-start gap-3 py-3.5 text-left";

  return n.href ? (
    <Link to={n.href} onClick={onRead} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onRead} className={className}>
      {inner}
    </button>
  );
}
