import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, WifiOff, RefreshCw, Plus, Search, Building2, UserPlus } from "lucide-react";
import { Screen, SectionHeader, Btn, VerifiedBadge } from "@/components/ml/ui";
import { TalentCard } from "@/components/ml/cards";
import { dashboardData, type DashboardData } from "@/data/dashboard";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Your Dashboard | MusicLinkd" },
      {
        name: "description",
        content:
          "Your MusicLinkd home — connection requests, profile activity, collaboration matches and upcoming studio bookings in one place.",
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
        <Link to="/me" aria-label="Your profile">
          <img
            src={dashboardData.user.photo}
            alt="Your profile"
            className="h-10 w-10 rounded-full border border-border object-cover"
          />
        </Link>
      </div>
    </header>
  );
}

function Body({ data }: { data: DashboardData }) {
  const { user } = data;
  const isEmpty =
    data.stats.every((s) => s.value === 0) && data.activity.length === 0 && data.continueItems.length === 0;

  return (
    <div className="pb-4">
      {/* Welcome */}
      <section className="px-5 pt-5">
        <h1 className="text-[28px] leading-tight">
          {greeting()}, {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEmpty
            ? "Your network is quiet. Start by discovering collaborators."
            : `${data.stats[0]!.value} connection requests and ${data.stats[3]!.value} collab matches are waiting.`}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{ background: "var(--success-container)", color: "var(--success)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--success)" }} />
            {user.available ? "Open to collaborations" : "Not taking work"}
          </span>
          <span className="truncate rounded-full bg-subtle px-3 py-1.5 text-[11px] font-semibold text-text2">
            {user.role}
          </span>
        </div>
      </section>

      {/* Your activity */}
      <section className="pt-6">
        <SectionHeader title="Your activity" />
        <div className="grid grid-cols-2 gap-3 px-5">
          {data.stats.map((s) => (
            <Link
              key={s.key}
              to={s.to}
              className="min-w-0 rounded-3xl border border-border bg-card p-4"
            >
              <p className="text-[26px] leading-none font-bold">{s.value}</p>
              <p className="mt-2 truncate text-[12px] font-semibold">{s.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">{s.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Continue */}
      {data.continueItems.length ? (
        <section className="pt-6">
          <SectionHeader title="Continue where you left off" />
          <div className="space-y-3 px-5">
            {data.continueItems.map((c) => (
              <Link
                key={c.id}
                to={c.to}
                className="block rounded-3xl border border-border p-4"
                style={{ background: "var(--pink-container)" }}
              >
                <p className="text-[15px] font-bold leading-snug">{c.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.meta}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-card">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.progress}%` }} />
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                  {c.cta} <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* For you */}
      {data.forYou.length ? (
        <section className="pt-6">
          <SectionHeader title="For you" action="See all" />
          <div className="flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
            {data.forYou.map((t) => (
              <TalentCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Upcoming */}
      {data.bookings.length ? (
        <section className="pt-6">
          <SectionHeader title="Upcoming" action="Calendar" />
          <div className="space-y-3 px-5">
            {data.bookings.map((b) => (
              <Link
                key={b.id}
                to="/studio"
                className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
              >
                <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-background">
                  <span className="text-[16px] font-bold leading-none">{b.day}</span>
                  <span className="text-[10px] uppercase opacity-80">{b.month}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[14px]">{b.title}</h3>
                  <p className="truncate text-[11px] text-muted-foreground">{b.meta}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Recent activity */}
      <section className="pt-6">
        <SectionHeader title="Recent activity" />
        {data.activity.length ? (
          <ul className="space-y-3 px-5">
            {data.activity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-3xl border border-border bg-card p-3">
                <img
                  src={a.photo}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1">
                    <p className="line-clamp-2 text-[13px] font-semibold">{a.title}</p>
                    {a.kind === "request" ? <VerifiedBadge size={13} /> : null}
                  </div>
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
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-xs font-semibold text-background"
            >
              Discover talent
            </Link>
          </div>
        )}
      </section>

      {/* Secondary actions */}
      <section className="pt-6">
        <SectionHeader title="Quick actions" />
        <div className="grid grid-cols-2 gap-3 px-5">
          <SecondaryAction to="/me" icon={<Plus size={16} />} label="Add track / EP" />
          <SecondaryAction to="/search" icon={<Search size={16} />} label="Search talent" />
          <SecondaryAction to="/studio" icon={<Building2 size={16} />} label="Find a studio" />
          <SecondaryAction to="/messages" icon={<UserPlus size={16} />} label="Find contacts" />
        </div>
        <div className="mt-3 px-5">
          <Link to="/me" className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
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
      </section>
    </div>
  );
}

function SecondaryAction({
  to,
  icon,
  label,
}: {
  to: "/me" | "/search" | "/studio" | "/messages";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3"
    >
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="truncate text-[12px] font-semibold">{label}</span>
    </Link>
  );
}

function StateBlock({
  icon,
  title,
  body,
  onRetry,
}: {
  icon: React.ReactNode;
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
        <Btn variant="navy" className="mt-4 w-full" onClick={onRetry}>
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
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-3xl bg-subtle" />
        ))}
      </div>
      <div className="h-28 rounded-3xl bg-subtle" />
      <div className="flex gap-3">
        <div className="h-44 w-[172px] shrink-0 rounded-3xl bg-subtle" />
        <div className="h-44 w-[172px] shrink-0 rounded-3xl bg-subtle" />
      </div>
    </div>
  );
}
