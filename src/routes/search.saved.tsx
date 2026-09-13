import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, BellOff, Search, Trash2 } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Row, StatusPill } from "@/components/ml/kit";
import { savedSearches, timeAgo } from "@/data/search-meta";

export const Route = createFileRoute("/search/saved")({
  head: () => ({
    meta: [
      { title: "Saved searches & alerts | MusicLinkd" },
      {
        name: "description",
        content:
          "Keep the searches you run often, and get alerted when new talent, studios or gear match them.",
      },
      { property: "og:title", content: "Saved searches & alerts | MusicLinkd" },
      {
        property: "og:description",
        content: "Save a search once and let MusicLinkd tell you when something new matches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedSearches,
});

function SavedSearches() {
  const [alerts, setAlerts] = useState<Record<string, boolean>>(
    Object.fromEntries(savedSearches.map((s) => [s.id, s.alerts])),
  );
  const [removed, setRemoved] = useState<string[]>([]);
  const list = savedSearches.filter((s) => !removed.includes(s.id));

  return (
    <Screen>
      <TopBar
        title="Saved searches"
        subtitle={`${list.length} saved · ${Object.values(alerts).filter(Boolean).length} with alerts`}
        back="/search"
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {list.length ? (
          list.map((s) => (
            <Card key={s.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-2 leading-tight">{s.label}</h2>
                  <p className="mt-1 text-1 text-muted-foreground">Saved {timeAgo(s.createdAt)}</p>
                </div>
                {s.newCount ? <StatusPill label={`${s.newCount} new`} tone="brand" /> : null}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {s.filters.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-subtle px-2.5 py-1 text-1 font-semibold text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {alerts[s.id] ? (
                    <Bell size={16} className="shrink-0 text-primary" aria-hidden />
                  ) : (
                    <BellOff size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <p className="min-w-0 text-1 font-semibold">
                    {alerts[s.id] ? "Alerts on — weekly digest" : "Alerts off"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlerts((a) => ({ ...a, [s.id]: !a[s.id] }))}
                  className="shrink-0 text-1 font-semibold text-primary"
                >
                  {alerts[s.id] ? "Turn off" : "Turn on"}
                </button>
              </div>

              <div className="flex gap-2">
                <Link to="/search" className="flex-1">
                  <Btn className="w-full">
                    <span className="inline-flex items-center gap-2">
                      <Search size={16} aria-hidden /> Run search
                    </span>
                  </Btn>
                </Link>
                <Btn
                  variant="outline"
                  aria-label={`Delete ${s.label}`}
                  onClick={() => setRemoved((r) => [...r, s.id])}
                >
                  <Trash2 size={16} aria-hidden />
                </Btn>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No saved searches"
            body="Run a search, apply the filters that matter, then save it. We will tell you when something new matches."
          >
            <Link to="/search">
              <Btn className="w-full">Start a search</Btn>
            </Link>
          </EmptyState>
        )}

        <Row
          title="Search history"
          subtitle="Everything you searched recently"
          to="/search/history"
        />
        <Row
          title="Notification settings"
          subtitle="Choose how alerts reach you"
          to="/notifications/settings"
        />
      </div>
    </Screen>
  );
}
