import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { PersonRow } from "@/components/ml/cards";
import { Card, EmptyState, StatusPill, StateCard } from "@/components/ml/kit";

import { CollabKindSheet } from "@/components/ml/collab";
import { categories } from "@/data/discover";
import { workType } from "@/data/portfolio";
import { listPeopleByRole } from "@/lib/profile-groups.functions";
import { listTrendingWork, type TrendingItem } from "@/lib/trending.functions";
import { loadDbOpportunities } from "@/lib/opportunity-view";
import { useTaxonomy } from "@/lib/taxonomy";
import { joinParts } from "@/lib/utils";
import { WorkTypeIcon } from "@/components/ml/portfolio";

/*
 * One Discover slug, every subject. `/discover/<slug>` is the shareable form of a Discover filter
 * (owner, 28 Sep 2026):
 *
 *   any persona type   /discover/singers · /discover/venue · /discover/music_label
 *   music              /discover/music     — work published by people you can hire
 *   projects           /discover/projects  — work in progress you can join
 *
 * A type is a filter, not a screen, so there are no per-type or per-section screens. The slug may be
 * a talent type or a business type, and either cohort may open any of them — discovery is not forked.
 */
export const Route = createFileRoute("/discover/$slug")({
  loader: async ({ params }) => {
    if (params.slug === "music") {
      return {
        kind: "music" as const,
        tracks: await listTrendingWork().catch((): TrendingItem[] => []),
      };
    }
    if (params.slug === "projects") {
      return {
        kind: "projects" as const,
        opportunities: await loadDbOpportunities().catch(() => []),
      };
    }
    // Curated slugs are plural ("singers" → role "singer"); any other slug is the taxonomy role.
    const curated = categories.find((c) => c.slug === params.slug);
    return {
      kind: "people" as const,
      role: curated?.role ?? params.slug,
      label: curated?.label ?? null,
    };
  },
  head: ({ params, loaderData }) => {
    const title =
      loaderData?.kind === "music"
        ? "Music"
        : loaderData?.kind === "projects"
          ? "Projects"
          : (loaderData?.label ?? params.slug);
    return { meta: [{ title: `${title} | MusicLinkd` }] };
  },
  component: DiscoverSlug,
});

function DiscoverSlug() {
  const data = Route.useLoaderData();
  if (data.kind === "music") return <MusicList tracks={data.tracks} />;
  if (data.kind === "projects") return <ProjectList opportunities={data.opportunities} />;
  return <PeopleList role={data.role} label={data.label} />;
}

/** Everyone of one persona type — talent or business, the query does not care which. */
function PeopleList({ role, label }: { role: string; label: string | null }) {
  const list = useServerFn(listPeopleByRole);
  const { options } = useTaxonomy();
  const people = useQuery({
    queryKey: ["discover", role],
    queryFn: () => list({ data: { role } }),
  });
  const heading = label ?? options?.person_types?.find((o) => o.slug === role)?.label ?? role;

  return (
    <Screen>
      <TopBar title={heading} back="/discover" />
      <div className="px-5 py-5">
        {people.isLoading ? (
          <ul className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-20 animate-pulse rounded-lg bg-subtle" />
            ))}
          </ul>
        ) : people.isError ? (
          <StateCard
            title="We couldn't load this list"
            body="Check your connection, then try again."
          />
        ) : !people.data?.length ? (
          <StateCard
            title={`No ${String(heading).toLowerCase()} yet`}
            body="Nobody with this role has a public profile at the moment."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
            {people.data.map((p) => (
              <PersonRow key={p.id} person={p} roleLabels={options?.person_types} />
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}

/** Work published by people you can actually hire, not a chart. */
function MusicList({ tracks }: { tracks: TrendingItem[] }) {
  return (
    <Screen>
      <TopBar title="Music" subtitle="New work from the community" back="/discover" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        {tracks.length ? (
          <div className="space-y-3">
            {tracks.map((t) => (
              <Link key={t.id} to="/portfolio/$id" params={{ id: t.id }} className="block">
                <Card>
                  <div className="flex items-center gap-3">
                    <WorkTypeIcon kind={t.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className="truncate text-1 text-muted-foreground">
                        {joinParts(
                          workType(t.kind).label,
                          t.display_name,
                          `${t.plays} ${t.plays === 1 ? "play" : "plays"}`,
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing published yet"
            body="Work published by people you can hire appears here."
          />
        )}
      </div>
    </Screen>
  );
}

/** Collabs open to join. Starting one is a drawer, not a screen. */
function ProjectList({
  opportunities,
}: {
  opportunities: {
    id: string;
    title: string;
    city?: string | null;
    workMode?: string | null;
    summary?: string | null;
    kind: string;
  }[];
}) {
  const [starting, setStarting] = useState(false);
  const projects = opportunities.filter((o) => o.kind === "Project" || o.kind === "Collaborator");

  return (
    <Screen>
      <TopBar title="Projects" subtitle="Work in progress you can join" back="/discover" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        {projects.length ? (
          <div className="space-y-3">
            {projects.map((o) => (
              <Link key={o.id} to="/opportunities/$id" params={{ id: o.id }} className="block">
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{o.title}</p>
                      {o.city || o.workMode ? (
                        <p className="mt-1 text-1 text-muted-foreground">
                          {[o.city, o.workMode].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <StatusPill label={o.kind} tone="brand" />
                  </div>
                  {o.summary ? (
                    <p className="mt-2 line-clamp-2 text-1 text-muted-foreground">{o.summary}</p>
                  ) : null}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No open projects"
            body="Projects looking for collaborators will appear here."
          >
            <Btn onClick={() => setStarting(true)}>Start Your Own</Btn>
          </EmptyState>
        )}
      </div>
      <CollabKindSheet open={starting} onClose={() => setStarting(false)} />
    </Screen>
  );
}
