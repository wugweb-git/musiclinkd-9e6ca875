import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, ChevronRight, Inbox, MessageCircle, Megaphone, type LucideIcon } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { LoadError, Loading } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import { listConversations } from "@/lib/messages.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox | MusicLinkd" },
      {
        name: "description",
        content: "Your conversations, notifications, leads and applications in one place.",
      },
      { property: "og:title", content: "Inbox | MusicLinkd" },
      { property: "og:description", content: "Everything waiting for you on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InboxScreen,
});

const ROWS: { to: NonNullable<LinkProps["to"]>; label: string; hint: string; icon: LucideIcon }[] =
  [
    {
      to: "/messages",
      label: "Conversations",
      hint: "Messages with your connections",
      icon: MessageCircle,
    },
    {
      to: "/notifications",
      label: "Notifications",
      hint: "Requests, replies and updates",
      icon: Bell,
    },
    { to: "/leads", label: "Leads", hint: "Enquiries for your services", icon: Inbox },
    {
      to: "/opportunities/applications",
      label: "Applications",
      hint: "Work you've applied for",
      icon: Megaphone,
    },
  ];

function InboxScreen() {
  const { signedIn } = useAuth();
  const load = useServerFn(listConversations);
  // Shares its cache with Connections, so opening either after the other is instant.
  const threads = useQuery({
    queryKey: ["conversations", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
    staleTime: 15_000,
    refetchInterval: signedIn ? 30_000 : false,
  });
  const unread = (threads.data ?? []).reduce((n, t) => n + t.unread, 0);
  const unreadThreads = (threads.data ?? []).filter((t) => t.unread > 0).length;

  return (
    <Screen>
      <TopBar title="Inbox" back="/home" />
      {signedIn && threads.isPending ? (
        <div className="px-5 pt-5">
          <Loading rows={2} />
        </div>
      ) : null}
      {signedIn && threads.isError ? (
        <div className="px-5 pt-5">
          <LoadError what="your inbox" />
          <Btn variant="outline" className="mt-3 w-full" onClick={() => void threads.refetch()}>
            Retry
          </Btn>
        </div>
      ) : null}
      {threads.data ? (
        <Link
          to="/messages"
          className="lift relative mx-5 mt-5 block overflow-hidden rounded-3xl bg-ink px-5 py-6 text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-brand/35 blur-3xl animate-breathe"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-1 w-1/3 bg-brand"
          />
          <span className="relative block">
            <span className="block text-1 text-ink-foreground/70">Messages</span>
            <span className="mt-1 block text-3 font-semibold">
              {unread === 0 ? "You're all caught up" : `${unread} unread`}
            </span>
            <span className="mt-1 block text-sm text-ink-foreground/70">
              {unread === 0
                ? `${threads.data.length} conversation${threads.data.length === 1 ? "" : "s"}`
                : `In ${unreadThreads} conversation${unreadThreads === 1 ? "" : "s"}`}
            </span>
          </span>
        </Link>
      ) : null}
      <ul className="mx-5 mt-5 divide-y divide-border/70 overflow-hidden rounded-lg bg-card">
        {ROWS.map(({ to, label, hint, icon: Icon }) => (
          <li key={label}>
            <Link
              to={to}
              className="state-layer flex min-h-touch items-center gap-3 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <Icon size={iconSize.md} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-2 font-medium">{label}</span>
                <span className="block truncate text-1 text-muted-foreground">{hint}</span>
              </span>
              {label === "Conversations" && unread > 0 ? (
                <span
                  aria-label={`${unread} unread`}
                  className="h-2.5 w-2.5 rounded-full bg-brand"
                />
              ) : null}
              <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
