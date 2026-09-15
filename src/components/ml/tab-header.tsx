import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { LogoMark } from "./logo";
import { ViewerAvatar } from "./viewer";

type SearchTarget = { to: "/search" | "/marketplace/search"; placeholder: string };

const roundBtn =
  "hit-area state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-transform duration-125 ease-standard active:scale-95";

/**
 * The one header for the bottom-tab screens (Home, Discover, Connections, Market): sticky, the
 * tab's title on the left, then the screen's own actions, search, notifications and your avatar.
 * Search is an icon; tapping it opens a search field across the header (Escape or ✕ closes it),
 * and submitting opens the screen's search page with the query. Home shows the brand as its title.
 */
export function TabHeader({
  title,
  brand = false,
  actions,
  search,
  children,
}: {
  title: string;
  brand?: boolean;
  /** Screen-specific icon buttons, placed before search and notifications. */
  actions?: ReactNode;
  search?: SearchTarget;
  /** A row under the title, e.g. a location line. */
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setQ("");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="flex h-11 items-center gap-2">
        {open && search ? (
          <form
            role="search"
            className="flex min-w-0 flex-1 animate-in items-center gap-2 fade-in slide-in-from-right-4 duration-200"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: search.to, search: q.trim() ? { q: q.trim() } : {} });
            }}
          >
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-ring">
              <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={input}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                }}
                placeholder={search.placeholder}
                aria-label={search.placeholder}
                enterKeyHint="search"
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <button type="button" aria-label="Close search" onClick={close} className={roundBtn}>
              <X size={18} aria-hidden />
            </button>
          </form>
        ) : (
          <>
            {brand ? (
              <h1 className="flex min-w-0 flex-1 items-center gap-2 text-2 font-semibold">
                <span aria-hidden className="shrink-0 text-brand">
                  <LogoMark className="w-6" />
                </span>
                <span className="truncate">{title}</span>
              </h1>
            ) : (
              <h1 className="min-w-0 flex-1 truncate text-3 font-bold leading-tight">{title}</h1>
            )}
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              {search ? (
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => setOpen(true)}
                  className={roundBtn}
                >
                  <Search size={18} aria-hidden />
                </button>
              ) : null}
              <Link to="/notifications" aria-label="Notifications" className={roundBtn}>
                <Bell size={18} aria-hidden />
              </Link>
              <ViewerAvatar className="h-10 w-10" />
            </div>
          </>
        )}
      </div>
      {children ? <div className="mt-2">{children}</div> : null}
    </header>
  );
}
