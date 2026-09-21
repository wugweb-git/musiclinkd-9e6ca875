import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, UsersRound } from "lucide-react";
import { Screen, TopBar, BtnLink, IconBtnLink } from "@/components/ml/ui";
import { EmptyState, Loading } from "@/components/ml/kit";
import { listMyCollabs, type Collab } from "@/lib/collabs.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

/*
 * Collabs: who you are making something with. A band is the ongoing kind, a project the kind that
 * ends (owner, 17 Sep 2026) — both are collabs, so both are here.
 *
 * This is a room, not a tracker: who is in it, what it is, and where to talk. Milestones, files and
 * agreements were screens nobody needed; people settle those between themselves.
 */
export const Route = createFileRoute("/collab/")({
  head: () => ({
    meta: [
      { title: "Collaborations | MusicLinkd" },
      {
        name: "description",
        content: "The bands and projects you are part of on MusicLinkd.",
      },
      { property: "og:title", content: "Collaborations | MusicLinkd" },
      { property: "og:description", content: "Bands and projects you are part of." },
    ],
  }),
  component: Collabs,
});

function CollabRow({ c }: { c: Collab }) {
  // People who have said yes; someone only asked is not in it yet.
  const members = c.members?.filter((m) => m.status === "active").length ?? 0;
  return (
    <Link
      to="/collab/$id"
      params={{ id: c.id }}
      className="state-layer flex items-center gap-3 rounded-lg bg-subtle p-4"
    >
      {c.avatar_url ? (
        <img src={c.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background"
        >
          <UsersRound size={iconSize.md} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-2 font-semibold">{c.name}</span>
        <span className="block truncate text-1 text-muted-foreground">
          {joinParts(
            c.type === "band" ? "Band" : "Project",
            `${members} ${members === 1 ? "person" : "people"}`,
            c.city ?? "",
          )}
        </span>
      </span>
      {c.my_status === "invited" ? (
        <span className="pill shrink-0 bg-background text-muted-foreground">Asked</span>
      ) : c.status === "active" ? null : (
        <span className="pill shrink-0 bg-background text-muted-foreground">{c.status}</span>
      )}
    </Link>
  );
}

function Collabs() {
  const { signedIn, loading } = useAuth();
  const load = useServerFn(listMyCollabs);
  const q = useQuery({
    queryKey: ["collabs", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const all = q.data ?? [];
  const bands = all.filter((c) => c.type === "band");
  const projects = all.filter((c) => c.type === "project");

  return (
    <Screen>
      <TopBar
        title="Collaborations"
        subtitle="Bands and projects you are in"
        back="/home"
        right={
          <IconBtnLink label="Start a project" to="/collab/new" variant="ink" className="h-10 w-10">
            <Plus size={iconSize.md} aria-hidden />
          </IconBtnLink>
        }
      />

      <div className="space-y-6 px-5 pt-4 pb-6">
        {!signedIn && !loading ? (
          <EmptyState
            title="Sign in to see your collaborations"
            body="The bands and projects you are part of live here."
          >
            <BtnLink to="/welcome" className="w-full">
              Sign In
            </BtnLink>
          </EmptyState>
        ) : q.isLoading ? (
          <Loading rows={3} />
        ) : all.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={iconSize.md} className="text-muted-foreground" />}
            title="No collaborations yet"
            body="Start a project with the people you are making something with, or join a band."
          >
            <BtnLink to="/collab/new" className="w-full">
              Start a Project
            </BtnLink>
          </EmptyState>
        ) : (
          <>
            {projects.length ? (
              <section className="space-y-2">
                <h2 className="text-sm">Projects</h2>
                {projects.map((c) => (
                  <CollabRow key={c.id} c={c} />
                ))}
              </section>
            ) : null}

            {bands.length ? (
              <section className="space-y-2">
                <h2 className="text-sm">Bands</h2>
                {bands.map((c) => (
                  <CollabRow key={c.id} c={c} />
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </Screen>
  );
}
