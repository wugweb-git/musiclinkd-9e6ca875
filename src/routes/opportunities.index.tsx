import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, Bookmark, Briefcase, SlidersHorizontal } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { Card, EmptyState, LoadError, Loading, Segmented } from "@/components/ml/kit";
import { OpportunityCard, categoryIcon, useSavedOpportunities } from "@/components/ml/opportunity";
import { opportunityCategories } from "@/data/opportunities";
import { loadDbOpportunities } from "@/lib/opportunity-view";
import { listMyApplications } from "@/lib/applications.functions";
import { getMyProfile } from "@/lib/portfolio.functions";
import { personFit, fitTarget, type FitPerson } from "@/lib/fit";
import { useTaxonomy } from "@/lib/taxonomy";
import { sameCity } from "@/lib/place";
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

// For you ranks what is open against the viewer's own roles, instruments, genres and city.
const tabs = ["For you", "Recent", "Near you"] as const;

function OpportunitiesHome() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("For you");
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
  const me = (profile.data ?? null) as FitPerson | null;
  const myCity = me?.city ?? "";
  const { options: taxonomy } = useTaxonomy();

  // Open opportunities that match at least one thing on the profile, most matches first; each
  // carries its score and what matched, which the card shows.
  const forYou = useMemo(() => {
    if (!me) return [];
    return all
      .filter((o) => o.status === "open")
      .map((o) => ({ o, fit: personFit(me, fitTarget(o), taxonomy) }))
      .filter((x) => x.fit.matches > 0)
      .sort((a, b) => b.fit.matches - a.fit.matches || b.fit.score - a.fit.score)
      .map(({ o, fit }) => ({ ...o, matchScore: fit.score, matchReasons: fit.reasons }));
  }, [all, me, taxonomy]);
  const profileEmpty =
    !!me && !me.roles?.length && !me.instruments?.length && !me.genres?.length && !myCity;

  const list =
    tab === "For you"
      ? forYou
      : tab === "Recent"
        ? all
        : all.filter((o) => myCity && sameCity(o.city, myCity));

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
  const applicationBySlug = new Map(
    (applications.data ?? []).flatMap((application) =>
      application.opportunity?.slug
        ? [[application.opportunity.slug, application.status] as const]
        : [],
    ),
  );

  return (
    <Screen>
      <TopBar
        title="Opportunities"
        subtitle="Who needs what, right now"
        back="/discover"
        right={
          <Btn
            variant="ink"
            className="min-h-10 px-4"
            icon={<Plus size={iconSize.sm} aria-hidden />}
            onClick={() => setSheet(true)}
          >
            New
          </Btn>
        }
      />

      <div className="space-y-5 px-5 pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_48px] gap-2">
          <Link to="/opportunities/search" className="block min-w-0">
            <div className="flex h-12 items-center gap-3 rounded-full border border-input bg-card px-4">
              <Search size={iconSize.sm} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Singer, mixing engineer, studio…
              </span>
            </div>
          </Link>
          <Link
            to="/opportunities/search"
            aria-label="Filter opportunities"
            className="hit-area flex h-12 w-12 items-center justify-center rounded-full border border-input bg-card"
          >
            <SlidersHorizontal size={iconSize.md} aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card">
          <Link
            to="/opportunities/applications"
            className="state-layer flex min-h-[88px] flex-col justify-between border-r border-border p-3"
          >
            <Briefcase size={iconSize.md} aria-hidden />
            <span>
              <span className="block text-sm font-semibold">Applications</span>
              <span className="text-1 text-muted-foreground">
                {applications.data ? `${active} active` : "View yours"}
              </span>
            </span>
          </Link>
          <Link
            to="/saved"
            className="state-layer flex min-h-[88px] flex-col justify-between border-r border-border p-3"
          >
            <Bookmark size={iconSize.md} aria-hidden />
            <span>
              <span className="block text-sm font-semibold">Saved</span>
              <span className="text-1 text-muted-foreground">Your shortlist</span>
            </span>
          </Link>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Browse by need</h2>
          <div className="grid grid-cols-2 gap-2">
            {opportunityCategories.slice(0, 6).map((c) => {
              const Icon = categoryIcon(c.key);
              return (
                <Link
                  key={c.key}
                  to="/opportunities/search"
                  search={{ q: c.label }}
                  className="state-layer grid min-h-touch grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-sm border border-border bg-card p-3"
                >
                  <Icon size={20} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-1 font-semibold">{c.label}</span>
                    <span className="block text-1 text-muted-foreground">{openCount(c.key)} open</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab !== "Recent" && signedIn && profile.isLoading ? (
          <Loading rows={3} />
        ) : profile.isError ? (
          <LoadError what="what fits you" />
        ) : list.length === 0 && tab === "For you" ? (
          <EmptyState
            title={
              !signedIn
                ? "Sign in to see what fits you"
                : profileEmpty
                  ? "We don't know what you do yet"
                  : "Nothing matches you yet"
            }
            body={
              !signedIn
                ? "This tab ranks open opportunities against your roles, genres, instruments and city."
                : profileEmpty
                  ? "Add your roles, genres, instruments and city to your profile and this tab will rank what fits."
                  : "No open opportunity asks for your roles, genres or city right now. Recent has everything."
            }
          >
            {signedIn && profileEmpty ? (
              <BtnLink to="/profile/edit" variant="outline" className="w-full">
                Edit profile
              </BtnLink>
            ) : null}
          </EmptyState>
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
                applicationLabel={applicationBySlug.get(o.id)}
              />
            ))}
          </div>
        )}
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
