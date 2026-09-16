import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
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
import { Screen, Btn, BtnLink, SectionHeader } from "@/components/ml/ui";
import { EmptyState, Loading, Row, StatusPill } from "@/components/ml/kit";
import { TalentCard } from "@/components/ml/cards";
import { ViewerAvatar, firstNameOf, useViewer } from "@/components/ml/viewer";
import { NotificationsBell } from "@/components/ml/tab-header";
import {
  emptyDashboard,
  forYouTiles,
  headlineUpdate,
  type ContinueCard,
  type DashboardData,
  type ForYouTile,
} from "@/data/dashboard";
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

type Home = { data: DashboardData; cont: ContinueCard[] };

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

  return { data, cont };
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
    // No brand mark here: the splash carries it, and Home is already the app's own screen.
    <header className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-border bg-background/90 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <NotificationsBell />
      <ViewerAvatar className="h-10 w-10" />
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
  const { data, cont } = home;
  const { user } = data;
  const { displayName } = useViewer();
  const viewerFirstName = firstNameOf(displayName);
  const hello = useGreeting();
  const headline = headlineUpdate(data);

  return (
    <div className="min-w-0 pb-4">
      {/*
       * Who you are today: the greeting, what you do, whether you are taking work, and how much of
       * the profile is filled. One band, no card — this is the page's own header, not an item in it.
       */}
      <section className="min-w-0 animate-rise px-5 pt-5">
        <h1 className="break-words text-3 leading-tight">
          {hello}
          {viewerFirstName ? `, ${viewerFirstName}` : ""}
        </h1>
        {user.role ? (
          <p className="mt-1 truncate text-sm text-muted-foreground">{user.role}</p>
        ) : null}
        <div className="mt-3">
          <StatusPill
            label={user.available ? "Open to collaborations" : "Not taking work"}
            tone={user.available ? "good" : "neutral"}
          />
        </div>
        <Link
          to="/profile/edit"
          className="mt-4 flex items-center gap-3 rounded-md py-1 state-layer"
          aria-label={`Profile ${user.profileCompletion}% complete. Edit your profile.`}
        >
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-subtle">
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-standard"
              // computed: how much of the profile is filled
              style={{ width: `${user.profileCompletion}%` }}
            />
          </span>
          <span className="shrink-0 text-1 text-muted-foreground">
            Profile {user.profileCompletion}%
          </span>
          <ChevronRight size={14} className="shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      </section>

      {/*
       * Needs you: the short list of things actually waiting, as rows. Only what the database can
       * back — setup steps, a first work, applications — so nothing here is an invented count.
       */}
      <section className="pt-7">
        <SectionHeader title="Needs you" />
        <ul className="mx-5 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {cont.map((c) => (
            <li key={c.id}>
              <Row
                title={c.title}
                {...(c.meta ? { subtitle: c.meta } : {})}
                to={c.to}
                right={
                  typeof c.progress === "number" ? (
                    <span className="text-1 text-muted-foreground">{c.detail}</span>
                  ) : undefined
                }
              />
            </li>
          ))}
          <li>
            <Row
              title="Your applications"
              subtitle="Nothing yet"
              to="/opportunities/applications"
            />
          </li>
          <li>
            <Row title="Open opportunities" subtitle="Roles being cast now" to="/opportunities" />
          </li>
        </ul>
      </section>

      {headline ? (
        <section className="px-5 pt-6">
          <Link
            to={headline.to}
            className="state-layer flex min-w-0 items-center gap-3 rounded-lg bg-subtle p-4"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-2 font-semibold leading-snug">
                {headline.title}
              </span>
              <span className="mt-0.5 block line-clamp-2 text-1 text-muted-foreground">
                {headline.body}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </section>
      ) : null}

      {/* People to meet, when there are any; the strip is the app's own card, not a new pattern. */}
      {data.forYou.length ? (
        <section className="pt-7">
          <SectionHeader title="People to meet" action={<Link to="/discover">See All</Link>} />
          <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {data.forYou.map((t) => (
              <TalentCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="pt-7">
        <SectionHeader title="Activity" />
        {data.activity.length ? (
          <ul className="space-y-1 px-5">
            {data.activity.map((a) => (
              <li key={a.id} className="flex min-w-0 items-start gap-3 py-2.5">
                <span
                  aria-hidden
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.kind === "view" ? "bg-border" : "bg-brand"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-1 font-semibold leading-snug">{a.title}</p>
                  <p className="truncate text-1 text-muted-foreground">
                    {a.meta} · {a.when}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-5">
            <EmptyState
              title="Nothing yet"
              body="Follow artists and studios, and their updates land here."
            >
              <BtnLink to="/discover" variant="ink">
                Discover talent
              </BtnLink>
            </EmptyState>
          </div>
        )}
      </section>

      {/* Everything else you might want, kept quiet and scrollable. */}
      <section className="pt-7">
        <SectionHeader title="Shortcuts" />
        <div className="rail no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
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
      <EmptyState icon={icon} title={title} body={body}>
        <Btn variant="ink" className="w-full" onClick={onRetry}>
          Try again
        </Btn>
      </EmptyState>
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className="space-y-4 px-5 pt-6" aria-busy aria-label="Loading your dashboard">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 rounded-full bg-subtle" />
        <div className="h-4 w-1/2 rounded-full bg-subtle" />
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
