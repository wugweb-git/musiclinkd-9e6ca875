import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Screen, TopBar, Chip, Btn, BtnLink, SearchBar, Sheet } from "@/components/ml/ui";
import {
  CollabSkeleton,
  EmptyState,
  ErrorState,
  OfflineBanner,
  ProjectCard,
  Card,
  Label,
} from "@/components/ml/collab";
import {
  collabRoles,
  collabTypes,
  invitations,
  projects,
  proposals,
  sortOptions,
  sortProjects,
  tabFilter,
  type SortOption,
} from "@/data/collab";
import { showDemoControls } from "@/lib/dev";

export const Route = createFileRoute("/collab/")({
  head: () => ({
    meta: [
      { title: "Collaborations — MusicLinkd" },
      {
        name: "description",
        content:
          "Every MusicLinkd collaboration you're part of: active projects, pending invitations, completed work and drafts.",
      },
      { property: "og:title", content: "Collaborations — MusicLinkd" },
      {
        property: "og:description",
        content: "Turn conversations into real music projects with roles, milestones and files.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollabHome,
});

const tabs = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "drafts", label: "Drafts" },
];

type Sim = "ok" | "loading" | "error" | "offline" | "empty";

function CollabHome() {
  const [tab, setTab] = useState("active");
  const [sim, setSim] = useState<Sim>("ok");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("Recently updated");
  const [role, setRole] = useState<string[]>([]);
  const [type, setType] = useState<string[]>([]);

  const list = useMemo(() => {
    if (sim === "empty") return [];
    const statuses = tabFilter[tab] ?? [];
    let out = projects.filter((p) => statuses.includes(p.status));
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.participants.some((x) => x.name.toLowerCase().includes(q)),
      );
    }
    if (role.length) out = out.filter((p) => role.includes(p.myRole));
    if (type.length) out = out.filter((p) => type.includes(p.type));
    return sortProjects(out, sort);
  }, [tab, sim, query, role, type, sort]);

  const pendingCount = invitations.length;

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <Screen>
      <TopBar
        title="Collaborations"
        subtitle="Projects, invitations and proposals"
        right={
          showDemoControls ? (
            <button
              type="button"
              onClick={() =>
                setSim(
                  sim === "ok"
                    ? "loading"
                    : sim === "loading"
                      ? "error"
                      : sim === "error"
                        ? "offline"
                        : sim === "offline"
                          ? "empty"
                          : "ok",
                )
              }
              className="pill bg-background text-muted-foreground"
            >
              States
            </button>
          ) : undefined
        }
      />

      <div className="px-5 pt-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search projects, people, roles..."
        />
      </div>

      <div className="rail mt-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t.key} active={t.key === tab} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === "pending" && pendingCount ? ` · ${pendingCount}` : ""}
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between px-5">
        <button
          type="button"
          onClick={() => setFilters(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-1 font-semibold"
        >
          <SlidersHorizontal size={16} /> Filters
          {role.length + type.length ? ` · ${role.length + type.length}` : ""}
        </button>
        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-1 font-semibold"
        >
          <ArrowUpDown size={16} /> {sort}
        </button>
      </div>

      <main className="mt-4 px-5">
        {sim === "offline" ? <OfflineBanner onRetry={() => setSim("ok")} /> : null}

        {tab === "pending" ? (
          <section className="mb-6">
            <Label>Invitations for you</Label>
            {pendingCount === 0 ? (
              <EmptyState
                title="No pending collaboration invitations"
                body="When someone invites you onto a project it lands here."
              />
            ) : (
              invitations.map((inv) => (
                <Link
                  key={inv.id}
                  to="/collab/invites/$id"
                  params={{ id: inv.id }}
                  className="mb-3 block"
                >
                  <Card>
                    <div className="flex gap-3">
                      <img src={inv.artwork} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm">{inv.projectName}</h3>
                        <p className="truncate text-1 text-muted-foreground">
                          {inv.type} · proposed role: {inv.proposedRole}
                        </p>
                        <p className="mt-1 truncate text-1 text-muted-foreground">
                          From {inv.inviter} · {inv.sentAt}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
            <Label>Proposals</Label>
            {proposals.map((p) => (
              <Link
                key={p.id}
                to="/collab/proposals/$id"
                params={{ id: p.id }}
                className="mb-3 block"
              >
                <Card>
                  <p className="text-sm font-semibold">
                    {p.status === "sent"
                      ? `You — ${p.role} proposal`
                      : `${p.from} — ${p.role} proposal`}
                  </p>
                  <p className="text-1 text-muted-foreground">
                    {p.projectName} · {p.compensation} · {p.status === "sent" ? "sent" : "received"}{" "}
                    {p.sentAt.toLowerCase()}
                  </p>
                </Card>
              </Link>
            ))}
            <BtnLink to="/collab/proposals/new" variant="outline" className="w-full">
              Send a Proposal
            </BtnLink>
          </section>
        ) : null}

        {sim === "loading" ? (
          <CollabSkeleton />
        ) : sim === "error" ? (
          <ErrorState onRetry={() => setSim("ok")} />
        ) : list.length === 0 ? (
          <EmptyForTab tab={tab} />
        ) : (
          list.map((p) => <ProjectCard key={p.id} project={p} />)
        )}
      </main>

      <Link
        to="/collab/new"
        className="fixed bottom-24 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
      >
        <Plus size={16} /> Start a collaboration
      </Link>

      <Sheet open={filters} onClose={() => setFilters(false)} title="Filter collaborations">
        <Label>Status</Label>
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Chip key={t.key} active={t.key === tab} onClick={() => setTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </div>
        <Label>My role</Label>
        <div className="mb-5 flex flex-wrap gap-2">
          {collabRoles.map((r) => (
            <Chip key={r} active={role.includes(r)} onClick={() => toggle(role, setRole, r)}>
              {r}
            </Chip>
          ))}
        </div>
        <Label>Project type</Label>
        <div className="mb-6 flex flex-wrap gap-2">
          {collabTypes.map((t) => (
            <Chip key={t} active={type.includes(t)} onClick={() => toggle(type, setType, t)}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="flex gap-3">
          <Btn
            variant="outline"
            className="flex-1"
            onClick={() => {
              setRole([]);
              setType([]);
            }}
          >
            Clear
          </Btn>
          <Btn className="flex-1" onClick={() => setFilters(false)}>
            Show Results
          </Btn>
        </div>
      </Sheet>

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <div className="flex flex-wrap gap-2 pb-2">
          {sortOptions.map((s) => (
            <Chip
              key={s}
              active={s === sort}
              onClick={() => {
                setSort(s);
                setSortOpen(false);
              }}
            >
              {s}
            </Chip>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}

function EmptyForTab({ tab }: { tab: string }) {
  if (tab === "active")
    return (
      <EmptyState
        title="No active collaborations"
        body="Start a project with someone you're already talking to, or find new people to work with."
        action={
          <div className="flex gap-3">
            <BtnLink to="/collab/new">Start a Collaboration</BtnLink>
            <BtnLink to="/discover" variant="outline">
              Discover Talent
            </BtnLink>
          </div>
        }
      />
    );
  if (tab === "completed")
    return (
      <EmptyState
        title="Completed projects will appear here"
        body="Finished collaborations stay here with their files, credits and review handoffs."
      />
    );
  if (tab === "drafts")
    return (
      <EmptyState
        title="No drafts"
        body="Half-finished collaboration setups are saved here so you can pick them up later."
        action={<BtnLink to="/collab/new">Create Collaboration</BtnLink>}
      />
    );
  return (
    <EmptyState
      title="No collaborations yet"
      body="Find musicians, producers, studios and businesses to work with."
      action={<BtnLink to="/discover">Discover Talent</BtnLink>}
    />
  );
}
