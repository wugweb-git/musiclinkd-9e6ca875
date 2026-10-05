import { createFileRoute, Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Inbox,
  MessageCircle,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { LoadError, Loading, Segmented } from "@/components/ml/kit";
import { MessagesPanel } from "@/components/ml/inbox-messages";
import { BookingRequestsPanel } from "@/components/ml/inbox-bookings";
import { useAuth } from "@/hooks/use-auth";
import { listConversations } from "@/lib/messages.functions";
import { iconSize } from "@/lib/tokens";

/*
 * One Inbox (owner, 4 Oct 2026, queue item 10): open-ended communication and leads around what
 * people offer. All · Messages · Booking Requests (enquiries are just messages, owner 5 Oct); /messages and
 * /business/bookings/requests redirect here with their tab. Enquiry state and booking state are
 * two separate machines, each shown in its own tab, never mapped into each other.
 */
const INBOX_TABS = ["all", "messages", "bookings"] as const;
type InboxTab = (typeof INBOX_TABS)[number];
const tabLabels: Record<InboxTab, string> = {
  all: "All",
  messages: "Messages",
  bookings: "Booking Requests",
};

export const Route = createFileRoute("/inbox")({
  validateSearch: (s: Record<string, unknown>): { tab?: InboxTab } =>
    (INBOX_TABS as readonly unknown[]).includes(s["tab"]) ? { tab: s["tab"] as InboxTab } : {},
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

// A row either switches the Inbox's tab or opens another screen.
const ROWS: ({ label: string; hint: string; icon: LucideIcon } & (
  { tab: InboxTab } | { to: NonNullable<LinkProps["to"]> }
))[] = [
  {
    tab: "messages",
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
  {
    tab: "bookings",
    label: "Booking Requests",
    hint: "Requests to book what you offer",
    icon: CalendarDays,
  },
  {
    to: "/opportunities/applications",
    label: "Applications",
    hint: "Work you've applied for",
    icon: Megaphone,
  },
];

function InboxScreen() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const tab: InboxTab = search.tab ?? "all";
  const setTab = (next: InboxTab) =>
    void navigate({ to: "/inbox", search: next === "all" ? {} : { tab: next }, replace: true });

  return (
    <Screen>
      <TopBar title="Inbox" back="/home" />
      <div className="px-5 pt-4">
        <Segmented value={tab} options={INBOX_TABS} labels={tabLabels} onChange={setTab} />
      </div>
      {tab === "messages" ? <MessagesPanel /> : null}
      {tab === "bookings" ? <BookingRequestsPanel /> : null}
      {tab === "all" ? <InboxAll onTab={setTab} /> : null}
    </Screen>
  );
}

function InboxAll({ onTab }: { onTab: (tab: InboxTab) => void }) {
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
    <>
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
        <button
          type="button"
          onClick={() => onTab("messages")}
          className="lift relative mx-5 mt-5 w-[calc(100%-2.5rem)] text-left block overflow-hidden rounded-3xl bg-ink px-5 py-6 text-ink-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </button>
      ) : null}
      <ul className="mx-5 mt-5 divide-y divide-border/70 overflow-hidden rounded-lg bg-card">
        {ROWS.map((row) => {
          const { label, hint, icon: Icon } = row;
          const cls =
            "state-layer flex min-h-touch w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";
          const inner = (
            <>
              <Icon size={iconSize.md} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-2 font-medium">{label}</span>
                <span className="block truncate text-1 text-muted-foreground">{hint}</span>
              </span>
              {"tab" in row && row.tab === "messages" && unread > 0 ? (
                <span
                  aria-label={`${unread} unread`}
                  className="h-2.5 w-2.5 rounded-full bg-brand"
                />
              ) : null}
              <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
            </>
          );
          return (
            <li key={label}>
              {"tab" in row ? (
                <button type="button" onClick={() => onTab(row.tab)} className={cls}>
                  {inner}
                </button>
              ) : (
                <Link to={row.to} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
