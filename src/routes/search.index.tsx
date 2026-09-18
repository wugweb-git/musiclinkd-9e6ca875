import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Chip, Screen, SearchBar } from "@/components/ml/ui";
import { PersonRow } from "@/components/ml/cards";
import { StateCard } from "@/components/ml/portfolio";
import { searchPeople } from "@/lib/profile-groups.functions";
import { useSearchRecorder } from "@/lib/search-events";
import { talentTypes, useTaxonomy } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";

/*
 * Search over people: the live profiles table, filtered by what the person typed and by a role
 * they picked from the taxonomy. The count is the count the database returns — there is no
 * estimate, and no filter that does not narrow anything.
 */
export const Route = createFileRoute("/search/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Search Results | MusicLinkd" },
      {
        name: "description",
        content: "Find people in India's music industry by name, role, city and verification.",
      },
      { property: "og:title", content: "Search Results | MusicLinkd" },
      { property: "og:description", content: "Search talent across MusicLinkd." },
    ],
  }),
  component: SearchResults,
});

/** A keystroke should not be a query; this waits for the typing to stop. */
function useSettled(value: string, ms = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

function SearchResults() {
  const [q, setQ] = useState(Route.useSearch().q ?? "");
  const [role, setRole] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const term = useSettled(q);
  const { options } = useTaxonomy();

  const find = useServerFn(searchPeople);
  const results = useQuery({
    queryKey: ["search", "people", term, role, verifiedOnly],
    queryFn: () =>
      find({
        data: {
          ...(term ? { q: term } : {}),
          ...(role ? { role } : {}),
          ...(verifiedOnly ? { verifiedOnly: true } : {}),
        },
      }),
  });

  const people = results.data?.people ?? [];
  const total = results.data?.total ?? 0;

  // A search is remembered on this device and counted toward Trending searches once the typing
  // stops, with what it actually found.
  useSearchRecorder("discover", results.isSuccess ? term : "", total);
  // A handful of roles to narrow by; the full list is the categories screen.
  const roles = talentTypes(options?.person_types ?? []).slice(0, 8);

  return (
    <Screen>
      <div className="sticky top-0 z-bar border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-3">
          <Link
            to="/discover"
            aria-label="Back to Discover"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            ←
          </Link>
          <h1 className="text-3">Search</h1>
          <Link
            to="/search/history"
            aria-label="Search history"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <History size={iconSize.md} aria-hidden />
          </Link>
        </div>
        <SearchBar value={q} onChange={setQ} />
        <div className="rail mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
            Verified
          </Chip>
          {roles.map((o) => (
            <Chip
              key={o.slug}
              active={role === o.slug}
              onClick={() => setRole(role === o.slug ? "" : o.slug)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {results.isLoading ? (
          <ul className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-20 animate-pulse rounded-lg bg-subtle" />
            ))}
          </ul>
        ) : results.isError ? (
          <StateCard
            title="We couldn't run that search"
            body="Check your connection, then try again."
          />
        ) : !people.length ? (
          <StateCard
            title="Nobody matched"
            body={
              term || role || verifiedOnly
                ? "Try fewer words, or drop a filter."
                : "Type a name, a role or a city to start."
            }
          />
        ) : (
          <>
            <p className="pb-3 text-1 text-muted-foreground">
              <strong className="text-foreground">
                {total} {total === 1 ? "person" : "people"}
              </strong>
              {total > people.length ? ` · showing the first ${people.length}` : ""}
            </p>
            <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
              {people.map((p) => (
                <PersonRow key={p.id} person={p} roleLabels={options?.person_types} />
              ))}
            </ul>
          </>
        )}
      </div>
    </Screen>
  );
}
