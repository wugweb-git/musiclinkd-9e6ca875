import { Link } from "@tanstack/react-router";
import { Bell, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { unreadCount } from "@/lib/notifications.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

/*
 * The notifications bell, sized and styled to sit beside SearchIconButton in a tab screen's
 * header. Home and Discover both had their own; Discover's was a bare 🔔 with no label and
 * nothing behind it.
 */
export function NotificationsBell({ tone = "card" }: { tone?: "card" | "onInk" }) {
  const surface = tone === "onInk" ? "text-background" : "text-foreground";
  const { signedIn } = useAuth();
  const load = useServerFn(unreadCount);
  // The dot means something now: how many notifications this account has not opened.
  const q = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const unread = q.data ?? 0;
  return (
    <Link
      to="/notifications"
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      className={`hit-area state-layer relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-125 ease-standard active:scale-97 ${surface}`}
    >
      <Bell size={iconSize.md} aria-hidden />
      <span className="sr-only">
        {unread ? `Notifications (${unread} unread)` : "Notifications"}
      </span>
      {unread ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background ring-2 ring-background"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

/*
 * Search as an icon: the button sits with a screen header's other actions; tapping it opens the
 * search field in the row below, focused. Submitting opens the screen's search page with the query;
 * ✕ or Escape closes the field.
 */
export function SearchIconButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={open ? "Close search" : "Search"}
      aria-expanded={open}
      onClick={onToggle}
      className="hit-area state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-125 ease-standard active:scale-97"
    >
      {open ? <X size={iconSize.md} aria-hidden /> : <Search size={iconSize.md} aria-hidden />}
    </button>
  );
}
