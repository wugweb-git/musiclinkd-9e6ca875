import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, StatusPill } from "@/components/ml/kit";
import { opportunities } from "@/data/opportunities";
import { loadDbOpportunities } from "@/lib/opportunity-view";

export const Route = createFileRoute("/discover/projects")({
  // Stored opportunities follow the static ones; none when the database is unreachable.
  loader: async () => ({ dbOpportunities: await loadDbOpportunities() }),
  head: () => ({
    meta: [
      { title: "Discover projects | MusicLinkd" },
      {
        name: "description",
        content:
          "Albums, films and releases in progress that are still looking for people to join.",
      },
      { property: "og:title", content: "Discover projects | MusicLinkd" },
      { property: "og:description", content: "Projects in progress looking for collaborators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiscoverProjects,
});

function DiscoverProjects() {
  const { dbOpportunities } = Route.useLoaderData();
  const projects = [...opportunities, ...dbOpportunities].filter(
    (o) => o.kind === "Project" || o.kind === "Collaborator",
  );

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
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {[o.city, o.workMode].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <StatusPill label={o.kind} tone="brand" />
                  </div>
                  {o.summary ? (
                    <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                      {o.summary}
                    </p>
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
            <BtnLink to="/collab/new">Start Your Own</BtnLink>
          </EmptyState>
        )}
      </div>
    </Screen>
  );
}
