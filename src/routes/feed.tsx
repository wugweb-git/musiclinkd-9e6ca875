import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  WifiOff,
  RefreshCw,
  Plus,
  Search,
  Building2,
  UserPlus,
  ArrowRight,
  Calendar,
  Users,
  Star,
  CreditCard,
  LifeBuoy,
} from "lucide-react";
import { Screen, Btn, SectionHeader } from "@/components/ml/ui";
import { StatusPill } from "@/components/ml/kit";
import { LogoMark } from "@/components/ml/logo";
import { TalentCard } from "@/components/ml/cards";
import { ViewerAvatar, firstNameOf, useViewer } from "@/components/ml/viewer";
import {
  emptyDashboard,
  forYouTiles,
  headlineUpdate,
  openOpportunities,
  type ContinueCard,
  type DashboardData,
  type ForYouTile,
} from "@/data/dashboard";
import { categoryLabel } from "@/data/opportunities";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, listMyPortfolio } from "@/lib/portfolio.functions";
import { profileGaps, type ProfileRow } from "@/lib/profile-map";
import { labelFor, loadTaxonomy } from "@/lib/taxonomy";

export const Route = createFileRoute("/feed")({
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
  component: Dashboard,
});

type Status = "loading" | "ready" | "error" | "offline";

type Home = { data: DashboardData; cont: ContinueCard[]; opportunityStats: ForYouTile[] };

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
  if (!row?.onboarding_complete) {
    cont.push({
      id: "setup",
      eyebrow: "Pick up where you left off",
      title: "Finish your profile",
      meta: `${gaps.missing.length} left`,
      detail: `${gaps.percent}% done`,
      cta: "Continue setup",
      to: "/onboarding/resume",
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
      to: "/portfolio/new",
    });
  }

  const open = openOpportunities();
  const opportunityStats: ForYouTile[] = [
    {
      id: "open",
      value: `${open.length}`,
      label: "Open opportunities",
      hint: open
        .slice(0, 3)
        .map((o) => categoryLabel(o.categoryKey))
        .join(", "),
      to: "/opportunities",
    },
    {
      id: "applications",
      value: "0",
      label: "Your applications",
      hint: "Nothing yet",
      to: "/opportunities/applications",
    },
  ];

  return { data, cont, opportunityStats };
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
    <Screen>
      <Header />
      {status === "loading" ? <SkeletonBody /> : null}
      {status === "offline" ? (
        <StateBlock
          icon={<WifiOff size={22} className="text-muted-foreground" />}
          title="You're offline"
          body="Reconnect to refresh your activity. Saved profiles stay available."
          onRetry={retry}
        />
      ) : null}
      {status === "error" ? (
        <StateBlock
          icon={<RefreshCw size={22} className="text-muted-foreground" />}
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
    <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/90 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <p className="flex min-w-0 items-center gap-2 text-2 font-semibold text-foreground">
        <span aria-hidden className="shrink-0 text-brand">
          <LogoMark className="w-6" />
        </span>
        <span className="truncate">MusicLinkd</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="hit-area relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <Bell size={18} />
        </Link>
        <ViewerAvatar className="h-10 w-10" />
      </div>
    </header>
  );
}

function StatTile({ tile }: { tile: ForYouTile }) {
  return (
    <Link to={tile.to} className="min-w-0 rounded-lg border border-border bg-card p-4">
      <p className="text-3 font-bold leading-none">{tile.value}</p>
      <p className="mt-2 truncate text-1 font-semibold">{tile.label}</p>
      <p className="truncate text-1 text-muted-foreground">{tile.hint}</p>
    </Link>
  );
}

function Body({ home }: { home: Home }) {
  const { data, cont, opportunityStats } = home;
  const { user } = data;
  const { displayName } = useViewer();
  const viewerFirstName = firstNameOf(displayName);
  const hello = useGreeting();
  const headline = headlineUpdate(data);
  const tiles = forYouTiles(data);
  const isEmpty = !headline && cont.length === 0 && data.activity.length === 0;

  return (
    <div className="min-w-0 pb-4">
      {/* 1 — Greeting */}
      <section className="min-w-0 px-5 pt-5">
        <h1 className="break-words text-3 leading-tight">
          {hello}
          {viewerFirstName ? `, ${viewerFirstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEmpty ? "Your network is quiet today." : "Here's your MusicLinkd today."}
        </p>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <StatusPill
            label={user.available ? "Open to collaborations" : "Not taking work"}
            tone={user.available ? "good" : "neutral"}
          />
          {user.role ? (
            <span className="pill max-w-full truncate bg-subtle text-muted-foreground">
              {user.role}
            </span>
          ) : null}
        </div>
      </section>

      {/* 2 — Single highest-value update */}
      {headline ? (
        <section className="px-5 pt-4">
          <Link
            to={headline.to}
            className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-4 bg-subtle"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-2 font-bold leading-snug">{headline.title}</p>
              <p className="mt-0.5 line-clamp-2 text-1 text-muted-foreground">{headline.body}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-1 font-semibold text-foreground">
                {headline.cta} <ArrowRight size={13} />
              </span>
            </div>
            <ChevronRight size={18} className="shrink-0 text-primary" />
          </Link>
        </section>
      ) : null}

      {/* 3 — Continue */}
      {cont.length ? (
        <section className="pt-6">
          <SectionHeader title="Continue" />
          <div className="space-y-3 px-5">
            {cont.map((c) => (
              <ContinueBlock key={c.id} c={c} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 3b — Opportunities */}
      <section className="pt-6">
        <SectionHeader title="Opportunities" action={<Link to="/opportunities">See all</Link>} />
        <div className="grid grid-cols-2 gap-3 px-5">
          {opportunityStats.map((t) => (
            <StatTile key={t.id} tile={t} />
          ))}
        </div>
      </section>

      {/* 4 — For you */}

      {tiles.length || data.forYou.length ? (
        <section className="pt-6">
          <SectionHeader title="For you" action={<Link to="/recommendations">See all</Link>} />
          {tiles.length ? (
            <div className="grid grid-cols-2 gap-3 px-5">
              {tiles.map((t) => (
                <StatTile key={t.id} tile={t} />
              ))}
            </div>
          ) : null}
          {data.forYou.length ? (
            <div className="rail no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
              {data.forYou.map((t) => (
                <TalentCard key={t.id} t={t} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 5 — Activity */}
      <section className="pt-6">
        <SectionHeader title="Activity" />
        {data.activity.length ? (
          <ul className="space-y-1 px-5">
            {data.activity.map((a) => (
              <li key={a.id} className="flex min-w-0 items-start gap-3 py-2.5">
                <span
                  aria-hidden
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.kind === "view" ? "bg-border" : "bg-primary"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-1 font-semibold leading-snug">{a.title}</p>
                  <p className="truncate text-1 text-muted-foreground">
                    {a.meta} · {a.when}
                  </p>
                </div>
                {a.kind === "request" ? (
                  <Btn variant="primary" className="min-h-9 shrink-0 px-4 text-1">
                    Accept
                  </Btn>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-5 rounded-lg border border-border bg-card p-5 text-center">
            <p className="text-2 font-semibold">No activity yet</p>
            <p className="mt-1 text-1 text-muted-foreground">
              Connect with artists and studios to see updates here.
            </p>
            <Link
              to="/discover"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-1 font-semibold text-background"
            >
              Discover talent
            </Link>
          </div>
        )}
      </section>

      {/* 6 — Secondary, demoted */}
      <section className="pt-6">
        <SectionHeader title="Manage" />
        <div className="px-5">
          <Link
            to="/profile/edit"
            className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-1 font-semibold">
                Profile {data.user.profileCompletion}% complete
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${data.user.profileCompletion}%` }}
                />
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
          </Link>
        </div>
        <div className="rail no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          <QuietAction to="/portfolio/new" icon={<Plus size={14} />} label="Add track / EP" />
          <QuietAction to="/search" icon={<Search size={14} />} label="Search talent" />
          <QuietAction to="/studio" icon={<Building2 size={14} />} label="Find a studio" />
          <QuietAction to="/bookings" icon={<Calendar size={14} />} label="My bookings" />
          <QuietAction to="/bands" icon={<Users size={14} />} label="My bands" />
          <QuietAction to="/reviews" icon={<Star size={14} />} label="Reviews" />
          <QuietAction to="/plans" icon={<CreditCard size={14} />} label="Plan" />
          <QuietAction to="/help" icon={<LifeBuoy size={14} />} label="Help" />
          <QuietAction to="/messages" icon={<UserPlus size={14} />} label="Find contacts" />
        </div>
      </section>
    </div>
  );
}

function ContinueBlock({ c }: { c: ContinueCard }) {
  const inner = (
    <>
      <p className="text-1 text-muted-foreground">{c.eyebrow}</p>
      <p className="mt-1 line-clamp-2 text-2 font-bold leading-snug">{c.title}</p>
      <p className="mt-0.5 truncate text-1 text-muted-foreground">{c.meta}</p>
      {c.detail ? <p className="mt-1 truncate text-1 font-semibold">{c.detail}</p> : null}
      {typeof c.progress === "number" ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-primary" style={{ width: `${c.progress}%` }} />
        </div>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1 text-1 font-semibold text-foreground">
        {c.cta} <ArrowRight size={13} />
      </span>
    </>
  );
  const cls = "block min-w-0 rounded-lg border border-border bg-card p-4";
  if (c.ref) {
    return (
      <Link to="/bookings/$ref" params={{ ref: c.ref }} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to={c.to ?? "/me"} className={cls}>
      {inner}
    </Link>
  );
}

type QuietDestination =
  | "/portfolio/new"
  | "/search"
  | "/studio"
  | "/messages"
  | "/bookings"
  | "/bands"
  | "/reviews"
  | "/plans"
  | "/help";

function QuietAction({
  to,
  icon,
  label,
}: {
  to: QuietDestination;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5"
    >
      <span className="shrink-0 text-foreground">{icon}</span>
      <span className="whitespace-nowrap text-1 font-semibold">{label}</span>
    </Link>
  );
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
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-subtle">
          {icon}
        </span>
        <h2 className="text-2">{title}</h2>
        <p className="mt-1 text-1 text-muted-foreground">{body}</p>
        <Btn variant="ink" className="mt-4 w-full" onClick={onRetry}>
          Try again
        </Btn>
      </div>
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className="animate-pulse space-y-4 px-5 pt-6">
      <div className="h-8 w-2/3 rounded-full bg-subtle" />
      <div className="h-4 w-1/2 rounded-full bg-subtle" />
      <div className="h-24 rounded-lg bg-subtle" />
      <div className="h-28 rounded-lg bg-subtle" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-lg bg-subtle" />
        <div className="h-24 rounded-lg bg-subtle" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-md bg-subtle" />
        ))}
      </div>
    </div>
  );
}
