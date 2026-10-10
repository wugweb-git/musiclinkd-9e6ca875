import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Inbox,
  MapPin,
  RefreshCw,
  Settings,
  UserRoundPlus,
  WifiOff,
  ArrowRight,
} from "lucide-react";

import { BookableCard, PersonCard } from "@/components/ml/cards";
import { EmptyState, Loading, StatusPill, Switch } from "@/components/ml/kit";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { NotificationsBell } from "@/components/ml/tab-header";
import { IdentityPill } from "@/components/ml/accounts";
import { Btn, BtnLink, Screen, SectionHeader } from "@/components/ml/ui";
import { ViewerAvatar, firstNameOf, useViewer } from "@/components/ml/viewer";
import { useAuth } from "@/hooks/use-auth";
import { rankBy, useRecommendations } from "@/hooks/use-recommendations";
import { listMyApplications } from "@/lib/applications.functions";
import { discoverBookableFromRow, type DiscoverBookable } from "@/lib/bookable-view";
import { listBookableBookings, type BookingRequest } from "@/lib/bookings.functions";
import { listBookables, listOpportunities } from "@/lib/catalog.functions";
import { listMyConnections } from "@/lib/connections.functions";
import { iconSize } from "@/lib/tokens";
import { opportunityFromRow } from "@/lib/opportunity-view";
import {
  getMyProfile,
  getTaxonomyLabels,
  saveMyProfile,
  listMyPortfolio,
  type TaxonomyLabels,
} from "@/lib/portfolio.functions";
import {
  listPeopleByRole,
  type DirectoryPerson,
  getMyBusiness,
} from "@/lib/profile-groups.functions";
import { profileGaps, type ProfileRow } from "@/lib/profile-map";
import { listMyServices, type ServiceRow } from "@/lib/services.functions";
import { useTaxonomy } from "@/lib/taxonomy";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home | MusicLinkd" },
      {
        name: "description",
        content: "Your work, requests, opportunities and music network in one place.",
      },
      { property: "og:title", content: "Home | MusicLinkd" },
      { property: "og:description", content: "What needs your attention across MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [opportunities, studios, labels] = await Promise.all([
      listOpportunities().catch(() => []),
      listBookables().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    return {
      opportunities: opportunities.map((row) => opportunityFromRow(row, labels)),
      studios: studios.map((row) => discoverBookableFromRow(row, labels)),
      labels,
    };
  },
  staleTime: 60_000,
  component: HomeScreen,
});

type HomeData = {
  profile: ProfileRow | null;
  portfolioCount: number;
  business: Awaited<ReturnType<typeof getMyBusiness>>;
  connections: Awaited<ReturnType<typeof listMyConnections>>;
  applications: Awaited<ReturnType<typeof listMyApplications>>;
  bookings: BookingRequest[];
  services: ServiceRow[];
};

const HOME_READ_TIMEOUT = 6_000;
function readOr<T>(read: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    read.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), HOME_READ_TIMEOUT)),
  ]);
}

function useHomeData() {
  const { signedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const profile = useServerFn(getMyProfile);
  const portfolio = useServerFn(listMyPortfolio);
  const business = useServerFn(getMyBusiness);
  const connections = useServerFn(listMyConnections);
  const applications = useServerFn(listMyApplications);
  const bookings = useServerFn(listBookableBookings);
  const services = useServerFn(listMyServices);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!authLoading && !signedIn) void navigate({ to: "/welcome", replace: true });
  }, [authLoading, signedIn, navigate]);
  useEffect(() => {
    const online = () => setOffline(false);
    const offlineNow = () => setOffline(true);
    setOffline(navigator.onLine === false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineNow);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineNow);
    };
  }, []);

  const query = useQuery({
    queryKey: ["home", "workspace"],
    enabled: !authLoading && signedIn && !offline,
    staleTime: 30_000,
    queryFn: async (): Promise<HomeData> => {
      const [profileRow, work, businessRow] = await Promise.all([
        readOr(profile() as Promise<ProfileRow | null>, null),
        readOr(portfolio(), []),
        readOr(business(), null),
      ]);
      const [network, applied, incoming, myServices] = businessRow
        ? await Promise.all([
            Promise.resolve({ connected: [], received: [], sent: [] }) as ReturnType<
              typeof connections
            >,
            Promise.resolve([]) as ReturnType<typeof applications>,
            readOr(bookings(), []),
            readOr(services(), []),
          ])
        : await Promise.all([
            readOr(connections(), { connected: [], received: [], sent: [] }),
            readOr(applications(), []),
            Promise.resolve([] as BookingRequest[]),
            Promise.resolve([] as ServiceRow[]),
          ]);
      return {
        profile: profileRow,
        portfolioCount: work.length,
        business: businessRow,
        connections: network,
        applications: applied,
        bookings: incoming,
        services: myServices,
      };
    },
  });
  return { offline, query };
}

function HomeScreen() {
  const { offline, query } = useHomeData();
  const { loading: authLoading, signedIn } = useAuth();
  return (
    <Screen className="pb-nav-clear">
      {authLoading || !signedIn ? (
        <HomeSkeleton />
      ) : offline ? (
        <HomeState
          icon={<WifiOff size={iconSize.lg} />}
          title="You’re offline"
          body="Reconnect to refresh what needs your attention."
          onRetry={() => void query.refetch()}
        />
      ) : query.isError ? (
        <HomeState
          icon={<RefreshCw size={iconSize.lg} />}
          title="Home didn’t load"
          body="Your information is safe. Try again in a moment."
          onRetry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <HomeSkeleton />
      ) : query.data.business ? (
        <BusinessHome data={query.data} />
      ) : (
        <TalentHome data={query.data} />
      )}
    </Screen>
  );
}

/*
 * Open to work (owner, 10 Oct 2026): one switch, on Home for every account type, the same one as
 * onboarding's "How do you work?". Saved straight to profiles.availability as "Available" or
 * nothing; any other stored value (an older "Shows", say) reads as on and is replaced when changed.
 */
function OpenToWork({ profile }: { profile: ProfileRow | null }) {
  const save = useServerFn(saveMyProfile);
  const client = useQueryClient();
  const [on, setOn] = useState(Boolean(profile?.availability));
  const [busy, setBusy] = useState(false);
  useEffect(() => setOn(Boolean(profile?.availability)), [profile?.availability]);
  if (!profile) return null;
  return (
    <section className="px-5">
      <div className="flex min-h-touch items-center justify-between gap-3 rounded-lg border border-border bg-card px-4">
        <span className="text-sm font-medium text-foreground">Open to work</span>
        <Switch
          label="Open to work"
          checked={on}
          onChange={(next) => {
            if (busy) return;
            setOn(next);
            setBusy(true);
            save({ data: { availability: next ? "Available" : null } })
              .then(() => client.invalidateQueries({ queryKey: ["home", "workspace"] }))
              .catch(() => {
                setOn(!next);
                toast.error("That didn't save. Try again.");
              })
              .finally(() => setBusy(false));
          }}
        />
      </div>
    </section>
  );
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function HomeHeader(_: { business?: boolean }) {
  // Title-only header, no eyebrow (owner rule): the identity pill says who you are acting as and
  // opens the account sheet; the bell and Settings stay on the right.
  return (
    <header className="bg-card px-5 pb-4 pt-safe">
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="min-w-0">
          <IdentityPill />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <NotificationsBell />
          <Link
            to="/settings"
            aria-label="Settings"
            className="hit-area state-layer flex h-10 w-10 items-center justify-center rounded-full"
          >
            <Settings size={iconSize.md} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function TalentHome({ data }: { data: HomeData }) {
  const loaded = Route.useLoaderData();
  const recs = useRecommendations();
  const saved = useSavedOpportunities();
  const gaps = profileGaps(data.profile);
  const roles = data.profile?.roles ?? [];
  const peers = usePeers(roles[0] ?? null);
  const people = recs?.people.length ? recs.people.slice(0, 8) : peers;
  const opportunities = rankBy(loaded.opportunities, recs?.opportunities, (o) => o.id).slice(0, 4);
  const studios = rankBy(loaded.studios, recs?.studios, (s) => s.id).slice(0, 5);
  const attention =
    data.connections.received.length +
    data.applications.filter((a) => ["shortlisted", "accepted"].includes(a.status)).length;

  return (
    <>
      <HomeHeader />
      <main className="space-y-8 py-5">
        <OpenToWork profile={data.profile} />
        <section className="px-5">
          <div className="rounded-lg bg-ink p-5 text-ink-foreground">
            <p className="text-1 font-semibold text-background/70">What matters now</p>
            <h2 className="mt-1 text-3 text-ink-foreground">
              {attention
                ? `${attention} ${attention === 1 ? "update" : "updates"} need your attention`
                : "Your next move starts here"}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <BtnLink
                to="/opportunities"
                variant="outline"
                className="border-background/20 bg-background text-foreground"
              >
                Find work
              </BtnLink>
              <BtnLink
                to="/discover"
                variant="outline"
                className="border-background/20 bg-background text-foreground"
              >
                Meet people
              </BtnLink>
            </div>
          </div>
        </section>

        {gaps.missing.length || data.portfolioCount === 0 ? (
          <section>
            <SectionHeader title="Continue building" />
            <div className="mx-5 overflow-hidden rounded-lg border border-border bg-card">
              {gaps.missing.length ? (
                <ActionRow
                  to={data.profile?.onboarding_complete ? "/profile/edit" : "/onboarding/resume"}
                  title="Strengthen your profile"
                  detail={`${gaps.percent}% complete · Next: ${gaps.missing[0]?.label ?? "Profile details"}`}
                />
              ) : null}
              {data.portfolioCount === 0 ? (
                <ActionRow
                  to="/portfolio"
                  title="Add work to your portfolio"
                  detail="Give people something useful to hear, watch or review."
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {opportunities.length ? (
          <section>
            <SectionHeader
              title={recs?.hasSignals ? "Opportunities for you" : "Open opportunities"}
              action={
                <Link to="/opportunities" className="link-action text-sm font-semibold">
                  See all
                </Link>
              }
            />
            <div className="space-y-3 px-5">
              {opportunities.map((o) => (
                <OpportunityCard
                  key={o.id}
                  o={o}
                  saved={saved.has(o.id)}
                  onSave={() => saved.toggle(o.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {people.length ? <PeopleRail title="People worth meeting" people={people} /> : null}
        {studios.length ? (
          <StudioRail title="Places for your next session" studios={studios} />
        ) : null}
      </main>
    </>
  );
}

function BusinessHome({ data }: { data: HomeData }) {
  const profile = data.business?.profile;
  const pendingBookings = data.bookings.filter(
    (b) => b.status === "requested" || b.status === "reviewing",
  );
  const activeServices = data.services.filter((service) => service.status === "active");
  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = data.bookings.filter(
    (booking) => booking.session_date === today && booking.status === "confirmed",
  );
  return (
    <>
      <HomeHeader business />
      <main className="space-y-8 py-5">
        <OpenToWork profile={data.profile} />
        <section className="px-5">
          <div className="flex items-start gap-4 rounded-lg bg-ink p-5 text-ink-foreground">
            <div className="min-w-0 flex-1">
              <p className="text-1 font-semibold text-background/70">
                {profile?.roles?.[0] || "Business"}
              </p>
              <h2 className="mt-1 text-3 text-ink-foreground">
                {profile?.display_name || "Your business"}
              </h2>
              {profile?.city ? (
                <p className="mt-2 flex items-center gap-1 text-sm text-background/70">
                  <MapPin size={iconSize.sm} aria-hidden />
                  {profile.city}
                </p>
              ) : null}
            </div>
            {profile?.is_verified ? (
              <StatusPill label="Verified" tone="good" />
            ) : (
              <StatusPill label="Not verified" tone="neutral" />
            )}
          </div>
        </section>

        <section className="px-5">
          <Link
            to="/discover/match"
            search={{ intent: "hire" }}
            className="state-layer flex items-center gap-3 rounded-lg bg-ink p-4 text-ink-foreground"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Describe a hiring need</span>
              <span className="mt-0.5 block text-1 opacity-80">
                AI matches it with MusicLinkd professionals who fit.
              </span>
            </span>
            <ArrowRight size={iconSize.sm} aria-hidden />
          </Link>
        </section>

        {pendingBookings.length ? (
          <section>
            <SectionHeader title="Needs attention" />
            <div className="mx-5 overflow-hidden rounded-lg border border-border bg-card">
              {pendingBookings.length ? (
                <ActionRow
                  to="/business/bookings/requests"
                  title={`${pendingBookings.length} booking ${pendingBookings.length === 1 ? "request" : "requests"}`}
                  detail="Review the date, service and request details."
                  icon={<CalendarDays size={iconSize.md} />}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {todayBookings.length ? (
          <section>
            <SectionHeader title="Today" />
            <div className="mx-5 overflow-hidden rounded-lg border border-border bg-card">
              {todayBookings.map((booking) => (
                <BookingActionRow key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader title="Run your business" />
          <div className="mx-5 grid grid-cols-2 gap-2">
            <WorkspaceLink
              to="/business/bookings/requests"
              icon={<CalendarDays size={iconSize.lg} />}
              label="Bookings"
              detail={
                pendingBookings.length
                  ? `${pendingBookings.length} awaiting review`
                  : "Manage requests"
              }
            />
            {/* Enquiries are messages (owner, 4 Oct: Inbox = communication + leads). */}
            <WorkspaceLink
              to="/inbox"
              icon={<Inbox size={iconSize.lg} />}
              label="Inbox"
              detail="Messages and requests"
            />
            <WorkspaceLink
              to="/services"
              icon={<BriefcaseBusiness size={iconSize.lg} />}
              label="Services"
              detail={
                activeServices.length ? `${activeServices.length} active` : "Add what you offer"
              }
            />
            <WorkspaceLink
              to="/discover"
              icon={<UserRoundPlus size={iconSize.lg} />}
              label="Source talent"
              detail="Find the right people"
            />
          </div>
        </section>

        {activeServices.length ? (
          <section>
            <SectionHeader
              title="Active services"
              action={
                <Link to="/services" className="link-action text-sm font-semibold">
                  Manage
                </Link>
              }
            />
            <div className="mx-5 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {activeServices.slice(0, 4).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{service.name}</p>
                    <p className="text-1 text-muted-foreground">Active</p>
                  </div>
                  <ChevronRight size={iconSize.sm} aria-hidden />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}

function ActionRow({
  to,
  title,
  detail,
  icon,
}: {
  to: "/profile/edit" | "/onboarding/resume" | "/portfolio" | "/business/bookings/requests";
  title: string;
  detail: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="state-layer flex min-h-touch items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0"
    >
      {icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-subtle">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-1 text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight size={iconSize.sm} className="shrink-0" aria-hidden />
    </Link>
  );
}

function BookingActionRow({ booking }: { booking: BookingRequest }) {
  return (
    <Link
      to="/business/bookings/requests/$ref"
      params={{ ref: booking.id }}
      className="state-layer flex min-h-touch items-center gap-3 px-4 py-3.5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-subtle">
        <CalendarDays size={iconSize.md} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">
          {booking.service?.name || booking.purpose || "Booking"}
        </span>
        <span className="mt-0.5 block text-1 text-muted-foreground">
          {[booking.start_time, booking.requester_name].filter(Boolean).join(" · ")}
        </span>
      </span>
      <ChevronRight size={iconSize.sm} aria-hidden />
    </Link>
  );
}

function WorkspaceLink({
  to,
  icon,
  label,
  detail,
}: {
  to: "/business/bookings/requests" | "/inbox" | "/services" | "/discover";
  icon: ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className="state-layer flex min-h-32 min-w-0 flex-col rounded-lg border border-border bg-card p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-subtle">
        {icon}
      </span>
      <span className="mt-3 block break-words text-sm font-semibold">{label}</span>
      <span className="mt-1 block break-words text-1 text-muted-foreground">{detail}</span>
    </Link>
  );
}

function PeopleRail({ title, people }: { title: string; people: DirectoryPerson[] }) {
  const { options } = useTaxonomy();
  return (
    <section>
      <SectionHeader
        title={title}
        action={
          <Link to="/discover" className="link-action text-sm font-semibold">
            See all
          </Link>
        }
      />
      <div className="rail no-scrollbar flex gap-3 overflow-x-auto px-5">
        {people.slice(0, 8).map((person) => (
          <PersonCard key={person.id} person={person} roleLabels={options?.person_types} featured />
        ))}
      </div>
    </section>
  );
}

function StudioRail({ title, studios }: { title: string; studios: DiscoverBookable[] }) {
  return (
    <section>
      <SectionHeader
        title={title}
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
        {studios.map((studio) => (
          <BookableCard key={studio.id} studio={studio} featured />
        ))}
      </div>
    </section>
  );
}

function usePeers(role: string | null) {
  const list = useServerFn(listPeopleByRole);
  const query = useQuery({
    queryKey: ["home", "peers", role],
    queryFn: () => list({ data: { ...(role ? { role } : {}), limit: 8 } }),
  });
  return query.data ?? [];
}

function HomeState({
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
    <div className="px-5 py-20">
      <EmptyState icon={icon} title={title} body={body}>
        <Btn onClick={onRetry} className="w-full">
          Try again
        </Btn>
      </EmptyState>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-5 px-5 pt-safe" aria-busy aria-label="Loading home">
      <div className="h-16 animate-pulse rounded-lg bg-card" />
      <div className="h-48 animate-pulse rounded-lg bg-ink/10" />
      <Loading rows={4} />
    </div>
  );
}
