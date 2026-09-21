import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  House,
  Pencil,
  Share2,
  Globe,
  MapPin,
  Navigation,
  Music,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { connectionWith, setFollowing as setFollowingFn } from "@/lib/connections.functions";
import { shareLink } from "@/lib/booking-actions";
import { SectionTabs, StateIcon, type Move, type SolidIcon } from "./tab-icon";
import { Screen, TopBar, Btn, BtnLink, Chip, IconBtn, IconBtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Price } from "@/components/ml/kit";
import type { BusinessView } from "@/lib/business-view";
import { TextLink } from "@/components/ml/links";
import { CoverHero, ReviewCard } from "@/components/ml/profile";
import { CallBtn } from "@/components/ml/person-profile";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useMessagePerson } from "@/hooks/use-message-person";
import { iconSize } from "@/lib/tokens";
import { shownPlace } from "@/lib/place";

// Team is off for now: one business profile belongs to one account (owner, 21 Sep 2026).
type BusinessTab = "Overview" | "Spaces" | "Credits" | "Reviews";

/** Same row as the person profile: icon alone until selected, then solid with its move. */
const tabs: { key: BusinessTab; icon: LucideIcon; solid: SolidIcon; move: Move }[] = [
  { key: "Overview", icon: Sparkles, solid: "sparkle", move: "spin" },
  { key: "Spaces", icon: House, solid: "home", move: "hop" },
  { key: "Credits", icon: Music, solid: "music", move: "dance" },
  { key: "Reviews", icon: Star, solid: "star", move: "stamp" },
];

/** A business account's profile: /business/$id and /profile/$username for a business. */
export function BusinessProfileExperience({ b }: { b: BusinessView | undefined }) {
  const [tab, setTab] = useState<BusinessTab>("Overview");
  const { user } = useAuth();
  const isOwner = !!b && user?.id === b.profileId;

  if (!b) {
    return (
      <Screen>
        <TopBar title="Business" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This profile may have been removed." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* The person profile's own header: cover, the business's picture as its logo, the name. */}
      <CoverHero
        cover={b.cover}
        photo={b.logo}
        name={b.name}
        square
        back="/business"
        actions={
          isOwner ? (
            // Managing is the owner's; a visitor has nothing to manage here.
            <Link
              to="/business/$id/manage"
              params={{ id: b.id }}
              aria-label="Manage business"
              className="grid h-10 w-10 place-items-center rounded-full bg-card/90"
            >
              <Settings2 size={iconSize.sm} />
            </Link>
          ) : (
            <SavedToggle targetType="business" targetId={b.profileId} size={40} />
          )
        }
        title={
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h1 className="text-3 leading-tight">{b.name}</h1>
            {b.verified ? <StatusPill label="verified" tone="good" /> : null}
          </div>
        }
      >
        {/* LinkedIn's company header: @username, the tagline, then one line of type · place ·
            followers. */}
        <p className="mt-0.5 text-sm text-muted-foreground">@{b.id}</p>
        {b.tagline ? (
          <p className="mt-1.5 text-sm leading-snug text-foreground">{b.tagline}</p>
        ) : null}
        <HeaderFacts b={b} />
        {b.website ? <WebsiteLink url={b.website} className="mt-1" /> : null}
      </CoverHero>

      <div className="space-y-4 px-5 pt-4 pb-6">
        <BusinessActions id={b.id} name={b.name} profileId={b.profileId} owner={isOwner} />

        {b.stats ? (
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-subtle p-3 text-center">
            {b.stats.map(([k, v]) => (
              <div key={k}>
                <p className="text-sm font-bold leading-tight">{v}</p>
                <p className="mt-0.5 text-1 text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Business sections" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {tab === "Overview" ? (
          <>
            {b.about || b.legalName ? (
              <Card className="space-y-2">
                <h2 className="text-sm">About</h2>
                {b.about ? (
                  <p className="text-1 leading-relaxed text-muted-foreground">{b.about}</p>
                ) : null}
                {b.legalName ? (
                  <p className="flex items-start justify-between gap-3 text-1">
                    <span className="text-muted-foreground">Registered</span>
                    <span className="text-right font-semibold">{b.legalName}</span>
                  </p>
                ) : null}
              </Card>
            ) : null}
            {b.services.some((s) => s.status === "active") ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Services & rates</h2>
                {b.services
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-1">{s.label}</span>
                      <Price
                        price={s.price}
                        align="end"
                        className="shrink-0"
                        amountClassName="text-1 font-semibold"
                      />
                    </div>
                  ))}
              </Card>
            ) : null}
            {b.hours.length ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Hours</h2>
                {b.hours.map((h) => (
                  <div key={`${h.day}${h.hours}`} className="flex justify-between gap-3 text-1">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-semibold">{h.hours}</span>
                  </div>
                ))}
              </Card>
            ) : null}
            {b.policies.length ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Policies</h2>
                <ul className="list-disc space-y-1.5 pl-5 text-1">
                  {b.policies.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
            {b.address || b.mapsUrl || b.website ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Find & contact</h2>
                {b.address ? (
                  <p className="flex items-start gap-2 text-1">
                    <MapPin size={iconSize.sm} className="mt-0.5 shrink-0" />{" "}
                    {shownPlace(b.address)}
                  </p>
                ) : null}
                {b.mapsUrl ? (
                  <a
                    href={b.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-touch items-center gap-2 text-1 font-semibold underline-offset-4 hover:underline"
                  >
                    <Navigation size={iconSize.sm} aria-hidden /> Directions
                  </a>
                ) : null}
                {b.website ? <WebsiteLink url={b.website} className="min-h-touch" /> : null}
              </Card>
            ) : null}
            {b.reviews.length ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm">Reviews</h2>
                  <TextLink
                    to="/business/$id/reviews"
                    params={{ id: b.id }}
                    className="shrink-0 text-1"
                  >
                    See All
                  </TextLink>
                </div>
                {b.reviews.slice(0, 3).map((rv) => (
                  <ReviewCard key={rv.id} r={reviewItem(rv)} />
                ))}
              </section>
            ) : null}
          </>
        ) : null}

        {tab === "Reviews" ? (
          b.reviews.length ? (
            <div className="space-y-3">
              {b.reviews.map((rv) => (
                <ReviewCard key={rv.id} r={reviewItem(rv)} />
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" body="No one has reviewed this business yet." />
          )
        ) : null}

        {tab === "Spaces" ? (
          <div className="space-y-3">
            {b.spaces.map((sp) => (
              <Card key={sp.id} className="space-y-2 overflow-hidden p-0">
                {sp.photo ? (
                  <img src={sp.photo} alt="" className="h-32 w-full object-cover" loading="lazy" />
                ) : null}
                <div className="space-y-2 p-4 pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{sp.name}</p>
                    <Price
                      price={sp.rate}
                      align="end"
                      className="shrink-0"
                      amountClassName="text-1 font-bold"
                    />
                  </div>
                  {sp.detail ? <p className="text-1 text-muted-foreground">{sp.detail}</p> : null}
                  <div className="flex flex-wrap gap-1.5">
                    {sp.gear.map((g) => (
                      <span key={g} className="rounded-full bg-background px-2.5 py-1 text-1">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === "Credits" ? (
          <Card className="space-y-2">
            {b.credits.map((c) => (
              <div key={c.id} className="border-b border-border py-2 last:border-0">
                <p className="text-1 font-semibold">{c.title}</p>
                {c.meta ? <p className="text-1 text-muted-foreground">{c.meta}</p> : null}
              </div>
            ))}
          </Card>
        ) : null}
      </div>
    </Screen>
  );
}

type BusinessReview = BusinessView["reviews"][number];

/** A business review in the shape the person profile's ReviewCard takes. */
const reviewItem = (rv: BusinessReview) => ({
  id: rv.id,
  by: rv.author,
  org: rv.org,
  context: rv.context,
  stars: Number(rv.rating),
  text: rv.body,
  ...(rv.response ? { response: rv.response } : {}),
  tags: rv.tags ?? [],
});

/** The header's one line of facts: type · 📍 city · since · followers. */
function HeaderFacts({ b }: { b: BusinessView }) {
  const parts = [
    b.typeLabel ? <span key="type">{b.typeLabel}</span> : null,
    b.city ? (
      <span key="city" className="inline-flex items-center gap-1">
        <MapPin size={iconSize.sm} className="shrink-0" aria-hidden />
        {b.city}
      </span>
    ) : null,
    b.since ? <span key="since">{b.since}</span> : null,
    b.followers ? (
      <span key="followers">
        {`${b.followers.toLocaleString("en-IN")} follower${b.followers === 1 ? "" : "s"}`}
      </span>
    ) : null,
  ].filter(Boolean);
  if (!parts.length) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-1 text-muted-foreground">
      {parts.flatMap((part, i) =>
        i
          ? [
              <span key={`dot${i}`} aria-hidden>
                ·
              </span>,
              part,
            ]
          : [part],
      )}
    </p>
  );
}

/** The business's website, in the header and under Find & contact. */
function WebsiteLink({ url, className = "" }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex max-w-full items-center gap-2 text-1 font-semibold text-foreground underline-offset-4 hover:underline ${className}`}
    >
      <Globe size={iconSize.sm} className="shrink-0" aria-hidden />
      <span className="truncate">{hostOf(url)}</span>
    </a>
  );
}

/** "https://www.hive.in/about" reads "hive.in/about". */
function hostOf(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return u.hostname.replace(/^www\./, "") + path;
  } catch {
    return url;
  }
}

/**
 * What a visitor can do about a business: message it (the thread starts on first message), book
 * it, and follow it. Follow turns the moment it's tapped and settles when the database answers,
 * the same as on a person's profile. Signed out, Message and Follow lead to Welcome.
 */
function BusinessActions({
  id,
  name,
  profileId,
  owner,
}: {
  id: string;
  name: string;
  profileId: string;
  owner: boolean;
}) {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const readConnection = useServerFn(connectionWith);
  const follow = useServerFn(setFollowingFn);
  const key = ["connection", profileId] as const;
  const q = useQuery({
    queryKey: key,
    queryFn: () => readConnection({ data: { profileId } }),
    enabled: signedIn && !owner,
  });
  const message = useMessagePerson();
  const act = useMutation({
    mutationFn: (on: boolean) => follow({ data: { profileId, following: on } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: () => toast.error("That didn't save. Try again."),
  });
  const followOn = act.isPending ? act.variables : (q.data?.following ?? false);

  const book = (
    <BtnLink to="/business/$id/enquiry" params={{ id }} className="min-w-0 flex-1 px-3">
      Book
    </BtnLink>
  );
  // The owner sees what the person profile's owner sees: edit, share, stats — not Book or Follow.
  if (owner) {
    return (
      <div className="flex items-center gap-2">
        <IconBtnLink
          to="/business/$id/manage"
          params={{ id }}
          label="Edit Business"
          variant="ink"
          className="h-11 w-11"
        >
          <Pencil size={iconSize.md} aria-hidden />
        </IconBtnLink>
        <IconBtn
          label="Share Profile"
          variant="outline"
          className="h-11 w-11"
          onClick={() =>
            void shareLink({ title: name, url: `${window.location.origin}/business/${id}` })
          }
        >
          <Share2 size={iconSize.md} aria-hidden />
        </IconBtn>
        <IconBtnLink
          to="/business/$id/dashboard"
          params={{ id }}
          label="Stats"
          variant="outline"
          className="h-11 w-11"
        >
          <BarChart3 size={iconSize.md} aria-hidden />
        </IconBtnLink>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex items-center gap-2">
        <BtnLink
          to="/welcome"
          variant="outline"
          className="min-w-0 flex-1 px-3"
          icon={<Send size={iconSize.sm} aria-hidden />}
        >
          Message
        </BtnLink>
        {book}
        <IconBtnLink label="Follow" to="/welcome" variant="outline" className="h-12 w-12">
          <Plus size={iconSize.md} aria-hidden />
        </IconBtnLink>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Btn
        variant="outline"
        className="min-w-0 flex-1 px-3"
        icon={<Send size={iconSize.sm} aria-hidden />}
        loading={message.pending}
        onClick={() => void message.open(profileId)}
      >
        Message
      </Btn>
      {book}
      <CallBtn profileId={profileId} />
      <IconBtn
        label={followOn ? "Following" : "Follow"}
        variant={followOn ? "ghost" : "outline"}
        className="h-12 w-12"
        onClick={() => {
          if (!act.isPending) act.mutate(!followOn);
        }}
      >
        <StateIcon outline={Plus} solid="check" active={followOn} size={iconSize.md} move="stamp" />
      </IconBtn>
    </div>
  );
}
