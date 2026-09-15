import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import type { ReactNode } from "react";

import { LogoMark } from "./logo";
import { ViewerAvatar } from "./viewer";

/**
 * The one header for the bottom-tab screens (Home, Discover, Connections, Market): sticky, the
 * tab's title on the left, the screen's own actions then notifications and your avatar on the
 * right, and an optional row below (search, location). Home shows the brand in place of a title.
 */
export function TabHeader({
  title,
  brand = false,
  actions,
  children,
}: {
  title: string;
  brand?: boolean;
  /** Screen-specific icon buttons, placed before notifications. */
  actions?: ReactNode;
  /** A row under the title, e.g. the search bar. */
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="flex h-11 items-center gap-3">
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
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="hit-area state-layer flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <Bell size={18} aria-hidden />
          </Link>
          <ViewerAvatar className="h-10 w-10" />
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </header>
  );
}
