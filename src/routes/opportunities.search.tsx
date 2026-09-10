import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Screen, TopBar, SearchBar, Btn, Sheet, Chip } from "@/components/ml/ui";
import { EmptyState, Loading, Segmented } from "@/components/ml/kit";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { opportunities, opportunityCategories } from "@/data/opportunities";

type Search = { q?: string };

export const Route = createFileRoute("/opportunities/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Search opportunities | MusicLinkd" },
      {
        name: "description",
        content: "Search music-industry requirements by role, city, pay and dates.",
      },
      { property: "og:title", content: "Search opportunities | MusicLinkd" },
      {
        property: "og:description",
        content: "Filter opportunities by role, city, pay, work mode and dates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OpportunitySearch,
});

const sortOptions = ["Best fit", "Newest", "Highest pay"] as const;
const modes = ["On-site", "Remote", "Hybrid"] as const;
const payBands = ["Any", "₹10k+", "₹25k+", "₹50k+"] as const;

function OpportunitySearch() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q ?? "");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Best fit");
  const [filters, setFilters] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const [pay, setPay] = useState<string>("Any");
  const [cats, setCats] = useState<string[]>([]);
  const { has, toggle } = useSavedOpportunities();

  const t = term.trim().toLowerCase();
  let list = opportunities.filter((o) => {
    if (t && !`${o.title} ${o.summary} ${o.city} ${o.genres.join(" ")}`.toLowerCase().includes(t))
      return false;
    if (mode && o.workMode !== mode) return false;
    if (cats.length && !cats.includes(o.categoryKey)) return false;
    if (pay !== "Any") {
      const min = Number(pay.replace(/[^\d]/g, "")) * 1000;
      if ((o.compensation.min ?? 0) < min) return false;
    }
    return true;
  });
  if (sort === "Highest pay")
    list = [...list].sort((a, b) => (b.compensation.min ?? 0) - (a.compensation.min ?? 0));
  if (sort === "Best fit") list = [...list].sort((a, b) => b.matchScore - a.matchScore);

  const activeCount = (mode ? 1 : 0) + (pay !== "Any" ? 1 : 0) + cats.length;

  return (
    <Screen>
      <TopBar title="Search opportunities" back="/opportunities" />
      <div className="space-y-4 px-5 pt-4">
        <SearchBar value={term} onChange={setTerm} placeholder="Role, project, city…" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold"
          >
            <SlidersHorizontal size={14} /> Filters{activeCount ? ` · ${activeCount}` : ""}
          </button>
          <div className="min-w-0 flex-1">
            <Segmented value={sort} options={sortOptions} onChange={setSort} />
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="No matches"
            body="Try a broader role, remove the pay filter, or include remote work."
          >
            <Btn
              variant="outline"
              onClick={() => {
                setMode(null);
                setPay("Any");
                setCats([]);
              }}
            >
              Clear filters
            </Btn>
            <Link to="/opportunities/new" search={{ step: "basics" }}>
              <Btn variant="ghost" className="w-full">
                Post what you need instead
              </Btn>
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-3 pb-4">
            <p className="text-[12px] text-muted-foreground">{list.length} opportunities</p>
            {list.map((o) => (
              <OpportunityCard
                key={o.id}
                o={o}
                saved={has(o.id) || o.saved}
                onSave={() => toggle(o.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={filters} onClose={() => setFilters(false)} title="Filters">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[13px] font-semibold">Work mode</p>
            <div className="flex flex-wrap gap-2">
              {modes.map((m) => (
                <Chip key={m} active={mode === m} onClick={() => setMode(mode === m ? null : m)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold">Minimum pay</p>
            <div className="flex flex-wrap gap-2">
              {payBands.map((p) => (
                <Chip key={p} active={pay === p} onClick={() => setPay(p)}>
                  {p}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold">Requirement type</p>
            <div className="flex flex-wrap gap-2">
              {opportunityCategories.slice(0, 12).map((c) => (
                <Chip
                  key={c.key}
                  active={cats.includes(c.key)}
                  onClick={() =>
                    setCats((p) =>
                      p.includes(c.key) ? p.filter((x) => x !== c.key) : [...p, c.key],
                    )
                  }
                >
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Btn
              variant="outline"
              className="flex-1"
              onClick={() => {
                setMode(null);
                setPay("Any");
                setCats([]);
              }}
            >
              Reset
            </Btn>
            <Btn className="flex-1" onClick={() => setFilters(false)}>
              Show {list.length} results
            </Btn>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
