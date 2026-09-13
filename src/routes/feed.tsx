import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { TalentCard } from "@/components/ml/cards";
import { ViewerAvatar, firstNameOf, useViewer } from "@/components/ml/viewer";
import {
  dashboardData,
  continueCards,
  forYouTiles,
  headlineUpdate,
  type ContinueCard,
  type DashboardData,
} from "@/data/dashboard";

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

function useDashboard() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("offline");
      return;
    }
    setStatus("loading");
    const t = setTimeout(() => {
      try {
        setData(dashboardData);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }, 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cleanup = load();
    const onOffline = () => setStatus("offline");
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", load);
    return () => {
      cleanup?.();
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", load);
    };
  }, [load]);

  return { status, data, retry: load };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { status, data, retry } = useDashboard();

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
      {status === "ready" && data ? <Body data={data} /> : null}
    </Screen>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/90 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        MusicLinkd
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/messages"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Link>
        <ViewerAvatar className="h-10 w-10" />
      </div>
    </header>
  );
}

function Body({ data }: { data: DashboardData }) {
  const { user } = data;
  const { displayName } = useViewer();
  const viewerFirstName = firstNameOf(displayName);
  const headline = headlineUpdate(data);
  const cont = continueCards(data);
  const tiles = forYouTiles(data);
  const isEmpty = !headline && cont.length === 0 && data.activity.length === 0;

  return (
    <div className="min-w-0 pb-4">
      {/* 1 — Greeting */}
      <section className="min-w-0 px-5 pt-5">
        <h1 className="break-words text-[28px] leading-tight">
          {greeting()}
          {viewerFirstName ? `, ${viewerFirstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEmpty ? "Your network is quiet today." : "Here's your MusicLinkd today."}
        </p>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{ background: "var(--success-container)", color: "var(--success)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--success)" }} />
            {user.available ? "Open to collaborations" : "Not taking work"}
          </span>
          <span className="max-w-full truncate rounded-full bg-subtle px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
            {user.role}
          </span>
        </div>
      </section>

      {/* 2 — Single highest-value update */}
      {headline ? (
        <section className="px-5 pt-4">
          <Link
            to={headline.to}
            className="flex min-w-0 items-center gap-3 rounded-3xl border border-border p-4"
            style={{ background: "var(--pink-container)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-bold leading-snug">{headline.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                {headline.body}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
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
          <Link
            to="/opportunities"
            className="min-w-0 rounded-3xl border border-border bg-card p-4"
          >
            <p className="text-[24px] font-bold leading-none">5</p>
            <p className="mt-2 truncate text-[12px] font-semibold">Matching you</p>
            <p className="truncate text-[11px] text-muted-foreground">Singers, mixers, gigs</p>
          </Link>
          <Link
            to="/opportunities/applications"
            className="min-w-0 rounded-3xl border border-border bg-card p-4"
          >
            <p className="text-[24px] font-bold leading-none">2</p>
            <p className="mt-2 truncate text-[12px] font-semibold">Your applications</p>
            <p className="truncate text-[11px] text-muted-foreground">1 shortlisted</p>
          </Link>
        </div>
      </section>

      {/* 4 — For you */}

      {tiles.length || data.forYou.length ? (
        <section className="pt-6">
          <SectionHeader title="For you" action={<Link to="/recommendations">See all</Link>} />
          {tiles.length ? (
            <div className="grid grid-cols-2 gap-3 px-5">
              {tiles.map((t) => (
                <Link
                  key={t.id}
                  to={t.to}
                  className="min-w-0 rounded-3xl border border-border bg-card p-4"
                >
                  <p className="text-[24px] font-bold leading-none">{t.value}</p>
                  <p className="mt-2 truncate text-[12px] font-semibold">{t.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{t.hint}</p>
                </Link>
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
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: a.kind === "view" ? "var(--border)" : "var(--primary)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{a.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {a.meta} · {a.when}
                  </p>
                </div>
                {a.kind === "request" ? (
                  <Btn variant="primary" className="min-h-9 shrink-0 px-4 text-[11px]">
                    Accept
                  </Btn>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-5 rounded-3xl border border-border bg-card p-5 text-center">
            <p className="text-[14px] font-semibold">No activity yet</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Connect with artists and studios to see updates here.
            </p>
            <Link
              to="/"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-xs font-semibold text-background"
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
            className="flex min-w-0 items-center gap-3 rounded-3xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {c.eyebrow}
      </p>
      <p className="mt-1 line-clamp-2 text-[16px] font-bold leading-snug">{c.title}</p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{c.meta}</p>
      <p className="mt-1 truncate text-[12px] font-semibold">{c.detail}</p>
      {typeof c.progress === "number" ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-primary" style={{ width: `${c.progress}%` }} />
        </div>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
        {c.cta} <ArrowRight size={13} />
      </span>
    </>
  );
  const cls = "block min-w-0 rounded-3xl border border-border bg-card p-4";
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
  | "/verification"
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
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="whitespace-nowrap text-[12px] font-semibold">{label}</span>
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
      <div className="rounded-3xl border border-border bg-card p-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
          {icon}
        </span>
        <h2 className="text-[17px]">{title}</h2>
        <p className="mt-1 text-[12px] text-muted-foreground">{body}</p>
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
      <div className="h-24 rounded-3xl bg-subtle" />
      <div className="h-28 rounded-3xl bg-subtle" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-3xl bg-subtle" />
        <div className="h-24 rounded-3xl bg-subtle" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-2xl bg-subtle" />
        ))}
      </div>
    </div>
  );
}
