import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowUpDown, Plus, Search, UsersRound } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, IconBtn, IconBtnLink, Sheet } from "@/components/ml/ui";
import { EmptyState, LoadError, Loading, Segmented } from "@/components/ml/kit";
import { DrawerSearch } from "@/components/ml/drawer-list";
import { Field, SheetMultiSelect } from "@/components/ml/listing-form";
import { FilterButton, SortSheet, SwitchRow } from "@/components/ml/market";
import { CollabKindSheet } from "@/components/ml/collab";
import { NotificationsBell } from "@/components/ml/tab-header";
import {
  listMyCollabs,
  listProjectTypes,
  type Collab,
  type CollabStatus,
} from "@/lib/collabs.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";
import { sized } from "@/lib/image-url";

/*
 * Collabs: who you are making something with. A band is the ongoing kind, a project the kind that
 * ends (owner, 17 Sep 2026) — both are collabs, so both are here.
 *
 * This is a room, not a tracker: who is in it, what it is, and where to talk. Milestones, files and
 * agreements were screens nobody needed; people settle those between themselves.
 *
 * The list tools came back on 22 Sep 2026 (owner): search, Active / Invited / Completed, a filter
 * for kind and project type, and a sort. Archived ones stay hidden unless the filter shows them.
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

const tabs = ["Active", "Invited", "Completed"] as const;
type Tab = (typeof tabs)[number];

const sorts = ["Recently updated", "Name"];

const kinds = [
  { value: "band", label: "Band" },
  { value: "project", label: "Project" },
];

/** Where a collab stands, in a word, when it is not simply active. */
const statusWord: Record<CollabStatus, string> = {
  active: "",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

/** Which tab a collab belongs in: an invitation first, then where the work stands. */
function tabOf(c: Collab): Tab {
  if (c.my_status === "invited") return "Invited";
  return c.status === "completed" ? "Completed" : "Active";
}

function CollabRow({ c, kindLabel }: { c: Collab; kindLabel: string }) {
  // People who have said yes; someone only asked is not in it yet.
  const members = c.members?.filter((m) => m.status === "active").length ?? 0;
  const body = (
    <>
      {c.avatar_url ? (
        <img
          src={sized(c.avatar_url, { width: 48 })}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
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
          {joinParts(kindLabel, `${members} ${members === 1 ? "person" : "people"}`, c.city ?? "")}
        </span>
      </span>
      {c.my_status === "invited" ? (
        <span className="shrink-0 text-1 text-muted-foreground">Asked</span>
      ) : statusWord[c.status] ? (
        <span className="shrink-0 text-1 text-muted-foreground">{statusWord[c.status]}</span>
      ) : null}
    </>
  );
  const cls = "state-layer flex items-center gap-3 rounded-lg bg-subtle p-4";
  // A band has its own page (owner, 22 Sep 2026); an invitation is answered on the collab page.
  return c.type === "band" && c.my_status !== "invited" ? (
    <Link to="/bands/$id" params={{ id: c.slug }} className={cls}>
      {body}
    </Link>
  ) : (
    <Link to="/collab/$id" params={{ id: c.id }} className={cls}>
      {body}
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
  const readTypes = useServerFn(listProjectTypes);
  const types = useQuery({ queryKey: ["project-types"], queryFn: () => readTypes() });

  const [tab, setTab] = useState<Tab>("Active");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sort, setSort] = useState(sorts[0]!);
  const [kind, setKind] = useState<string[]>([]);
  const [projectType, setProjectType] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const typeLabel = useMemo(
    () => new Map((types.data ?? []).map((t) => [t.slug, t.label])),
    [types.data],
  );
  const kindLabel = (c: Collab) =>
    c.type === "band"
      ? "Band"
      : c.project_type
        ? (typeLabel.get(c.project_type) ?? "Project")
        : "Project";

  const all = q.data ?? [];
  const term = query.trim().toLowerCase();
  // Search, filter and archived apply first; the tabs then split what is left.
  const narrowed = all.filter((c) => {
    if (c.status === "archived" && !showArchived) return false;
    if (kind.length && !kind.includes(c.type)) return false;
    if (projectType.length && !(c.project_type && projectType.includes(c.project_type)))
      return false;
    if (!term) return true;
    return [c.name, kindLabel(c), c.city ?? ""].some((s) => s.toLowerCase().includes(term));
  });
  const shown = narrowed
    .filter((c) => tabOf(c) === tab)
    .sort((a, b) =>
      sort === "Name"
        ? a.name.localeCompare(b.name)
        : (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at),
    );
  const bands = shown.filter((c) => c.type === "band");
  const projects = shown.filter((c) => c.type === "project");
  const filterCount = kind.length + projectType.length + (showArchived ? 1 : 0);
  const narrowing = Boolean(term) || filterCount > 0;

  return (
    <Screen>
      <TopBar
        title="Collaborations"
        subtitle="Bands and projects you are in"
        back="/discover"
        right={
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <IconBtnLink to="/search" label="Search" variant="plain" className="h-10 w-10">
              <Search size={iconSize.md} aria-hidden />
            </IconBtnLink>
            {all.length ? (
              <>
                <IconBtn label={`Sort: ${sort}`} onClick={() => setSortOpen(true)}>
                  <ArrowUpDown size={iconSize.sm} aria-hidden />
                </IconBtn>
                <FilterButton count={filterCount} onClick={() => setFiltersOpen(true)} />
              </>
            ) : null}
            <Btn
              variant="ink"
              className="min-h-10 px-4"
              icon={<Plus size={iconSize.sm} aria-hidden />}
              onClick={() => setStarting(true)}
            >
              New
            </Btn>
          </div>
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
        ) : q.isError ? (
          <LoadError what="your collaborations" />
        ) : all.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={iconSize.md} className="text-muted-foreground" />}
            title="No collaborations yet"
            body="Start a project with the people you are making something with, or join a band."
          >
            <Btn className="w-full" onClick={() => setStarting(true)}>
              Start a collab
            </Btn>
          </EmptyState>
        ) : (
          <>
            <div>
              <DrawerSearch
                value={query}
                onChange={setQuery}
                placeholder="Search by name, kind or city"
                label="Search your collaborations"
              />
              <Segmented value={tab} options={tabs} onChange={setTab} />
            </div>

            {shown.length === 0 ? (
              <EmptyState
                title={
                  narrowing
                    ? "Nothing matches"
                    : tab === "Invited"
                      ? "No invitations"
                      : tab === "Completed"
                        ? "Nothing completed yet"
                        : "Nothing active"
                }
                body={
                  narrowing
                    ? "Try another word, or clear a filter."
                    : tab === "Invited"
                      ? "When someone asks you into a band or project, it shows here."
                      : tab === "Completed"
                        ? "Projects marked completed show here."
                        : "Bands and projects you are working on show here."
                }
              />
            ) : null}

            {projects.length ? (
              <section className="space-y-2">
                <h2 className="text-sm">Projects</h2>
                {projects.map((c) => (
                  <CollabRow key={c.id} c={c} kindLabel={kindLabel(c)} />
                ))}
              </section>
            ) : null}

            {bands.length ? (
              <section className="space-y-2">
                <h2 className="text-sm">Bands</h2>
                {bands.map((c) => (
                  <CollabRow key={c.id} c={c} kindLabel={kindLabel(c)} />
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="space-y-5">
          <Field label="Kind" id="collab-filter-kind">
            <SheetMultiSelect
              title="Kind"
              value={kind}
              options={kinds}
              onChange={setKind}
              placeholder="Bands and projects"
              max={kinds.length}
            />
          </Field>
          <Field label="Project type" id="collab-filter-type">
            <SheetMultiSelect
              title="Project type"
              value={projectType}
              options={(types.data ?? []).map((t) => ({ value: t.slug, label: t.label }))}
              onChange={setProjectType}
              placeholder="Any type"
              max={Math.max(1, types.data?.length ?? 1)}
            />
          </Field>
          <div className="rounded-lg border border-border">
            <SwitchRow label="Show archived" value={showArchived} onChange={setShowArchived} />
          </div>
          <Btn className="w-full" onClick={() => setFiltersOpen(false)}>
            Show {narrowed.filter((c) => tabOf(c) === tab).length} result
            {narrowed.filter((c) => tabOf(c) === tab).length === 1 ? "" : "s"}
          </Btn>
          {filterCount ? (
            <Btn
              variant="ghost"
              className="w-full"
              onClick={() => {
                setKind([]);
                setProjectType([]);
                setShowArchived(false);
              }}
            >
              Clear all
            </Btn>
          ) : null}
        </div>
      </Sheet>

      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        value={sort}
        onChange={setSort}
        options={sorts}
      />
      <CollabKindSheet open={starting} onClose={() => setStarting(false)} />
    </Screen>
  );
}
