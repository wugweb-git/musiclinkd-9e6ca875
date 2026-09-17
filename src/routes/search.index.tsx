import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { History, MapPin } from "lucide-react";
import { Chip, Screen, SearchBar, VerifiedBadge } from "@/components/ml/ui";
import { StateCard } from "@/components/ml/portfolio";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { searchPeople } from "@/lib/profile-groups.functions";
import { labelFor, talentTypes, useTaxonomy } from "@/lib/taxonomy";
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
                <li key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Link
                    to="/profile/$username"
                    params={{ username: p.username }}
                    className="state-layer flex min-w-0 flex-1 items-center gap-3"
                  >
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="h-11 w-11 shrink-0 rounded-full bg-background" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-2 font-semibold">{p.name}</span>
                        {p.verified ? <VerifiedBadge size={16} /> : null}
                      </span>
                      <span className="block truncate text-1 text-muted-foreground">
                        {p.headline ??
                          p.roles
                            .slice(0, 2)
                            .map((r) => labelFor(options?.person_types, r))
                            .join(" · ")}
                      </span>
                      {p.city ? (
                        <span className="mt-0.5 flex items-center gap-1 text-1 text-muted-foreground">
                          <MapPin size={iconSize.xs} className="shrink-0" aria-hidden />
                          {p.city}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  <SavedToggle targetType="talent" targetId={p.id} size={36} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Screen>
  );
}
