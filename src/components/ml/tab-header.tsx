import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { iconSize } from "@/lib/tokens";

/*
 * The notifications bell, sized and styled to sit beside SearchIconButton in a tab screen's
 * header. Home and Discover both had their own; Discover's was a bare 🔔 with no label and
 * nothing behind it.
 *
 * There is no live notifications backend yet, so this no longer shows an unread count (that
 * number came from static seed data and would have looked real). A neutral dot marks the module
 * as not live yet, matching the bottom-nav "Connections" tab.
 */
export function NotificationsBell({ tone = "card" }: { tone?: "card" | "onInk" }) {
  const surface =
    tone === "onInk"
      ? "border-background/25 bg-background/10 text-background backdrop-blur"
      : "border-border bg-card";
  return (
    <Link
      to="/notifications"
      aria-label="Notifications — coming soon"
      className={`hit-area state-layer relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-transform duration-125 ease-standard active:scale-97 ${surface}`}
    >
      <Bell size={iconSize.md} aria-hidden />
      <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
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
      className="hit-area state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-transform duration-125 ease-standard active:scale-97"
    >
      {open ? <X size={iconSize.md} aria-hidden /> : <Search size={iconSize.md} aria-hidden />}
    </button>
  );
}

export function SearchField({
  to,
  placeholder,
  onClose,
}: {
  to: "/search" | "/marketplace/search";
  placeholder: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  return (
    <form
      role="search"
      className="animate-in fade-in slide-in-from-top-2 duration-200"
      onSubmit={(e) => {
        e.preventDefault();
        void navigate({ to, search: q.trim() ? { q: q.trim() } : {} });
      }}
    >
      <label className="flex h-14 items-center gap-3 rounded-full bg-subtle px-5 focus-within:ring-2 focus-within:ring-ring">
        <Search size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          enterKeyHint="search"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
    </form>
  );
}
