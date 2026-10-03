import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import { Bell, ChevronRight, Inbox, MessageCircle, Megaphone, type LucideIcon } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox | MusicLinkd" },
      { name: "description", content: "Your conversations, notifications, leads and applications in one place." },
      { property: "og:title", content: "Inbox | MusicLinkd" },
      { property: "og:description", content: "Everything waiting for you on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InboxScreen,
});

const ROWS: { to: NonNullable<LinkProps["to"]>; label: string; hint: string; icon: LucideIcon }[] = [
  { to: "/messages", label: "Conversations", hint: "Messages with your connections", icon: MessageCircle },
  { to: "/notifications", label: "Notifications", hint: "Requests, replies and updates", icon: Bell },
  { to: "/leads", label: "Leads", hint: "Enquiries for your services", icon: Inbox },
  { to: "/opportunities/applications", label: "Applications", hint: "Work you've applied for", icon: Megaphone },
];

function InboxScreen() {
  return (
    <Screen>
      <TopBar title="Inbox" back="/home" />
      <ul className="mx-5 mt-5 divide-y divide-border/70 overflow-hidden rounded-lg bg-card">
        {ROWS.map(({ to, label, hint, icon: Icon }) => (
          <li key={label}>
            <Link
              to={to}
              className="state-layer flex min-h-touch items-center gap-3 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon size={iconSize.md} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-2 font-medium">{label}</span>
                <span className="block truncate text-1 text-muted-foreground">{hint}</span>
              </span>
              <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
