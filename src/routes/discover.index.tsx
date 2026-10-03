import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";

import { BookableCard, PersonCard, PersonRow } from "@/components/ml/cards";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { NotificationsBell } from "@/components/ml/tab-header";
import { Chip, Screen, SectionHeader } from "@/components/ml/ui";
import { listBookables, listOpportunities } from "@/lib/catalog.functions";
import { discoverBookableFromRow } from "@/lib/bookable-view";
import { iconSize } from "@/lib/tokens";
import { opportunityFromRow } from "@/lib/opportunity-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { searchPeople, type DirectoryPerson } from "@/lib/profile-groups.functions";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";
import { useMyBusinessIdentity } from "@/hooks/use-my-business-identity";
import { useTaxonomy } from "@/lib/taxonomy";

export const Route = createFileRoute("/discover/")({
  head: () => ({
    meta: [
      { title: "Discover Music Professionals | MusicLinkd" },
      {
        name: "description",
        content:
          "Search talent, businesses, studios and opportunities across India's music industry.",
      },
      { property: "og:title", content: "Discover Music Professionals | MusicLinkd" },
      {
        property: "og:description",
        content: "Find the people, places and work for your next music project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [studioRows, opportunityRows, labels, people] = await Promise.all([
      listBookables().catch(() => []),
      listOpportunities().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      searchPeople({ data: { limit: 20, withTotal: false } })
        .then((result) => result.people)
        .catch((): DirectoryPerson[] => []),
    ]);
    return {
      studios: studioRows.map((row) => discoverBookableFromRow(row, labels)),
      opportunities: opportunityRows.map((row) => opportunityFromRow(row, labels)),
      people,
    };
  },
  // Coming back to Discover within a minute reuses what was read instead of waiting again.
  staleTime: 60_000,
  component: DiscoverScreen,
});

const TALENT_MODES = ["For you", "People", "Opportunities", "Studios"] as const;
const BUSINESS_MODES = ["For you", "Talent", "Studios", "Opportunities"] as const;
type Mode = (typeof TALENT_MODES)[number] | (typeof BUSINESS_MODES)[number];

function DiscoverScreen() {
  const loaded = Route.useLoaderData();
  const navigate = useNavigate();
  const business = useMyBusinessIdentity();
  const recommendations = useRecommendations();
  const saved = useSavedOpportunities();
  const { options } = useTaxonomy();
  const modes = business.hasBusiness ? BUSINESS_MODES : TALENT_MODES;
  const [mode, setMode] = useState<Mode>("For you");
  const people = recommendations?.people.length ? recommendations.people : loaded.people;
  const studios = rankBy(loaded.studios, recommendations?.studios, (studio) => studio.id);
  const opportunities = rankBy(
    loaded.opportunities,
    recommendations?.opportunities,
    (opportunity) => opportunity.id,
  );
  const showPeople = mode === "For you" || mode === "People" || mode === "Talent";
  const showStudios = mode === "For you" || mode === "Studios";
  const showOpportunities = mode === "For you" || mode === "Opportunities";

  return (
    <Screen className="pb-nav-clear">
      <header className="bg-card px-5 pb-5 pt-safe">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-1 font-semibold text-muted-foreground">
              {business.hasBusiness ? "Build the right team" : "Find your next move"}
            </p>
            <h1 className="mt-1 text-3">Discover</h1>
          </div>
          <NotificationsBell />
        </div>
        <button
          type="button"
          onClick={() => void navigate({ to: "/search" })}
          className="state-layer mt-5 flex min-h-14 w-full items-center gap-3 rounded-full bg-subtle px-5 text-left"
        >
          <Search size={iconSize.md} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-2 text-muted-foreground">
            Search people, studios, services and work
          </span>
          <SlidersHorizontal size={iconSize.md} aria-hidden />
        </button>
        <div className="rail no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {modes.map((item) => (
            <Chip key={item} active={mode === item} onClick={() => setMode(item)}>
              {item}
            </Chip>
          ))}
        </div>
      </header>

      <main className="space-y-9 py-6">
        <section className="px-5">
          <Link
            to="/discover/match"
            className="state-layer flex items-center gap-3 rounded-lg bg-ink p-4 text-ink-foreground"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Describe who you need</span>
              <span className="mt-0.5 block text-1 opacity-80">
                AI matches you with real profiles and open opportunities.
              </span>
            </span>
            <ArrowRight size={iconSize.sm} aria-hidden />
          </Link>
        </section>
        {mode === "For you" ? (
          <section className="px-5">
            <Link
              to="/search/why/$id"
              params={{ id: "recommendations" }}
              search={{ kind: "person" }}
              className="state-layer flex items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-pink-container">
                <Sparkles size={iconSize.md} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Made relevant to your work</span>
                <span className="mt-0.5 block text-1 text-muted-foreground">
                  See the profile and activity signals behind recommendations.
                </span>
              </span>
              <ArrowRight size={iconSize.sm} aria-hidden />
            </Link>
          </section>
        ) : null}

        {showPeople && people.length ? (
          <section>
            <SectionHeader
              title={business.hasBusiness ? "Talent for your next project" : "People worth meeting"}
              action={
                <Link to="/search" className="link-action text-sm font-semibold">
                  See all
                </Link>
              }
            />
            {mode === "People" || mode === "Talent" ? (
              <div className="mx-5 overflow-hidden rounded-lg border border-border bg-card">
                {people.slice(0, 10).map((person) => (
                  <PersonRow key={person.id} person={person} roleLabels={options?.person_types} />
                ))}
              </div>
            ) : (
              <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
                {people.slice(0, 8).map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    roleLabels={options?.person_types}
                    featured
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {showOpportunities && opportunities.length ? (
          <section>
            <SectionHeader
              title={
                business.hasBusiness
                  ? "Open industry opportunities"
                  : "Opportunities matched to you"
              }
              action={
                <Link to="/opportunities" className="link-action text-sm font-semibold">
                  See all
                </Link>
              }
            />
            <div className="space-y-3 px-5">
              {opportunities.slice(0, mode === "Opportunities" ? 8 : 3).map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  o={opportunity}
                  saved={saved.has(opportunity.id)}
                  onSave={() => saved.toggle(opportunity.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {showStudios && studios.length ? (
          <section>
            <SectionHeader
              title="Studios and spaces"
              action={
                <Link
                  to="/discover/$slug"
                  params={{ slug: "studios" }}
                  className="link-action text-sm font-semibold"
                >
                  See all
                </Link>
              }
            />
            <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
              {studios.slice(0, 8).map((studio) => (
                <BookableCard key={studio.id} studio={studio} featured />
              ))}
            </div>
          </section>
        ) : null}

        <section className="px-5">
          <h2 className="text-2 font-semibold">Explore by intent</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <IntentLink
              to="/search"
              icon={<UsersRound size={iconSize.lg} />}
              title={business.hasBusiness ? "Source talent" : "Find collaborators"}
            />
            <IntentLink
              to="/services"
              icon={<BriefcaseBusiness size={iconSize.lg} />}
              title="Book services"
            />
            <StudioIntentLink />
            <IntentLink
              to="/marketplace"
              icon={<Store size={iconSize.lg} />}
              title="Browse Market"
            />
          </div>
        </section>
      </main>
    </Screen>
  );
}

function IntentLink({
  to,
  icon,
  title,
}: {
  to: "/search" | "/services" | "/marketplace";
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="state-layer flex min-h-28 flex-col justify-between rounded-lg border border-border bg-card p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-subtle">
        {icon}
      </span>
      <span className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold">
        {title}
        <ArrowRight size={iconSize.sm} aria-hidden />
      </span>
    </Link>
  );
}

function StudioIntentLink() {
  return (
    <Link
      to="/discover/$slug"
      params={{ slug: "studios" }}
      className="state-layer flex min-h-28 flex-col justify-between rounded-lg border border-border bg-card p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-subtle">
        <Building2 size={iconSize.lg} />
      </span>
      <span className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold">
        Find a studio
        <ArrowRight size={iconSize.sm} aria-hidden />
      </span>
    </Link>
  );
}
