import { Link, useNavigate } from "@tanstack/react-router";
import { profileUrl } from "@/lib/site";
import { useState } from "react";
import {
  BarChart3,
  Pencil,
  Share2,
  Globe,
  MapPin,
  Navigation,
  Music,
  Plus,
  Send,
  Settings2,
  SlidersVertical,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { connectionWith, setFollowing as setFollowingFn } from "@/lib/connections.functions";
import { shareLink } from "@/lib/booking-actions";
import { enterLinkedProfile, listLinkedProfiles } from "@/lib/pages.functions";
import { switchToLinked } from "@/lib/saved-accounts";
import { SectionTabs, StateIcon, type Move, type SolidIcon } from "./tab-icon";
import { Screen, TopBar, Btn, BtnLink, IconBtn, IconBtnLink } from "@/components/ml/ui";
import { StatusPill, EmptyState, Price } from "@/components/ml/kit";
import type { BusinessView } from "@/lib/business-view";
import {
  AudioTrackCard,
  ClampedText,
  CoverHero,
  ProjectCard,
  ReviewCard,
  ReviewRail,
  ServiceCard,
  StackSection,
  VideoCard,
} from "@/components/ml/profile";
import { GalleryView } from "@/components/ml/gallery";
import {
  PhotoSheet,
  ProofPill,
  ServiceRequestSheet,
  useServiceRequest,
} from "@/components/ml/booking";
import type { TalentProfile } from "@/data/profile";
import { CallBtn } from "@/components/ml/talent-profile";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useMessagePerson } from "@/hooks/use-message-person";
import { iconSize } from "@/lib/tokens";
import { amenityIcon } from "@/lib/amenity-icons";
import { shownPlace } from "@/lib/place";
import { sized } from "@/lib/image-url";

// Team is off for now: one business profile belongs to one account (owner, 21 Sep 2026).
type BusinessTab = "Overview" | "Portfolio" | "Reviews";

/** Same row as the person profile: icon alone until selected, then solid with its move. */
const tabs: { key: BusinessTab; icon: LucideIcon; solid: SolidIcon; move: Move }[] = [
  { key: "Overview", icon: Sparkles, solid: "sparkle", move: "spin" },
  { key: "Portfolio", icon: Music, solid: "music", move: "dance" },
  { key: "Reviews", icon: Star, solid: "star", move: "stamp" },
];

/** A business account's profile: /business/$id and /profile/$username for a business. */
export function BusinessProfileExperience({
  b,
  work = null,
}: {
  b: BusinessView | undefined;
  /** The business's portfolio (tracks, videos, projects), read like a talent's. */
  work?: TalentProfile | null;
}) {
  const [tab, setTab] = useState<BusinessTab>("Overview");
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ title: string; photos: string[] } | null>(null);
  const { user, signedIn } = useAuth();
  const isOwner = !!b && user?.id === b.profileId;
  // A business page this sign-in owns (src/lib/pages.functions.ts): one tap switches into it.
  const loadLinked = useServerFn(listLinkedProfiles);
  const linked = useQuery({
    queryKey: ["accounts", "linked", user?.id ?? null],
    queryFn: () => loadLinked(),
    enabled: signedIn && !!b && !isOwner,
  });
  const ownsPage = !!b && !isOwner && (linked.data ?? []).some((p) => p.id === b.profileId);
  const activeServices = (b?.services ?? []).filter((s) => s.status === "active");
  // Without a place to book, Book on a service is a dated request (owner, 3 Oct 2026).
  const serviceRequest = useServiceRequest();

  if (!b) {
    return (
      <Screen>
        <TopBar title="Business" back="/discover" />
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
        back="/discover"
        actions={
          isOwner ? (
            // Managing is the owner's; a visitor has nothing to manage here.
            <Link
              to="/profile/edit"
              aria-label="Manage business"
              className="hit-area grid h-10 w-10 place-items-center rounded-full bg-card/90"
            >
              <Settings2 size={iconSize.sm} />
            </Link>
          ) : (
            <SavedToggle targetType="business" targetId={b.profileId} size={40} />
          )
        }
        title={
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h1 className="min-w-0 break-words text-3 font-semibold leading-tight">{b.name}</h1>
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
        {ownsPage ? (
          <SwitchToManage id={b.id} profileId={b.profileId} name={b.name} />
        ) : (
          <BusinessActions
            id={b.id}
            name={b.name}
            profileId={b.profileId}
            owner={isOwner}
            studioSlug={b.studioSlug}
          />
        )}
      </div>

      <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Business sections" />

      <div className="px-3 pb-6">
        {tab === "Overview" ? (
          <>
            {b.about || b.legalName ? (
              <StackSection title="About">
                {b.about ? <ClampedText text={b.about} /> : null}
                {b.legalName ? (
                  <p className="mt-3 flex items-start justify-between gap-3 text-1">
                    <span className="text-muted-foreground">Registered</span>
                    <span className="text-right font-semibold">{b.legalName}</span>
                  </p>
                ) : null}
              </StackSection>
            ) : null}

            {b.gallery.length ? (
              <StackSection title="Showcase">
                <GalleryView images={b.gallery} title={`${b.name} showcase`} />
              </StackSection>
            ) : null}

            {activeServices.length ? (
              <StackSection title="Services">
                <div className="space-y-3">
                  {activeServices.map((sv) => (
                    <ServiceCard
                      key={sv.id}
                      s={sv.card}
                      // A business with a place opens its booking with this service picked; one
                      // without sends a dated request for the service. The owner's own card keeps
                      // its preview.
                      {...(b.studioSlug
                        ? {
                            onBook: () =>
                              void navigate({
                                to: "/booking/$id/service",
                                params: { id: b.studioSlug! },
                                search: { service: sv.card.id },
                              }),
                          }
                        : !isOwner && /^[0-9a-f-]{36}$/i.test(sv.card.id)
                          ? { onBook: () => serviceRequest.book(sv.card) }
                          : {})}
                    />
                  ))}
                </div>
              </StackSection>
            ) : null}

            {b.amenities.length ? (
              <StackSection title="Amenities">
                <div className="flex flex-wrap gap-2">
                  {b.amenities.map((a) => (
                    <ProofPill
                      key={a.slug}
                      label={a.label}
                      icon={amenityIcon(a.slug)}
                      photos={a.photos}
                      onOpen={() => setViewing({ title: a.label, photos: a.photos })}
                      className="rounded-full bg-background text-1"
                    />
                  ))}
                </div>
              </StackSection>
            ) : null}

            {b.equipment.length ? (
              <StackSection title="Equipment" collapsible>
                <ul className="divide-y divide-border">
                  {b.equipment.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        disabled={!e.photos.length}
                        onClick={() => setViewing({ title: e.name, photos: e.photos })}
                        className="state-layer flex w-full items-center gap-3 py-3 text-left disabled:cursor-default"
                      >
                        {e.photos[0] ? (
                          <img
                            src={sized(e.photos[0], { width: 48 })}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-icon-chip text-ink-foreground">
                            <SlidersVertical size={iconSize.md} aria-hidden />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{e.name}</span>
                          <span className="block truncate text-1 text-muted-foreground">
                            {[e.type, e.quantity ? `Qty ${e.quantity}` : ""]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        <StatusPill
                          label={e.included ? "included" : "extra cost"}
                          tone={e.included ? "good" : "neutral"}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </StackSection>
            ) : null}

            {work && (work.audio.length || work.video.length) ? (
              <StackSection
                title="Portfolio"
                showAll="See all work"
                onShowAll={() => setTab("Portfolio")}
              >
                <div className="space-y-3">
                  {work.audio.slice(0, 2).map((track) => (
                    <AudioTrackCard
                      key={track.id}
                      track={track}
                      playing={playingId === track.id}
                      onToggle={() => setPlayingId((id) => (id === track.id ? null : track.id))}
                    />
                  ))}
                  {work.video.slice(0, 2).map((v) => (
                    <VideoCard key={v.id} v={v} layout="row" />
                  ))}
                </div>
              </StackSection>
            ) : null}

            {b.hours.length ? (
              <StackSection title="Hours" collapsible>
                {b.hours.map((h) => (
                  <div
                    key={`${h.day}${h.hours}`}
                    className="flex justify-between gap-3 py-1 text-sm"
                  >
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-semibold">{h.hours}</span>
                  </div>
                ))}
              </StackSection>
            ) : null}

            {b.policies.length ? (
              // Rules read as a plain list on the page, not a card.
              <section className="mt-6 space-y-2 px-4">
                <h2 className="text-3 font-bold">Policies</h2>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {b.policies.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {b.address || b.mapsUrl || b.website ? (
              <StackSection title="Find & contact">
                {b.address ? (
                  <p className="flex items-start gap-2 text-sm">
                    <MapPin size={iconSize.sm} className="mt-0.5 shrink-0" />
                    {shownPlace(b.address)}
                  </p>
                ) : null}
                {b.mapsUrl ? (
                  <a
                    href={b.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-touch items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    <Navigation size={iconSize.sm} aria-hidden /> Directions
                  </a>
                ) : null}
                {b.website ? <WebsiteLink url={b.website} className="min-h-touch" /> : null}
              </StackSection>
            ) : null}

            {b.reviews.length ? (
              <StackSection
                title="Reviews"
                showAll="See all reviews"
                onShowAll={() => setTab("Reviews")}
              >
                <ReviewRail>
                  {b.reviews.map((rv) => (
                    <ReviewCard key={rv.id} r={reviewItem(rv)} />
                  ))}
                </ReviewRail>
              </StackSection>
            ) : null}
          </>
        ) : null}

        {tab === "Portfolio" ? (
          work && (work.audio.length || work.video.length || work.projects.length) ? (
            <>
              {work.audio.length ? (
                <StackSection title="Audio">
                  <div className="space-y-2">
                    {work.audio.map((track) => (
                      <AudioTrackCard
                        key={track.id}
                        track={track}
                        playing={playingId === track.id}
                        onToggle={() => setPlayingId((id) => (id === track.id ? null : track.id))}
                      />
                    ))}
                  </div>
                </StackSection>
              ) : null}
              {work.video.length ? (
                <StackSection title="Video">
                  <div className="grid grid-cols-2 gap-3">
                    {work.video.map((v) => (
                      <VideoCard key={v.id} v={v} />
                    ))}
                  </div>
                </StackSection>
              ) : null}
              {work.projects.length ? (
                <StackSection title="Projects">
                  <div className="space-y-2">
                    {work.projects.map((project) => (
                      <ProjectCard key={project.id} p={project} />
                    ))}
                  </div>
                </StackSection>
              ) : null}
              {b.credits.length ? (
                <StackSection title="Credits" collapsible>
                  {b.credits.map((c) => (
                    <div key={c.id} className="border-b border-border py-2 last:border-0">
                      <p className="text-sm font-semibold">{c.title}</p>
                      {c.meta ? <p className="text-1 text-muted-foreground">{c.meta}</p> : null}
                    </div>
                  ))}
                </StackSection>
              ) : null}
            </>
          ) : (
            <div className="px-2 pt-4">
              <EmptyState title="No work yet" body="This business hasn't added its work yet." />
            </div>
          )
        ) : null}

        {tab === "Reviews" ? (
          <div className="px-2 pt-4">
            {b.reviews.length ? (
              <ReviewRail>
                {b.reviews.map((rv) => (
                  <ReviewCard key={rv.id} r={reviewItem(rv)} />
                ))}
              </ReviewRail>
            ) : (
              <EmptyState title="No reviews yet" body="No one has reviewed this business yet." />
            )}
          </div>
        ) : null}
      </div>

      <PhotoSheet
        title={viewing?.title ?? ""}
        photos={viewing?.photos ?? []}
        onClose={() => setViewing(null)}
      />
      <ServiceRequestSheet
        service={serviceRequest.service}
        who={b.name}
        onClose={serviceRequest.close}
      />
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
/** You own this page but are signed in as yourself: switch into it to manage it. */
function SwitchToManage({ id, profileId, name }: { id: string; profileId: string; name: string }) {
  const enter = useServerFn(enterLinkedProfile);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Btn
        className="w-full"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await switchToLinked(profileId, enter);
            // A fresh start as the page, so nothing from your own profile stays on screen.
            window.location.assign("/profile/edit");
          } catch {
            toast.error("Couldn't switch. Try again from Switch account.");
            setBusy(false);
          }
        }}
      >
        Switch to {name} to Manage
      </Btn>
      <p className="text-center text-1 text-muted-foreground">
        You own this page. Visitors see Message and Book here.
      </p>
    </div>
  );
}

function BusinessActions({
  id,
  name,
  profileId,
  owner,
  studioSlug,
}: {
  id: string;
  name: string;
  profileId: string;
  owner: boolean;
  studioSlug: string | null;
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

  // A studio is booked through its rooms and calendar; any other business takes an enquiry.
  // A studio can be booked (rooms, dates, slots) and asked; any other business is asked.
  const enquire = (
    <BtnLink
      to="/business/$id/enquiry"
      params={{ id }}
      variant={studioSlug ? "outline" : "primary"}
      className="min-w-0 flex-1 px-3"
    >
      Enquire
    </BtnLink>
  );
  const book = studioSlug ? (
    <>
      <BtnLink to="/booking/$id" params={{ id: studioSlug }} className="min-w-0 flex-1 px-3">
        Book
      </BtnLink>
      {enquire}
    </>
  ) : (
    enquire
  );
  // The owner sees what the person profile's owner sees: edit, share, stats — not Book or Follow.
  if (owner) {
    return (
      <div className="flex items-center gap-2">
        <IconBtnLink to="/profile/edit" label="Edit Business" variant="ink" className="h-11 w-11">
          <Pencil size={iconSize.md} aria-hidden />
        </IconBtnLink>
        <IconBtn
          label="Share Profile"
          variant="outline"
          className="h-11 w-11"
          onClick={() => void shareLink({ title: name, url: profileUrl(id) })}
        >
          <Share2 size={iconSize.md} aria-hidden />
        </IconBtn>
        <IconBtnLink to="/home" label="Stats" variant="outline" className="h-11 w-11">
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
      {/* With Book and Enquire beside it, Message is the icon; otherwise it keeps its label. */}
      {studioSlug ? (
        <IconBtn
          label="Message"
          variant="outline"
          className="h-12 w-12"
          onClick={() => void message.open(profileId)}
        >
          <Send size={iconSize.md} aria-hidden />
        </IconBtn>
      ) : (
        <Btn
          variant="outline"
          className="min-w-0 flex-1 px-3"
          icon={<Send size={iconSize.sm} aria-hidden />}
          loading={message.pending}
          onClick={() => void message.open(profileId)}
        >
          Message
        </Btn>
      )}
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
