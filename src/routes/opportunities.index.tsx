import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, Bookmark, Briefcase, Users } from "lucide-react";
import { Screen, TopBar, BtnLink, Sheet } from "@/components/ml/ui";
import { Card, Segmented, EmptyState, Loading, Row } from "@/components/ml/kit";
import { OpportunityCard, categoryIcon, useSavedOpportunities } from "@/components/ml/opportunity";
import { opportunityCategories } from "@/data/opportunities";
import { loadDbOpportunities } from "@/lib/opportunity-view";
import { listMyApplications } from "@/lib/applications.functions";
import { getMyProfile } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/opportunities/")({
  // Every opportunity on this screen is one somebody posted; none when the database is unreachable.
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

// "For you" would need something that ranks, and nothing does; these two are what the data says.
const tabs = ["Recent", "Near you"] as const;

function OpportunitiesHome() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Recent");
  const [sheet, setSheet] = useState(false);
  const { has, toggle } = useSavedOpportunities();
  const { dbOpportunities: all } = Route.useLoaderData();
  const { signedIn } = useAuth();

  // Near you is the viewer's own city, not a city we picked for them.
  const readProfile = useServerFn(getMyProfile);
  const profile = useQuery({
    queryKey: ["profile", "mine"],
    queryFn: () => readProfile(),
    enabled: signedIn,
  });
  const myCity = (profile.data as { city?: string | null } | null)?.city ?? "";

  const list =
    tab === "Recent"
      ? all
      : // Stored locations carry a state ("Mumbai, MH").
        all.filter((o) => myCity && o.city.split(",")[0]?.trim() === myCity.trim());

  const openCount = (key: string) =>
    all.filter((o) => o.status === "open" && o.categoryKey === key).length;

  // How many applications are still live, from the applications themselves.
  const readApplications = useServerFn(listMyApplications);
  const applications = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => readApplications(),
    enabled: signedIn,
  });
  const active = (applications.data ?? []).filter(
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
            <Plus size={iconSize.md} />
          </button>
        }
      />

      <div className="space-y-4 px-5 pt-4">
        <Link to="/opportunities/search" className="block">
          <div className="flex h-13 items-center gap-3 rounded-full bg-subtle px-5 py-3.5">
            <Search size={iconSize.sm} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Singer, mixing engineer, studio…</span>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Row
            icon={<Briefcase size={iconSize.sm} />}
            title="My applications"
            subtitle={applications.data ? `${active} active` : "Yours"}
            to="/opportunities/applications"
          />
          <Row
            icon={<Bookmark size={iconSize.sm} />}
            title="Saved"
            subtitle="Shortlist"
            to="/opportunities/saved"
          />
        </div>
        <Row
          icon={<Users size={iconSize.sm} />}
          title="Projects you can join"
          subtitle="Work in progress looking for collaborators"
          to="/discover/projects"
        />

        <section>
          <h2 className="mb-2 text-sm">Browse by need</h2>
          <div className="rail no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {opportunityCategories.slice(0, 10).map((c) => {
              const Icon = categoryIcon(c.key);
              return (
                <Link
                  key={c.key}
                  to="/opportunities/search"
                  search={{ q: c.label }}
                  className="w-[116px] shrink-0 rounded-[20px] bg-subtle p-3"
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                  <p className="mt-1 truncate text-1 font-semibold">{c.label}</p>
                  <p className="text-1 text-muted-foreground">{openCount(c.key)} open</p>
                </Link>
              );
            })}
          </div>
        </section>

        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Near you" && signedIn && profile.isLoading ? (
          <Loading rows={3} />
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === "Near you" && !myCity ? "We don't know your city" : "Nothing here yet"}
            body={
              tab === "Near you" && !myCity
                ? "Add your city to your profile and this tab will show what is open around you."
                : "Nobody has posted one that fits this view. Check back tomorrow."
            }
          >
            {tab === "Near you" && !myCity ? (
              <BtnLink to="/profile/edit" variant="outline" className="w-full">
                Add your city
              </BtnLink>
            ) : null}
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
