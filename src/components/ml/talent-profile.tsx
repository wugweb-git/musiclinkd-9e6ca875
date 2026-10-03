import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Check,
  UserPlus,
  Send,
  Plus,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  Globe2,
  Guitar,
  Info,
  Languages,
  LayoutGrid,
  LifeBuoy,
  MapPin,
  Music,
  Mic2,
  Pencil,
  Phone,
  Play,
  Settings,
  QrCode,
  Rows3,
  Search,
  Share2,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import {
  profileIdByUsername,
  type ServiceItem,
  type TalentProfile,
  type profileInsights,
} from "@/data/profile";
import { ListingTile } from "./market";
import { OpportunityCard } from "./opportunity";
import type { WorkKind } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import { Btn, BtnLink, Chip, IconBtn, IconBtnLink, Screen } from "./ui";
import { SectionTabs, StateIcon, type Move, type SolidIcon } from "./tab-icon";
import { NotificationsBell } from "./tab-header";
import { EmptyState, Price } from "./kit";
import {
  AudioTrackCard,
  MoreSheet,
  RatingSummary,
  ProfileCta,
  type ProfileEmptyCta,
  ProfileHero,
  ProfileSection,
  ReviewCard,
  ReviewRail,
  ServiceCard,
  ReviewInviteCard,
  ShareSheet,
  SocialLinks,
  VideoCard,
  InfoRow,
  isOpenForWork,
} from "./profile";
import { HireModal } from "./hire-modal";
import { GalleryEditor, GalleryView } from "./gallery";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  answerConnection,
  connectionWith,
  contactPhone,
  removeConnection,
  requestConnection,
  setFollowing as setFollowingFn,
  type ConnectionState,
} from "@/lib/connections.functions";
import { BottomCta } from "./marketing";
import { PhotoSheet, ServiceRequestSheet, useServiceRequest } from "./booking";
import { useAuth } from "@/hooks/use-auth";
import { useMessagePerson } from "@/hooks/use-message-person";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

type ProfileTab = "Overview" | "Portfolio" | "Services" | "About" | "Reviews";

/** Each section carries an icon, so an unselected tab can be the icon alone. */
const tabs: { key: ProfileTab; icon: LucideIcon; solid: SolidIcon; move: Move }[] = [
  { key: "Overview", icon: Sparkles, solid: "sparkle", move: "spin" },
  { key: "About", icon: Info, solid: "info", move: "hop" },
  { key: "Portfolio", icon: Music, solid: "music", move: "dance" },
  { key: "Services", icon: BriefcaseBusiness, solid: "briefcase", move: "swing" },
  { key: "Reviews", icon: Star, solid: "star", move: "stamp" },
];

/** An owner's empty-state button that opens new portfolio work of the kind the section shows. */
const addWork = (label: string, kind: WorkKind): ProfileEmptyCta => ({
  label,
  to: "/portfolio/new/$kind",
  kind,
});

export function TalentProfileExperience({
  p,
  owner = false,
  onPickImage,
  onGalleryChange,
}: {
  p: TalentProfile;
  owner?: boolean;
  /** Owner only: uploads a chosen photo or cover and saves it to the profile. */
  onPickImage?: ((kind: "avatar" | "cover", file: File) => Promise<void>) | undefined;
  /**
   * Signed-in owner only: the gallery becomes editable, and this runs after each change so the
   * profile can reload it.
   */
  onGalleryChange?: (() => void) | undefined;
}) {
  const [tab, setTab] = useState<ProfileTab>("Overview");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  // Book on a service is a dated request the talent accepts or declines (owner, 3 Oct 2026).
  const serviceRequest = useServiceRequest();
  const onBook = owner ? undefined : serviceRequest.book;
  const { signedIn, loading } = useAuth();

  const toggleTrack = (id: string) => setPlayingId((current) => (current === id ? null : id));
  // Sharing needs a public link, and the link needs a username.
  const share = p.username ? () => setShareOpen(true) : undefined;

  return (
    <Screen>
      {/* Owner only: the same one-line top bar every other main tab carries. The public profile
          (profile/$username) is a different screen and keeps its own back-arrow header. */}
      {owner ? (
        <header className="flex items-center justify-between px-5 pb-4 pt-6">
          {/* Not an <h1>: the hero below carries one for the person's name, and a page has one
              heading. This is a bar label, so it reads as a bar label. */}
          <p className="text-3 leading-tight">Profile</p>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <IconBtnLink to="/search" label="Search" variant="plain" className="h-10 w-10">
              <Search size={iconSize.md} aria-hidden />
            </IconBtnLink>
            <IconBtnLink to="/settings" label="Settings" variant="plain" className="h-10 w-10">
              <Settings size={iconSize.md} aria-hidden />
            </IconBtnLink>
          </div>
        </header>
      ) : null}
      {/* One grey ground; everything that holds content sits on it in white cards. */}
      <div className="pb-4">
        <ProfileHero
          p={p}
          owner={owner}
          onPickImage={onPickImage}
          back={owner ? undefined : "/discover"}
          onShare={share}
          onMore={owner ? undefined : () => setMoreOpen(true)}
        />

        <div className="px-5 pt-4">
          {owner ? (
            <OwnerActions username={p.username} onShare={share} />
          ) : (
            <ViewerActions
              profileId={p.profileId}
              username={p.username}
              onHire={isOpenForWork(p.availability) ? () => setHireOpen(true) : undefined}
            />
          )}
        </div>
      </div>

      <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Profile sections" />

      <main className="px-5 pb-8">
        {tab === "Overview" ? (
          <Overview
            p={p}
            playingId={playingId}
            onToggleTrack={toggleTrack}
            onHire={() => setHireOpen(true)}
            onBook={onBook}
            owner={owner}
            onTab={setTab}
          />
        ) : null}
        {tab === "Portfolio" ? (
          <Portfolio
            p={p}
            playingId={playingId}
            onToggleTrack={toggleTrack}
            owner={owner}
            onGalleryChange={onGalleryChange}
          />
        ) : null}
        {tab === "Services" ? (
          <Services p={p} onHire={() => setHireOpen(true)} onBook={onBook} />
        ) : null}
        {tab === "About" ? <About p={p} /> : null}
        {tab === "Reviews" ? <Reviews p={p} owner={owner} /> : null}
        {/* A shared profile link is most people's first sight of MusicLinkd, so a signed-out visitor
            is told what this is and how to join. Copy is the welcome screen's own; no figures. */}
        {!owner && !loading && !signedIn ? (
          <BottomCta
            className="mt-10"
            title="Connect. Collaborate. Create."
            body="Build your profile, discover opportunities, connect with the music industry."
            primary={{ label: "Join MusicLinkd", to: "/welcome" }}
          />
        ) : null}
      </main>

      {share ? <ShareSheet p={p} open={shareOpen} onClose={() => setShareOpen(false)} /> : null}
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        name={p.name}
        username={p.username}
        profileId={p.profileId}
      />
      <HireModal
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        profileId={p.profileId}
        subject={{ name: p.name, detail: [p.primaryRole, p.location].filter(Boolean).join(" · ") }}
      />
      <ServiceRequestSheet
        service={serviceRequest.service}
        who={p.name}
        onClose={serviceRequest.close}
      />
    </Screen>
  );
}

/**
 * What a visitor can do about this profile, read from the database: connect (asked for, then
 * accepted), message, hire, follow. A signed-out visitor is sent to Welcome; a seed-only profile
 * that has no database row keeps the buttons but cannot connect.
 */
function ViewerActions({
  profileId: rawProfileId,
  username,
  onHire,
}: {
  profileId?: string | undefined;
  username?: string | undefined;
  onHire?: (() => void) | undefined;
}) {
  // The live profile id only: a hardcoded username → id map must never stand in for a real row.
  const profileId = rawProfileId;
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const readConnection = useServerFn(connectionWith);
  const ask = useServerFn(requestConnection);
  const answer = useServerFn(answerConnection);
  const remove = useServerFn(removeConnection);
  const follow = useServerFn(setFollowingFn);
  const live = Boolean(signedIn && profileId);
  const key = ["connection", profileId] as const;

  const q = useQuery({
    queryKey: key,
    queryFn: () => readConnection({ data: { profileId: profileId ?? "" } }),
    enabled: live,
  });
  const state: ConnectionState = q.data?.state ?? "none";
  const following = q.data?.following ?? false;

  // Message opens the thread with this person, starting it if this is the first message.
  const message = useMessagePerson();

  const act = useMutation({
    mutationFn: async (what: "ask" | "accept" | "remove" | "follow" | "unfollow") => {
      if (!profileId) return;
      // Without the current state a tap could send a second request; say so instead.
      if (q.isError) throw new Error("We couldn't load this connection. Try again.");
      if (what === "ask") {
        await ask({ data: { profileId } });
        return;
      }
      if (what === "accept") {
        const id = q.data?.connectionId;
        if (id) await answer({ data: { id, accept: true } });
        return;
      }
      if (what === "remove") {
        await remove({ data: { profileId } });
        return;
      }
      await follow({ data: { profileId, following: what === "follow" } });
    },
    onSuccess: (_, what) => {
      queryClient.invalidateQueries({ queryKey: key });
      if (what === "ask") toast.success("Connection request sent!");
      else if (what === "accept") toast.success("Connected!");
      else if (what === "remove") toast.success("Connection removed");
      else if (what === "follow") toast.success("Now following");
      else if (what === "unfollow") toast.success("Unfollowed");
    },
    // A failure is shown as one, never as the success it wasn't.
    onError: (e) => {
      void q.refetch();
      toast.error(e instanceof Error && e.message ? e.message : "That didn't save. Try again.");
    },
  });

  // Optimistic: the button turns the moment it's tapped, and the refetch in onSuccess keeps the
  // mutation pending until fresh data lands, so it never flips back and forth. A failure reverts
  // it, with the error toast above.
  const pending = act.isPending ? act.variables : undefined;
  const shown: ConnectionState =
    pending === "ask"
      ? "sent"
      : pending === "accept"
        ? "connected"
        : pending === "remove"
          ? "none"
          : state;
  const followOn = pending === "follow" ? true : pending === "unfollow" ? false : following;
  const connectOn = shown === "connected" || shown === "sent";

  const connectLabel =
    shown === "connected"
      ? "Connected"
      : shown === "sent"
        ? "Requested"
        : shown === "received"
          ? "Accept"
          : "Connect";
  const connectIcon = (
    <StateIcon
      outline={UserPlus}
      solid="check"
      active={connectOn}
      size={iconSize.sm}
      move="stamp"
    />
  );

  function onConnect() {
    if (!live || act.isPending) return;
    if (state === "none" || state === "declined") {
      act.mutate("ask");
      return;
    }
    if (state === "received") {
      act.mutate("accept");
      return;
    }
    act.mutate("remove");
  }

  // Signed out, or a profile with no row: the row reads the same, and every button leads to Welcome.
  if (!live) {
    return (
      <div className="flex items-center gap-2">
        <BtnLink
          to="/welcome"
          className="min-w-0 flex-1 px-3"
          icon={<UserPlus size={iconSize.sm} aria-hidden />}
        >
          Connect
        </BtnLink>
        <BtnLink
          to="/welcome"
          variant="outline"
          className="min-w-0 flex-1 px-3"
          icon={<Send size={iconSize.sm} aria-hidden />}
        >
          Message
        </BtnLink>
        {onHire ? (
          <IconBtnLink label="Hire" to="/welcome" variant="outline" className="h-12 w-12">
            <BriefcaseBusiness size={iconSize.md} aria-hidden />
          </IconBtnLink>
        ) : null}
        <IconBtnLink label="Follow" to="/welcome" variant="outline" className="h-12 w-12">
          <Plus size={iconSize.md} aria-hidden />
        </IconBtnLink>
      </div>
    );
  }

  return (
    // One row, one primary at a time: Connect leads until you are connected, then Message does —
    // the row is never all-outline, because there is always exactly one next thing to do.
    <div className="flex items-center gap-2">
      <Btn
        variant={connectOn ? "outline" : "primary"}
        className="min-w-0 flex-1 px-3"
        icon={connectIcon}
        onClick={onConnect}
      >
        {connectLabel}
      </Btn>
      <Btn
        variant={shown === "connected" ? "primary" : "outline"}
        className="min-w-0 flex-1 px-3"
        icon={<Send size={iconSize.sm} aria-hidden />}
        loading={message.pending}
        onClick={() => void message.open(profileId ?? "")}
      >
        Message
      </Btn>
      {/* Hire stays an icon until you are connected; then it earns its word. */}
      {onHire && shown === "connected" ? (
        <Btn
          variant="outline"
          className="min-w-0 flex-1 px-3"
          icon={<BriefcaseBusiness size={iconSize.sm} aria-hidden />}
          onClick={onHire}
        >
          Hire
        </Btn>
      ) : onHire ? (
        <IconBtn label="Hire" variant="outline" className="h-12 w-12" onClick={onHire}>
          <BriefcaseBusiness size={iconSize.md} aria-hidden />
        </IconBtn>
      ) : null}
      <CallBtn profileId={profileId} />
      <IconBtn
        label={followOn ? "Following" : "Follow"}
        variant={followOn ? "ghost" : "outline"}
        className="h-12 w-12"
        onClick={() => {
          if (!act.isPending) act.mutate(followOn ? "unfollow" : "follow");
        }}
      >
        <StateIcon outline={Plus} solid="check" active={followOn} size={iconSize.md} move="stamp" />
      </IconBtn>
    </div>
  );
}

/**
 * Call, for a signed-in visitor, only when the owner's "Show phone number" setting lets this
 * viewer have the number — contact_phone decides that server-side. Nothing renders otherwise.
 */
export function CallBtn({
  profileId,
  className = "h-12 w-12",
}: {
  profileId?: string | undefined;
  className?: string;
}) {
  const { signedIn } = useAuth();
  const readPhone = useServerFn(contactPhone);
  const q = useQuery({
    queryKey: ["contact-phone", profileId],
    queryFn: () => readPhone({ data: { profileId: profileId ?? "" } }),
    enabled: Boolean(signedIn && profileId),
  });
  const phone = q.data?.phone;
  if (!phone) return null;
  return (
    <IconBtn
      label="Call"
      variant="outline"
      className={className}
      onClick={() => {
        window.location.href = `tel:${phone}`;
      }}
    >
      <Phone size={iconSize.md} aria-hidden />
    </IconBtn>
  );
}

function OwnerActions({
  username,
  onShare,
}: {
  username: string;
  onShare?: (() => void) | undefined;
}) {
  return (
    // Icon-only actions: the label is each button's accessible name and its tooltip.
    <div className="flex items-center gap-2">
      <IconBtnLink to="/profile/edit" label="Edit Profile" variant="ink" className="h-11 w-11">
        <Pencil size={iconSize.md} aria-hidden />
      </IconBtnLink>
      {onShare ? (
        <IconBtn label="Share Profile" variant="outline" className="h-11 w-11" onClick={onShare}>
          <Share2 size={iconSize.md} aria-hidden />
        </IconBtn>
      ) : null}
      {/* A preview action stays a preview: without a username there is no public page to view yet,
          so this tells you that instead of silently opening Edit under the same "preview" icon. */}
      {username ? (
        <IconBtnLink
          to="/profile/$username"
          params={{ username }}
          label="View Public Profile"
          variant="outline"
          className="h-11 w-11"
        >
          <ExternalLink size={iconSize.md} aria-hidden />
        </IconBtnLink>
      ) : (
        <IconBtn
          label="View Public Profile"
          variant="outline"
          className="h-11 w-11"
          onClick={() => toast("Set a username first — it's what your public link uses.")}
        >
          <ExternalLink size={iconSize.md} aria-hidden />
        </IconBtn>
      )}
    </div>
  );
}

function Overview({
  p,
  playingId,
  onToggleTrack,
  onHire,
  onBook,
  owner,
  onTab,
}: {
  p: TalentProfile;
  playingId: string | null;
  onToggleTrack: (id: string) => void;
  onHire: () => void;
  onBook: ((s: ServiceItem) => void) | undefined;
  owner: boolean;
  onTab: (tab: ProfileTab) => void;
}) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const fullBio = p.longBio || p.shortBio;

  return (
    <>
      <ProfileSection title="Professional summary">
        {p.shortBio ? (
          <div className="rounded-lg border border-border/80 bg-card p-4 transition-all">
            <p
              className={cn(
                "text-sm leading-relaxed text-foreground",
                !bioExpanded && "line-clamp-3",
              )}
            >
              {bioExpanded ? fullBio : p.shortBio}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
              <button
                type="button"
                className="state-layer hit-area inline-flex items-center gap-1 rounded-full text-1 font-semibold text-foreground active:scale-95 transition-transform"
                onClick={() => setBioExpanded((b) => !b)}
              >
                {bioExpanded ? "Show concise summary" : "Read full background"}{" "}
                <ChevronRight
                  size={iconSize.sm}
                  className={cn("transition-transform duration-200", bioExpanded && "rotate-90")}
                  aria-hidden
                />
              </button>
              {p.yearsActive ? (
                <span className="text-1 font-medium text-muted-foreground">{p.yearsActive}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No summary yet"
            body="This professional has not written a summary yet."
            action={
              <ProfileCta
                cta={owner ? { label: "Write a summary", to: "/profile/edit" } : undefined}
              />
            }
          />
        )}
      </ProfileSection>

      {typesOf(p).length || p.genres.length || p.instruments.length || p.languages.length ? (
        <ProfileSection title="Music identity">
          <MusicIdentityBento p={p} />
        </ProfileSection>
      ) : null}

      {p.audio.length ? (
        <ProfileSection
          title="Audio portfolio"
          action="View All"
          onAction={() => onTab("Portfolio")}
        >
          <div className="space-y-2.5">
            {p.audio.slice(0, 2).map((track) => (
              <AudioTrackCard
                key={track.id}
                track={track}
                playing={playingId === track.id}
                onToggle={() => onToggleTrack(track.id)}
              />
            ))}
          </div>
        </ProfileSection>
      ) : (
        <ProfileSection title="Audio portfolio">
          <EmptyState
            title="No audio yet"
            body="This professional has not added audio samples yet."
            action={<ProfileCta cta={owner ? addWork("Add audio", "track") : undefined} />}
          />
        </ProfileSection>
      )}

      {p.services.length ? (
        <ProfileSection
          title="Available to work"
          action="Services"
          onAction={() => onTab("Services")}
        >
          <ServiceCard
            s={p.services[0]!}
            onEnquire={onHire}
            onBook={bookable(p.services[0]!, onBook)}
          />
        </ProfileSection>
      ) : null}

      <RelationshipSections p={p} />
    </>
  );
}
function Portfolio({
  p,
  playingId,
  onToggleTrack,
  owner,
  onGalleryChange,
}: {
  p: TalentProfile;
  playingId: string | null;
  onToggleTrack: (id: string) => void;
  owner: boolean;
  onGalleryChange?: (() => void) | undefined;
}) {
  const [layout, setLayout] = useState<"grid" | "rows">("grid");
  const [viewing, setViewing] = useState(false);
  return (
    <>
      <ProfileSection
        title="Audio"
        aside={
          <span className="flex items-center gap-1">
            <IconBtn
              label="Grid view"
              variant={layout === "grid" ? "outline" : "ghost"}
              className="h-10 w-10"
              onClick={() => setLayout("grid")}
            >
              <LayoutGrid size={iconSize.sm} aria-hidden />
            </IconBtn>
            <IconBtn
              label="Row view"
              variant={layout === "rows" ? "outline" : "ghost"}
              className="h-10 w-10"
              onClick={() => setLayout("rows")}
            >
              <Rows3 size={iconSize.sm} aria-hidden />
            </IconBtn>
          </span>
        }
      >
        <div className="space-y-2">
          {p.audio.length ? (
            p.audio.map((track) => (
              <AudioTrackCard
                key={track.id}
                track={track}
                playing={playingId === track.id}
                onToggle={() => onToggleTrack(track.id)}
              />
            ))
          ) : (
            <EmptyState
              title="No tracks added"
              body="Audio samples, demos and sessions will appear here."
              action={<ProfileCta cta={owner ? addWork("Add track", "track") : undefined} />}
            />
          )}
        </div>
      </ProfileSection>
      <ProfileSection title="Video">
        <div className={cn(layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-4")}>
          {p.video.length ? (
            p.video.map((video) => (
              <VideoCard key={video.id} v={video} layout={layout === "grid" ? "grid" : "row"} />
            ))
          ) : (
            <div className="w-full">
              <EmptyState
                title="No videos yet"
                body="Performance and studio videos will appear here."
                action={<ProfileCta cta={owner ? addWork("Add video", "video") : undefined} />}
              />
            </div>
          )}
        </div>
      </ProfileSection>
      {/* The owner can always add photos here; a visitor sees the gallery only once it has some. */}
      {owner && onGalleryChange ? (
        <ProfileSection title="Gallery">
          <GalleryEditor title="Gallery" onChange={onGalleryChange} />
        </ProfileSection>
      ) : p.gallery.length ? (
        <ProfileSection title="Gallery">
          {layout === "grid" ? (
            <GalleryView images={p.gallery} title="Gallery" />
          ) : (
            <div className="space-y-3">
              {p.gallery.map((image, i) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setViewing(true)}
                  aria-label={`View photo ${i + 1} of ${p.gallery.length}`}
                  className="block w-full overflow-hidden rounded-lg"
                >
                  <img
                    src={sized(image, { width: 224 })}
                    alt=""
                    loading="lazy"
                    className="h-56 w-full object-cover"
                  />
                </button>
              ))}
              <PhotoSheet
                title="Gallery"
                photos={viewing ? p.gallery : []}
                onClose={() => setViewing(false)}
              />
            </div>
          )}
        </ProfileSection>
      ) : null}
    </>
  );
}

/** Book opens the dated request for a real service; a visitor's own preview keeps the default. */
function bookable(s: ServiceItem, onBook: ((s: ServiceItem) => void) | undefined) {
  return onBook && /^[0-9a-f-]{36}$/i.test(s.id) ? () => onBook(s) : undefined;
}

function Services({
  p,
  onHire,
  onBook,
}: {
  p: TalentProfile;
  onHire: () => void;
  onBook: ((s: ServiceItem) => void) | undefined;
}) {
  return (
    <ProfileSection title="Services">
      <div className="space-y-3">
        {p.services.length ? (
          p.services.map((service) => (
            <ServiceCard
              key={service.id}
              s={service}
              onEnquire={onHire}
              onBook={bookable(service, onBook)}
            />
          ))
        ) : (
          // No owner button: the new-service flow does not save a service yet.
          <EmptyState
            title="No services listed"
            body="This professional has not listed services yet."
          />
        )}
      </div>
    </ProfileSection>
  );
}

function About({ p }: { p: TalentProfile }) {
  return (
    <>
      <ProfileSection title="About">
        {p.longBio ? (
          <div className="rounded-lg bg-subtle p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{p.longBio}</p>
          </div>
        ) : (
          <EmptyState title="No bio yet" body="This professional has not written a bio yet." />
        )}
      </ProfileSection>
      <ProfileSection title="Professional details">
        {p.professional.length ? (
          <div className="divide-y divide-border rounded-lg bg-subtle">
            {p.professional.map((item) => (
              <InfoRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No details yet"
            body="Setup, tools and working details will appear here."
          />
        )}
      </ProfileSection>
      <ProfileSection title="Music identity">
        {typesOf(p).length || p.genres.length || p.instruments.length || p.languages.length ? (
          <MusicIdentityBento p={p} />
        ) : (
          <EmptyState
            title="No music identity yet"
            body="Instruments and languages will appear here."
          />
        )}
      </ProfileSection>
      <ProfileSection title="External links">
        {p.links.length ? (
          <SocialLinks links={p.links} />
        ) : (
          <EmptyState title="No links yet" body="Streaming and social links will appear here." />
        )}
      </ProfileSection>
      <ProfileSection title="Connections">
        <div className="grid grid-cols-2 gap-3">
          <IdentityFact
            icon={<Users size={iconSize.sm} />}
            label="Connections"
            value={p.stats.connections}
          />
          <IdentityFact
            icon={<Globe2 size={iconSize.sm} />}
            label="Followers"
            value={p.stats.followers}
          />
          <IdentityFact
            icon={<MapPin size={iconSize.sm} />}
            label="Location"
            value={p.location || "—"}
          />
          <IdentityFact
            icon={<Clock3 size={iconSize.sm} />}
            label="Experience"
            value={p.yearsActive || "—"}
          />
        </div>
      </ProfileSection>
    </>
  );
}

function Reviews({ p, owner }: { p: TalentProfile; owner: boolean }) {
  return (
    <>
      <ProfileSection title="Reviews">
        <RatingSummary variant="inline" average={p.rating} count={p.reviewCount} />
        {p.reviews.length ? (
          <ReviewRail>
            {p.reviews.map((review) => (
              <ReviewCard key={review.id} r={review} />
            ))}
          </ReviewRail>
        ) : (
          <EmptyState
            title="No reviews yet"
            body="Reviews appear here once work booked through MusicLinkd is complete."
          />
        )}
      </ProfileSection>
      {/* Reviews follow completed work, so the path to writing one runs through Reviews. */}
      {owner ? (
        <div className="mt-5">
          <ReviewInviteCard />
        </div>
      ) : (
        <div className="mt-5 rounded-lg bg-subtle p-4">
          <p className="text-1 text-muted-foreground">
            {`You can review ${p.name || "this profile"} once a booking, order or rental with them is complete. It stays open for 14 days.`}
          </p>
          <BtnLink to="/reviews" variant="outline" className="mt-3 w-full">
            Write a review
          </BtnLink>
        </div>
      )}
    </>
  );
}

function IdentityFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg bg-subtle p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-1 text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-semibold">{value}</span>
      </span>
    </div>
  );
}

function RelationshipSections({ p }: { p: TalentProfile }) {
  return (
    <>
      {p.opportunities.length ? (
        <ProfileSection title="Opportunities">
          <div className="space-y-2">
            {p.opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} o={opportunity} />
            ))}
          </div>
        </ProfileSection>
      ) : null}
      {p.market.length ? (
        <ProfileSection title="Marketplace">
          <div className="rail flex gap-3 overflow-x-auto no-scrollbar">
            {p.market.map((entry) => (
              <ListingTile key={entry.id} l={entry} />
            ))}
          </div>
        </ProfileSection>
      ) : null}
      {p.studio ? (
        <ProfileSection title="Studio connection">
          <Link to={p.studio.to} className="flex items-center gap-3 rounded-lg bg-subtle p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
              <Mic2 size={iconSize.md} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{p.studio.name}</span>
              {p.studio.meta ? (
                <span className="mt-1 block truncate text-1 text-muted-foreground">
                  {p.studio.meta}
                </span>
              ) : null}
              <Price
                price={p.studio.price}
                className="mt-1"
                amountClassName="text-sm font-semibold"
              />
            </span>
            <ChevronRight
              size={iconSize.sm}
              className="shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        </ProfileSection>
      ) : null}
    </>
  );
}

/** The person's types (Violinist, Producer…): shown in Music identity, not under the name. */
function typesOf(p: TalentProfile) {
  return [p.primaryRole, ...p.secondaryRoles].filter(Boolean);
}

/** One card in the Music identity bento: an icon, a label, and its chips. */
function BentoCard({
  icon: Icon,
  label,
  count,
  wide,
  children,
}: {
  icon: LucideIcon;
  label: string;
  count?: number | undefined;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card p-3.5",
        wide ? "col-span-2" : undefined,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-1 font-semibold text-foreground">
        <span className="flex items-center gap-1.5">
          <Icon size={iconSize.sm} className="text-foreground" aria-hidden />
          <span>{label}</span>
        </span>
        {count ? (
          <span className="text-1 font-medium text-muted-foreground">{count} genres</span>
        ) : null}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function BentoChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-subtle px-2.5 py-1 text-1 font-semibold text-foreground border border-border/60">
      {children}
    </span>
  );
}

/**
 * Music identity, recycled everywhere it appears (Overview, About, the owner's own stack): a bento
 * grid, one card per group, Genres spanning both columns. Content-rich sections like this read
 * better as cards than as one long chip list.
 */
function MusicIdentityBento({ p }: { p: TalentProfile }) {
  const types = typesOf(p);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {types.length ? (
        <BentoCard icon={UserRound} label="Type">
          {types.map((t) => (
            <BentoChip key={t}>{t}</BentoChip>
          ))}
        </BentoCard>
      ) : null}

      {p.genres.length ? (
        <BentoCard icon={Music} label="Genres" count={p.genres.length} wide>
          {p.genres.map((g) => (
            <BentoChip key={g}>{g}</BentoChip>
          ))}
        </BentoCard>
      ) : null}

      {p.instruments.length ? (
        <BentoCard icon={Guitar} label="Instruments">
          {p.instruments.map((inst) => (
            <BentoChip key={inst}>{inst}</BentoChip>
          ))}
        </BentoCard>
      ) : null}

      {p.languages.length ? (
        <BentoCard icon={Languages} label="Languages">
          {p.languages.map((lang) => (
            <BentoChip key={lang}>{lang}</BentoChip>
          ))}
        </BentoCard>
      ) : null}
    </div>
  );
}
