import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, X } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, Row, Segmented } from "@/components/ml/kit";
import { searchHistory, scopeLabel, timeAgo } from "@/data/search-meta";

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

const tabs = ["All", "Talent", "Studios", "Market", "Opportunities"] as const;
type Tab = (typeof tabs)[number];

function SearchHistory() {
  const [tab, setTab] = useState<Tab>("All");
  const [cleared, setCleared] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);

  const list = cleared
    ? []
    : searchHistory
        .filter((e) => !removed.includes(e.id))
        .filter((e) => tab === "All" || scopeLabel[e.scope] === tab);

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
        <Segmented value={tab} options={tabs} onChange={setTab} />

        {list.length ? (
          <Card className="p-0">
            {list.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <Clock size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                <Link to="/search" className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.query}</p>
                  <p className="truncate text-1 text-muted-foreground">
                    {scopeLabel[e.scope]} · {e.resultCount} results · {timeAgo(e.searchedAt)}
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label={`Remove ${e.query}`}
                  onClick={() => setRemoved((r) => [...r, e.id])}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState
            title={cleared ? "History cleared" : "Nothing here yet"}
            body="Searches you run appear here so you can pick one back up. Nobody else can see them."
          >
            <BtnLink to="/search" className="w-full">
              Start a Search
            </BtnLink>
          </EmptyState>
        )}

        <Row title="Saved searches" subtitle="Keep a search and get alerts" to="/search/saved" />
        <Row
          title="Recently viewed"
          subtitle="Profiles and listings you opened"
          to="/recently-viewed"
        />
      </div>

      <Dialog
        open={confirm}
        title="Clear search history?"
        body="This removes every recent search on this account. Saved searches are not affected."
        onClose={() => setConfirm(false)}
      >
        <Btn
          onClick={() => {
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
