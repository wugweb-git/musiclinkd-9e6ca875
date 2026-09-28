import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, WifiOff, RefreshCw, Star, Settings, Sparkles } from "lucide-react";
import { Screen, Btn, BtnLink, SectionHeader } from "@/components/ml/ui";
import { EmptyState, Loading } from "@/components/ml/kit";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { ViewerAvatar, firstNameOf, useViewer } from "@/components/ml/viewer";
import { NotificationsBell } from "@/components/ml/tab-header";
import { emptyDashboard, type ContinueCard, type DashboardData } from "@/data/dashboard";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, listMyPortfolio, getTaxonomyLabels } from "@/lib/portfolio.functions";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";
import { listOpportunities, listStudios } from "@/lib/catalog.functions";
import { listPeopleByRole, type DirectoryPerson } from "@/lib/profile-groups.functions";
import { discoverStudioFromRow } from "@/lib/studio-view";
import { profileGaps, type ProfileRow } from "@/lib/profile-map";
import { labelFor, loadTaxonomy } from "@/lib/taxonomy";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";
import { SectionActionLink } from "@/components/ml/links";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Your Dashboard | MusicLinkd" },
      {
        name: "description",
        content:
          "Your MusicLinkd home — what's happening in your network right now and the best next thing to do: requests, sessions, matches and activity.",
      },
      { property: "og:title", content: "Your Dashboard | MusicLinkd" },
      {
        property: "og:description",
        content: "See what's happening in your music network and what to do next.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Home's content is the network's: roles being cast, people, studios. All public reads.
  loader: async () => {
    const [opportunities, studios, labels] = await Promise.all([
      listOpportunities().catch(() => []),
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    // All of them: signed in, the rails are ranked by recommendations before they are cut to six.
    return {
      opportunities,
      studios: studios.map((row) => discoverStudioFromRow(row, labels)),
      labels,
    };
  },
  component: Dashboard,
});

type Status = "loading" | "ready" | "error" | "offline";

type Home = { data: DashboardData; cont: ContinueCard[]; roleSlug: string | null };

/*
 * Home is the signed-in person's own: their profile row, their portfolio and the open opportunities.
 * There are no tables yet for connection requests, messages, profile views, activity or
 * recommendations, so those start empty rather than showing the seed account's numbers.
 */
function useDashboard() {
  const { signedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const loadPortfolio = useServerFn(listMyPortfolio);
  const [status, setStatus] = useState<Status>("loading");
  const [home, setHome] = useState<Home | null>(null);

  const load = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("offline");
      return;
    }
    setStatus("loading");
    try {
      const [row, items, tx] = await Promise.all([
        loadProfile() as Promise<ProfileRow | null>,
        loadPortfolio(),
        loadTaxonomy().catch(() => null),
      ]);
      setHome(buildHome(row, items.length, tx?.person_types));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [loadProfile, loadPortfolio]);

  useEffect(() => {
    if (authLoading) return;
    if (!signedIn) {
      void navigate({ to: "/welcome", replace: true });
      return;
    }
    void load();
    const onOffline = () => setStatus("offline");
    const onOnline = () => void load();
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [authLoading, signedIn, navigate, load]);

  return { status, home, retry: () => void load() };
}

function buildHome(
  row: ProfileRow | null,
  portfolioCount: number,
  personTypes: Parameters<typeof labelFor>[0],
): Home {
  const gaps = profileGaps(row);
  const roles = (row?.roles ?? []).slice(0, 2).map((slug) => labelFor(personTypes, slug));
  const data: DashboardData = {
    ...emptyDashboard,
    studios: [],
    user: {
      ...emptyDashboard.user,
      firstName: "",
      role: roles.join(" · "),
      photo: row?.avatar_url ?? "",
      profileCompletion: gaps.percent,
      available: Boolean(row?.availability),
    },
  };

  const cont: ContinueCard[] = [];
  // The real signal is what's actually filled in, not whether onboarding was ever marked done —
  // an account that skipped straight through still has an incomplete profile to finish.
  if (gaps.missing.length) {
    cont.push({
      id: "setup",
      eyebrow: "Pick up where you left off",
      title: "Finish your profile",
      meta: `${gaps.missing.length} left`,
      detail: `${gaps.percent}% done`,
      cta: "Continue setup",
      to: row?.onboarding_complete ? "/profile/edit" : "/onboarding/resume",
      progress: gaps.percent,
    });
  }
  if (portfolioCount === 0) {
    cont.push({
      id: "portfolio",
      eyebrow: "Next step",
      title: "Add your portfolio",
      meta: "Tracks, videos and credits are what turn a profile view into an enquiry.",
      detail: "",
      cta: "Add work",
      to: "/portfolio",
    });
  }

  return { data, cont, roleSlug: row?.roles?.[0] ?? null };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Set after mount: the server renders in UTC, so its greeting is wrong for the reader's clock. */
function useGreeting() {
  const [text, setText] = useState("Hello");
  useEffect(() => setText(greeting()), []);
  return text;
}

function Dashboard() {
  const { status, home, retry } = useDashboard();

  return (
    <Screen className="relative pb-nav-clear">
      <Header />
      {status === "loading" ? <SkeletonBody /> : null}
      {status === "offline" ? (
        <StateBlock
          icon={<WifiOff size={iconSize.lg} className="text-muted-foreground" />}
          title="You're offline"
          body="Reconnect to refresh your activity. Saved profiles stay available."
          onRetry={retry}
        />
      ) : null}
      {status === "error" ? (
        <StateBlock
          icon={<RefreshCw size={iconSize.lg} className="text-muted-foreground" />}
          title="Couldn't load your dashboard"
          body="Something went wrong on our side. Try again in a moment."
          onRetry={retry}
        />
      ) : null}
      {status === "ready" && home ? <Body home={home} /> : null}
    </Screen>
  );
}

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-bar flex items-center justify-end gap-2 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <NotificationsBell tone="onInk" />
      <Link
        to="/settings"
        aria-label="Settings"
        className="hit-area state-layer flex h-10 w-10 items-center justify-center rounded-full border border-background/25 bg-background/10 text-background backdrop-blur"
      >
        <Settings size={iconSize.md} aria-hidden />
      </Link>
      <ViewerAvatar className="h-12 w-12 ring-2 ring-background/30" />
    </header>
  );
}

function Body({ home }: { home: Home }) {
  const { data, cont } = home;
  const { user } = data;
  const loaded = Route.useLoaderData();
  const { displayName } = useViewer();
  const viewerFirstName = firstNameOf(displayName);
  const hello = useGreeting();
  const [qrOpen, setQrOpen] = useState(false);
  // Ranked by the viewer's own signals (recommendations.functions.ts); newest first until then.
  const recs = useRecommendations();
  const rolePeers = usePeers(home.roleSlug);
  const peers: (DirectoryPerson & { reason?: string })[] = recs?.people.length
    ? recs.people.slice(0, 8)
    : rolePeers;

  return (
    <div className="min-w-0 pb-4">
      {/*
       * The stage: the one dark band on any screen. Who you are, whether you are taking work and
       * how complete the profile is, in white on ink, so Home opens with weight instead of a list.
       */}
      <section className="relative -mt-px overflow-hidden rounded-b-3xl bg-ink px-5 pb-6 pt-[calc(4.5rem+env(safe-area-inset-top))] text-background">
        <p className="text-1 text-background/70">{hello}</p>
        <h1 className="mt-1 break-words text-4 font-bold leading-[1.05]">
          {viewerFirstName || "Welcome"}
        </h1>
        {user.role ? <p className="mt-1 truncate text-sm text-background/70">{user.role}</p> : null}

        {cont.length ? (
          <ul className="mt-5 space-y-2">
            {cont.map((c) => (
              <li key={c.id}>
                <Link
                  to={c.to ?? "/onboarding/resume"}
                  className="state-layer flex items-center gap-3 rounded-lg bg-background/10 px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.title}</span>
                    {c.meta ? (
                      <span className="block truncate text-1 text-background/70">{c.meta}</span>
                    ) : null}
                  </span>
                  <ChevronRight
                    size={iconSize.sm}
                    className="shrink-0 text-background/70"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* People in the same line of work, from the live profiles table. */}
      {peers.length ? (
        <section className="pt-7">
          <SectionHeader
            title="People to meet"
            action={<SectionActionLink to="/discover">See All</SectionActionLink>}
          />
          <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {peers.map((p) => (
              <article
                key={p.username}
                className="relative w-[150px] shrink-0 rounded-lg bg-subtle p-4"
              >
                <span className="absolute right-2 top-2 z-10">
                  <SavedToggle targetType="talent" targetId={p.id} size={28} />
                </span>
                <Link
                  to="/profile/$username"
                  params={{ username: p.username }}
                  className="state-layer flex flex-col items-center gap-2 text-center"
                >
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span aria-hidden className="h-14 w-14 rounded-full bg-background" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-1 font-semibold">{p.name}</span>
                    <span className="block truncate text-1 text-muted-foreground">
                      {p.reason || (p.city ?? p.roles[0] ?? "")}
                    </span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** People in the same line of work; falls back to anyone public when the viewer has no role yet. */
function usePeers(roleSlug: string | null) {
  const list = useServerFn(listPeopleByRole);
  const [people, setPeople] = useState<Awaited<ReturnType<typeof listPeopleByRole>>>([]);
  useEffect(() => {
    let active = true;
    void list({ data: { ...(roleSlug ? { role: roleSlug } : {}), limit: 8 } })
      .then((rows) => {
        if (active) setPeople(rows);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [list, roleSlug]);
  return people;
}

function StateBlock({
  icon,
  title,
  body,
  onRetry,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  onRetry: () => void;
}) {
  return (
    <div className="px-5 py-16">
      <EmptyState icon={icon} title={title} body={body}>
        <Btn variant="ink" className="w-full" onClick={onRetry}>
          Try Again
        </Btn>
      </EmptyState>
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className="space-y-4 px-5 pt-20" aria-busy aria-label="Loading your dashboard">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 rounded-full bg-background" />
        <div className="h-4 w-1/2 rounded-full bg-background" />
        <div className="h-24 rounded-lg bg-subtle" />
        <div className="h-28 rounded-lg bg-subtle" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-lg bg-subtle" />
          <div className="h-24 rounded-lg bg-subtle" />
        </div>
      </div>
      <Loading rows={3} />
    </div>
  );
}
