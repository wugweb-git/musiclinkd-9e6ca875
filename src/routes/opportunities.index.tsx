import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Bookmark, Briefcase, Users } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { Card, Segmented, EmptyState, Loading, Row } from "@/components/ml/kit";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { opportunities, opportunityCategories, myApplications } from "@/data/opportunities";
import { loadDbOpportunities } from "@/lib/opportunity-view";

export const Route = createFileRoute("/opportunities/")({
  // Stored opportunities follow the static ones; none when the database is unreachable.
  loader: async () => ({ dbOpportunities: await loadDbOpportunities() }),
  head: () => ({
    meta: [
      { title: "Opportunities for music professionals | MusicLinkd" },
      {
        name: "description",
        content:
          "Find singers, producers, engineers, studios and gigs — structured music-industry requests you can apply to with your portfolio.",
      },
      { property: "og:title", content: "Opportunities for music professionals | MusicLinkd" },
      {
        property: "og:description",
        content: "Discoverable demand across the Indian music industry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesHome,
});

const tabs = ["For you", "Recent", "Nearby"] as const;

function OpportunitiesHome() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("For you");
  const [state] = useState<"ready" | "loading" | "empty">("ready");
  const [sheet, setSheet] = useState(false);
  const { has, toggle } = useSavedOpportunities();
  const { dbOpportunities } = Route.useLoaderData();
  const all = [...opportunities, ...dbOpportunities];

  const list =
    tab === "For you"
      ? [...all].sort((a, b) => b.matchScore - a.matchScore)
      : tab === "Recent"
        ? all
        : // Stored locations carry a state ("Mumbai, MH").
          all.filter((o) => o.city.split(",")[0] === "Mumbai");

  // Counted from the opportunities on this screen, static and stored.
  const openCount = (key: string) =>
    all.filter((o) => o.status === "open" && o.categoryKey === key).length;

  const active = myApplications.filter(
    (a) => a.status !== "rejected" && a.status !== "withdrawn",
  ).length;

  return (
    <Screen>
      <TopBar
        title="Opportunities"
        subtitle="Who needs what, right now"
        back="/home"
        right={
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Post an opportunity"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="space-y-4 px-5 pt-4">
        <Link to="/opportunities/search" className="block">
          <div className="flex h-13 items-center gap-3 rounded-full border border-border bg-card px-5 py-3.5">
            <Search size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Singer, mixing engineer, studio…</span>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Row
            icon={<Briefcase size={16} />}
            title="My applications"
            subtitle={`${active} active`}
            to="/opportunities/applications"
          />
          <Row
            icon={<Bookmark size={16} />}
            title="Saved"
            subtitle="Shortlist"
            to="/opportunities/saved"
          />
        </div>
        <Row
          icon={<Users size={16} />}
          title="Projects you can join"
          subtitle="Work in progress looking for collaborators"
          to="/discover/projects"
        />

        <section>
          <h2 className="mb-2 text-sm">Browse by need</h2>
          <div className="rail no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {opportunityCategories.slice(0, 10).map((c) => (
              <Link
                key={c.key}
                to="/opportunities/search"
                search={{ q: c.label }}
                className="w-[116px] shrink-0 rounded-[20px] border border-border bg-card p-3"
              >
                <span className="text-2">{c.emoji}</span>
                <p className="mt-1 truncate text-1 font-semibold">{c.label}</p>
                <p className="text-1 text-muted-foreground">{openCount(c.key)} open</p>
              </Link>
            ))}
          </div>
        </section>

        <Segmented value={tab} options={tabs} onChange={setTab} />

        {state === "loading" ? (
          <Loading rows={3} />
        ) : list.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            body="No opportunities match this view. Widen your city or check back tomorrow."
          >
            <Btn variant="outline">Change Preferences</Btn>
          </EmptyState>
        ) : (
          <div className="space-y-3 pb-4">
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

        <Card className="space-y-2">
          <h3 className="text-sm">Need someone instead?</h3>
          <p className="text-1 text-muted-foreground">
            Post a structured requirement and get applications with portfolios attached.
          </p>
          <BtnLink to="/opportunities/new" search={{ step: "basics" }} className="w-full">
            Post an Opportunity
          </BtnLink>
        </Card>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Post an opportunity">
        <div className="space-y-2">
          <BtnLink to="/opportunities/new" search={{ step: "basics" }} className="w-full">
            Start from Scratch
          </BtnLink>
          <BtnLink to="/opportunities/mine" variant="outline" className="w-full">
            My Opportunities & Drafts
          </BtnLink>
        </div>
      </Sheet>
    </Screen>
  );
}
