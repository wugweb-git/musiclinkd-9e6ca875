import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { EmptyState, Row } from "@/components/ml/kit";
import {
  readSavedSearches,
  sinceThen,
  unsaveSearch,
  type SavedSearch,
} from "@/lib/device-history";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";

/*
 * The searches someone kept, on this device (see src/lib/device-history.ts). A saved search is a
 * shortcut back to a search, and nothing more: nothing watches it and nothing sends a digest, so
 * this screen promises neither.
 */
export const Route = createFileRoute("/search/saved")({
  head: () => ({
    meta: [
      { title: "Saved searches | MusicLinkd" },
      {
        name: "description",
        content: "The searches you kept, ready to run again.",
      },
      { property: "og:title", content: "Saved searches | MusicLinkd" },
      { property: "og:description", content: "Keep a search and run it again in one tap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedSearches,
});

function SavedSearches() {
  const [list, setList] = useState<SavedSearch[]>([]);
  const { options } = useTaxonomy();
  useEffect(() => setList(readSavedSearches()), []);

  return (
    <Screen>
      <TopBar
        title="Saved searches"
        subtitle={list.length ? `${list.length} kept on this device` : "Kept on this device"}
        back="/search"
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {list.length ? (
          <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
            {list.map((s) => (
              <li key={`${s.query}-${s.role}-${s.verifiedOnly}`} className="flex items-center gap-3 px-4 py-3.5">
                <Link
                  to="/search"
                  search={s.query ? { q: s.query } : {}}
                  className="state-layer min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold">
                    {s.query || "Everyone"}
                  </p>
                  <p className="truncate text-1 text-muted-foreground">
                    {[
                      s.role ? labelFor(options?.person_types, s.role) : "",
                      s.verifiedOnly ? "Verified" : "",
                      `saved ${sinceThen(s.at)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
                <Link
                  to="/search"
                  search={s.query ? { q: s.query } : {}}
                  aria-label={`Run ${s.query || "this search"}`}
                  className="state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                >
                  <Search size={iconSize.sm} aria-hidden />
                </Link>
                <button
                  type="button"
                  aria-label={`Remove ${s.query || "this search"}`}
                  onClick={() => {
                    unsaveSearch(s);
                    setList(readSavedSearches());
                  }}
                  className="state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                >
                  <Trash2 size={iconSize.sm} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No saved searches"
            body="Run a search, pick the filters that matter, then keep it — it will be here to run again."
          >
            <BtnLink to="/search" className="w-full">
              Start a Search
            </BtnLink>
          </EmptyState>
        )}

        {list.length ? (
          <Btn
            variant="ghost"
            className="w-full"
            onClick={() => {
              for (const s of list) unsaveSearch(s);
              setList([]);
            }}
          >
            Clear this list
          </Btn>
        ) : null}

        <Row
          title="Search history"
          subtitle="Everything you searched recently"
          to="/search/history"
        />
      </div>
    </Screen>
  );
}
