import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, Row } from "@/components/ml/kit";
import {
  forgetAllSearches,
  forgetSearch,
  readRecentSearches,
  sinceThen,
  type RecentSearch,
} from "@/lib/device-history";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/search/history")({
  head: () => ({
    meta: [
      { title: "Search history | MusicLinkd" },
      {
        name: "description",
        content: "Everything you searched recently, grouped by area, with one tap to clear it.",
      },
      { property: "og:title", content: "Search history | MusicLinkd" },
      { property: "og:description", content: "Review or clear your recent MusicLinkd searches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchHistory,
});

function SearchHistory() {
  const [list, setList] = useState<RecentSearch[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  // The store is on this device, so it is read after the screen mounts, never on the server.
  useEffect(() => setList(readRecentSearches()), []);

  return (
    <Screen>
      <TopBar
        title="Search history"
        subtitle="Only visible to you"
        back="/search"
        right={
          list.length ? (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="shrink-0 text-1 font-semibold text-foreground"
            >
              Clear all
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {list.length ? (
          <Card className="p-0">
            {list.map((e) => (
              <div
                key={e.query}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <Clock size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />
                <Link to="/search" search={{ q: e.query }} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.query}</p>
                  <p className="truncate text-1 text-muted-foreground">
                    {e.results} {e.results === 1 ? "result" : "results"} · {sinceThen(e.at)}
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label={`Remove ${e.query}`}
                  onClick={() => {
                    forgetSearch(e.query);
                    setList(readRecentSearches());
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                >
                  <X size={iconSize.sm} aria-hidden />
                </button>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState
            title={cleared ? "History cleared" : "Nothing here yet"}
            body="Searches you run appear here so you can pick one back up. They stay on this device."
          >
            <BtnLink to="/search" className="w-full">
              Start a Search
            </BtnLink>
          </EmptyState>
        )}

        <Row
          title="Recently viewed"
          subtitle="Profiles and listings you opened"
          to="/recently-viewed"
        />
      </div>

      <Dialog
        open={confirm}
        title="Clear search history?"
        body="This removes every recent search kept on this device. Saved searches are not affected."
        onClose={() => setConfirm(false)}
      >
        <Btn
          onClick={() => {
            forgetAllSearches();
            setList([]);
            setCleared(true);
            setConfirm(false);
          }}
        >
          Clear History
        </Btn>
        <Btn variant="ghost" onClick={() => setConfirm(false)}>
          Keep It
        </Btn>
      </Dialog>
    </Screen>
  );
}
