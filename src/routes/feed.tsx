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
  Calendar,
  Users,
  Star,
  CreditCard,
  LifeBuoy,
  Settings,
} from "lucide-react";
import { Screen, Btn, BtnLink, SectionHeader } from "@/components/ml/ui";
import { Switch } from "@/components/ui/switch";
import { EmptyState, Loading, Price } from "@/components/ml/kit";
import { TalentCard } from "@/components/ml/cards";
import { ViewerAvatar, firstNameOf, useViewer } from "@/components/ml/viewer";
import { NotificationsBell } from "@/components/ml/tab-header";
import { emptyDashboard, type ContinueCard, type DashboardData } from "@/data/dashboard";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyProfile,
  listMyPortfolio,
  getTaxonomyLabels,
  saveMyProfile,
} from "@/lib/portfolio.functions";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";
import { listOpportunities, listStudios } from "@/lib/catalog.functions";
import { listPeopleByRole } from "@/lib/profile-groups.functions";
import { discoverStudioFromRow } from "@/lib/studio-view";
import { priceParts } from "@/lib/price";
import { profileGaps, type ProfileRow } from "@/lib/profile-map";
import { labelFor, loadTaxonomy } from "@/lib/taxonomy";
import { SectionActionLink } from "@/components/ml/links";

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
  // Home's content is the network's: roles being cast, people, studios. All public reads.
  loader: async () => {
    const [opportunities, studios, labels] = await Promise.all([
      listOpportunities().catch(() => []),
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    return {
      opportunities: opportunities.slice(0, 6),
      studios: studios.map((row) => discoverStudioFromRow(row, labels)).slice(0, 6),
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
    <header className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-border bg-background/90 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <Link
        to="/notifications"
        aria-label="Notifications"
        className="hit-area state-layer flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <Bell size={18} aria-hidden />
      </Link>
      <Link
        to="/settings"
        aria-label="Settings"
        className="hit-area state-layer flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <Settings size={18} aria-hidden />
      </Link>
      <ViewerAvatar className="h-12 w-12" />
    </header>
  );
}

function Body({ home }: { home: Home }) {
  const { data, cont } = home;
  const { user } = data;
  const { opportunities, studios, labels } = Route.useLoaderData();
  const { displayName } = useViewer();
  const viewerFirstName = firstNameOf(displayName);
  const hello = useGreeting();
  const peers = usePeers(home.roleSlug);

  return (
    <div className="min-w-0 pb-4">
      {/*
       * The stage: the one dark band on any screen. Who you are, whether you are taking work and
       * how complete the profile is, in white on ink, so Home opens with weight instead of a list.
       */}
      <section className="relative -mt-px overflow-hidden rounded-b-3xl bg-ink px-5 pb-6 pt-6 text-background">
        <p className="text-1 text-background/70">{hello}</p>
        <h1 className="mt-1 break-words text-4 font-bold leading-[1.05]">
          {viewerFirstName || "Welcome"}
        </h1>
        {user.role ? <p className="mt-1 truncate text-sm text-background/70">{user.role}</p> : null}

        <AvailabilitySwitch available={user.available} />

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
                  <ChevronRight size={16} className="shrink-0 text-background/70" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Roles being cast: the live opportunities table, newest first. */}
      <section className="pt-7">
        <SectionHeader title="Roles being cast" action={<Link to="/opportunities">See All</Link>} />
        {opportunities.length ? (
          <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {opportunities.map((o) => (
              <Link
                key={o.id}
                to="/opportunities/$id"
                params={{ id: o.slug }}
                className="state-layer flex w-[240px] shrink-0 flex-col justify-between rounded-lg border border-border bg-card p-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-2 font-semibold leading-snug">
                    {o.title}
                  </span>
                  <span className="mt-1 block truncate text-1 text-muted-foreground">
                    {[o.role_required, o.location].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="mt-3 flex items-end justify-between gap-2">
                  <Price price={priceParts(o.budget_paise, o.budget_unit, o.budget_note)} />
                  <span className="pill shrink-0 bg-subtle text-muted-foreground">
                    {o.applicant_count} applied
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-5">
            <EmptyState title="No open roles" body="New castings appear here as they are posted." />
          </div>
        )}
      </section>

      {/* People in the same line of work, from the live profiles table. */}
      {peers.length ? (
        <section className="pt-7">
          <SectionHeader title="People to meet" action={<Link to="/discover">See All</Link>} />
          <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {peers.map((p) => (
              <Link
                key={p.username}
                to="/profile/$username"
                params={{ username: p.username }}
                className="state-layer flex w-[150px] shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center"
              >
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span aria-hidden className="h-14 w-14 rounded-full bg-subtle" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-1 font-semibold">{p.name}</span>
                  <span className="block truncate text-1 text-muted-foreground">
                    {p.city ?? p.roles[0] ?? ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Studios, live from the studios table, with their real rate. */}
      {studios.length ? (
        <section className="pt-7">
          <SectionHeader title="Studios to book" action={<Link to="/studio">See All</Link>} />
          <ul className="mx-5 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {studios.map((st) => (
              <li key={st.slug}>
                <Link to="/studio" className="state-layer flex items-center gap-3 px-4 py-3.5">
                  {st.photo ? (
                    <img
                      src={st.photo}
                      alt=""
                      loading="lazy"
                      className="h-11 w-11 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span aria-hidden className="h-11 w-11 shrink-0 rounded-md bg-subtle" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{st.name}</span>
                    <span className="block truncate text-1 text-muted-foreground">
                      {st.location}
                    </span>
                  </span>
                  <Price price={st.rate} align="end" />
                </Link>
              </li>
            ))}
          </ul>
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

      <section className="pt-7">
        <SectionHeader title="Shortcuts" />
        <div className="rail no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
          <QuietAction to="/portfolio/new" icon={<Plus size={14} />} label="Add track" />
          <QuietAction to="/search" icon={<Search size={14} />} label="Search talent" />
          <QuietAction to="/studio" icon={<Building2 size={14} />} label="Find a studio" />
          <QuietAction to="/bookings" icon={<Calendar size={14} />} label="My bookings" />
          <QuietAction to="/bands" icon={<Users size={14} />} label="My bands" />
          <QuietAction to="/reviews" icon={<Star size={14} />} label="Reviews" />
          <QuietAction to="/plans" icon={<CreditCard size={14} />} label="Plan" />
          <QuietAction to="/help" icon={<LifeBuoy size={14} />} label="Help" />
        </div>
      </section>
    </div>
  );
}

/*
 * Home is the person's own screen, so availability is a control here, not a badge: flip it and the
 * profile is updated. The public profile is where other people read the result.
 */
function AvailabilitySwitch({ available }: { available: boolean }) {
  const save = useServerFn(saveMyProfile);
  const [on, setOn] = useState(available);
  const [saving, setSaving] = useState(false);

  const toggle = async (next: boolean) => {
    setOn(next);
    setSaving(true);
    try {
      await save({ data: { availability: next ? "Open to collaborations" : null } });
    } catch {
      setOn(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 flex items-center gap-3 rounded-lg bg-background/10 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Taking work</span>
        <span className="block text-1 text-background/70">
          {on ? "People can see you are open" : "Hidden from people looking to hire"}
        </span>
      </span>
      <Switch
        checked={on}
        disabled={saving}
        onCheckedChange={(next) => void toggle(next)}
        aria-label="Taking work"
      />
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
          Try Again
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
