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
  Star,
  Users,
  type LucideIcon,
  UserRound,
  SlidersHorizontal,
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
import { EMPTY_ART, EmptyState, Price } from "./kit";
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
  ProfileLinksRow,
  VideoCard,
  InfoRow,
  ChipGroup,
  ChipGroupList,
} from "./profile";
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

type ProfileTab = "Portfolio" | "Services" | "About" | "Reviews";

/** Each section carries an icon, so an unselected tab can be the icon alone. */
const tabs: { key: ProfileTab; icon: LucideIcon; solid: SolidIcon; move: Move }[] = [
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

/** Tabs are hidden for the one-scroll profile (owner, 5 Oct); flip to bring them back. */
const SHOW_TABS = false;

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
  const [tab, setTab] = useState<ProfileTab>("Portfolio");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Book on a service is a dated request the talent accepts or declines (owner, 3 Oct 2026).
  const serviceRequest = useServiceRequest();
  const onBook = owner ? undefined : serviceRequest.book;
  const { signedIn, loading } = useAuth();

  const toggleTrack = (id: string) => setPlayingId((current) => (current === id ? null : id));
  // Sharing needs a public link, and the link needs a username.
  const share = p.username ? () => setShareOpen(true) : undefined;

  return (
    <Screen tone="warm">
      {/* Owner only: the same one-line top bar every other main tab carries. The public profile
          (profile/$username) is a different screen and keeps its own back-arrow header. */}
      {owner ? (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-4 pt-6">
          {/* Not an <h1>: the hero below carries one for the person's name, and a page has one
              heading. This is a bar label, so it reads as a bar label. */}
          <p className="min-w-0 truncate text-3 font-semibold leading-tight">Profile</p>
          <div className="flex shrink-0 items-center gap-1">
            {/* One order on every screen: page action · Search · Bell · Settings. */}
            <IconBtnLink to="/search" label="Search" variant="plain" className="h-10 w-10">
              <Search size={iconSize.md} aria-hidden />
            </IconBtnLink>
            <NotificationsBell />
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
            <ViewerActions profileId={p.profileId} username={p.username} />
          )}
          {/* Links sit at the top, under the actions (owner, 5 Oct), not in a footer. */}
          <div className="mt-3">
            <ProfileLinksRow links={p.links} />
          </div>
        </div>
      </div>

      {/* One long scroll in the reference order (owner, 5 Oct): facts, About, Services, Portfolio,
          Reviews, identity chips, links, then the Message card. Tabs are hidden, not deleted —
          the owner may bring them back. */}
      {SHOW_TABS ? (
        <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Profile sections" />
      ) : null}

      <main className="px-5 pb-8">
        {SHOW_TABS ? (
          <>
            {tab === "Portfolio" ? (
              <Portfolio
                p={p}
                playingId={playingId}
                onToggleTrack={toggleTrack}
                owner={owner}
                onGalleryChange={onGalleryChange}
              />
            ) : null}
            {tab === "Services" ? <Services p={p} onBook={onBook} /> : null}
            {tab === "About" ? <About p={p} /> : null}
            {tab === "Reviews" ? <Reviews p={p} owner={owner} /> : null}
          </>
        ) : (
          <>
            {/* One bento for who they are (owner, 5 Oct): facts, music identity and professional
                details together, each fact once. About is only the bio. */}
            <AtAGlance p={p} />
            {p.longBio ? (
              <ProfileSection title="About">
                <div className="rounded-lg bg-card p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.longBio}</p>
                </div>
              </ProfileSection>
            ) : null}
            <Services p={p} onBook={onBook} />
            <Portfolio
              p={p}
              playingId={playingId}
              onToggleTrack={toggleTrack}
              owner={owner}
              onGalleryChange={onGalleryChange}
            />
            {owner || p.reviews.length ? <Reviews p={p} owner={owner} /> : null}
            {!owner && signedIn && p.profileId ? (
              <MessageCard name={p.name} profileId={p.profileId} />
            ) : null}
          </>
        )}
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
 * accepted), message, follow. A signed-out visitor is sent to Welcome; a seed-only profile
 * that has no database row keeps the buttons but cannot connect.
 */
function ViewerActions({
  profileId: rawProfileId,
  username,
}: {
  profileId?: string | undefined;
  username?: string | undefined;
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
  onBook,
  owner,
  onTab,
}: {
  p: TalentProfile;
  playingId: string | null;
  onToggleTrack: (id: string) => void;
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
            action={
              <ProfileCta
                cta={owner ? { label: "Manage portfolio", to: "/portfolio" } : undefined}
              />
            }
          />
        </ProfileSection>
      )}

      {p.services.length ? (
        <ProfileSection
          title="Available to work"
          action="Services"
          onAction={() => onTab("Services")}
        >
          <ServiceCard s={p.services[0]!} onBook={bookable(p.services[0]!, onBook)} />
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
        title="Portfolio"
        aside={
          <span className="flex items-center gap-1">
            <IconBtn
              label="Grid view"
              variant={layout === "grid" ? "ghost" : "plain"}
              className="h-10 w-10"
              onClick={() => setLayout("grid")}
            >
              <LayoutGrid size={iconSize.sm} aria-hidden />
            </IconBtn>
            <IconBtn
              label="Row view"
              variant={layout === "rows" ? "ghost" : "plain"}
              className="h-10 w-10"
              onClick={() => setLayout("rows")}
            >
              <Rows3 size={iconSize.sm} aria-hidden />
            </IconBtn>
          </span>
        }
      >
        {/* Audio, video and reels together (owner, 5 Oct), one grid/stack toggle for all. */}
        <div className={cn(layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-1")}>
          {p.audio.length || p.video.length ? (
            <>
              {p.audio.map((track) => (
                <AudioTrackCard
                  key={track.id}
                  track={track}
                  layout={layout === "grid" ? "portrait" : "stacked"}
                  playing={playingId === track.id}
                  onToggle={() => onToggleTrack(track.id)}
                />
              ))}
              {p.video.map((video) => (
                <VideoCard key={video.id} v={video} layout={layout === "grid" ? "grid" : "row"} />
              ))}
            </>
          ) : (
            <div className="col-span-2">
              <EmptyState
                art={EMPTY_ART.work}
                title="No work yet"
                body="Tracks, videos and reels will appear here."
                action={
                  <ProfileCta
                    cta={owner ? { label: "Manage portfolio", to: "/portfolio" } : undefined}
                  />
                }
              />
            </div>
          )}
        </div>
      </ProfileSection>
      {/* The owner can always add photos here; a visitor sees the gallery only once it has some. */}
      {/* The owner can always add photos here; a visitor sees the gallery only once it has some.
          The gallery has no page of its own yet, so it is still managed here. */}
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
  onBook,
}: {
  p: TalentProfile;
  onBook: ((s: ServiceItem) => void) | undefined;
}) {
  return (
    <ProfileSection title="Services">
      <div className="space-y-3">
        {p.services.length ? (
          p.services.map((service) => (
            <ServiceCard key={service.id} s={service} onBook={bookable(service, onBook)} />
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

function About({
  p,
  part = "all",
}: {
  p: TalentProfile;
  /** One scroll: "text" (bio, details) up top, "identity" (chips, links) after Reviews. */
  part?: "all" | "text" | "identity";
}) {
  const text = part !== "identity";
  const identity = part !== "text";
  return (
    <>
      {part === "all" ? <FactGrid p={p} /> : null}
      {text && (part === "all" || p.longBio || professionalDetails(p).length) ? (
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
            {professionalDetails(p).length ? (
              <div className="divide-y divide-border rounded-lg bg-subtle">
                {professionalDetails(p).map((item) => (
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
        </>
      ) : null}
      {identity &&
      (part === "all" ||
        typesOf(p).length ||
        p.genres.length ||
        p.instruments.length ||
        p.languages.length ||
        p.links.length) ? (
        <>
          <ProfileSection title="Music identity">
            {typesOf(p).length || p.genres.length || p.instruments.length || p.languages.length ? (
              part === "identity" ? (
                // One card of labelled chip groups with dividers (reference img 10): no half-empty
                // rows the bento left beside a short card.
                <ChipGroupList>
                  <ChipGroup label="Type" items={typesOf(p)} />
                  <ChipGroup label="Genres" items={p.genres} />
                  <ChipGroup label="Instruments" items={p.instruments} />
                  <ChipGroup label={`Languages (${p.languages.length})`} items={p.languages} />
                </ChipGroupList>
              ) : (
                <MusicIdentityBento p={p} />
              )
            ) : (
              <EmptyState
                title="No music identity yet"
                body="Instruments and languages will appear here."
              />
            )}
          </ProfileSection>
          {p.links.length ? (
            <ProfileSection title="External links">
              {p.links.length ? (
                <SocialLinks links={p.links} />
              ) : (
                <EmptyState
                  title="No links yet"
                  body="Streaming and social links will appear here."
                />
              )}
            </ProfileSection>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/**
 * The fact grid (plan §6, owner 4 Oct): Experience, Genres, Languages, City — real values only.
 * Two columns with a 1px gap on the hairline, so the gaps are the dividers. With an odd count the
 * last fact spans both columns: never an empty cell.
 */
function FactGrid({ p }: { p: TalentProfile }) {
  const facts = [
    { label: "Experience", value: p.yearsActive, icon: <Clock3 size={14} aria-hidden /> },
    {
      label: "Genres",
      value: p.genres.slice(0, 3).join(", "),
      icon: <Music size={14} aria-hidden />,
    },
    {
      label: "Languages",
      value: p.languages.slice(0, 3).join(", "),
      icon: <Globe2 size={14} aria-hidden />,
    },
    { label: "City", value: p.location, icon: <MapPin size={14} aria-hidden /> },
  ].filter((f) => f.value);
  if (!facts.length) return null;
  return (
    <ProfileSection title="At a glance">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border ring-1 ring-border">
        {facts.map((f, i) => (
          <div
            key={f.label}
            className={
              i === facts.length - 1 && facts.length % 2 ? "col-span-2 bg-card" : "bg-card"
            }
          >
            <InfoRow cell label={f.label} value={f.value} icon={f.icon} />
          </div>
        ))}
      </div>
    </ProfileSection>
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
            art={EMPTY_ART.reviews}
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
        {count ? <span className="text-1 font-medium text-muted-foreground">{count}</span> : null}
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

/**
 * The dark card that closes a profile (reference: "Have a question for …?"): one action, Message,
 * which opens the thread in the Inbox (item 10). Copy: owner.
 */
export function MessageCard({ name, profileId }: { name: string; profileId: string }) {
  const message = useMessagePerson();
  return (
    <section className="mt-8 rounded-lg bg-ink p-5 text-ink-foreground">
      <h2 className="text-2 font-semibold text-ink-foreground">{`Have a question for ${name}?`}</h2>
      <p className="mt-1 text-1 opacity-80">Send a message.</p>
      <Btn
        variant="outline"
        className="mt-4"
        icon={<Send size={iconSize.sm} aria-hidden />}
        loading={message.pending}
        onClick={() => void message.open(profileId)}
      >
        {`Message ${name.split(" ")[0] || name}`}
      </Btn>
    </section>
  );
}

/**
 * At a glance as one bento (owner, 5 Oct): Type, Genres (wide), Instruments, Languages, City,
 * Experience and each professional detail — every fact once, from real values only. A lone tile
 * at the end of a row spans it, so there is never an empty half cell.
 */
function AtAGlance({ p }: { p: TalentProfile }) {
  const chips = (items: string[]) => items.map((t) => <BentoChip key={t}>{t}</BentoChip>);
  const text = (v: string) => <p className="text-sm font-medium text-foreground">{v}</p>;
  const tiles: { key: string; icon: LucideIcon; label: string; body: ReactNode; wide?: boolean }[] =
    [];
  const types = typesOf(p);
  if (p.genres.length)
    tiles.push({ key: "genres", icon: Music, label: "Genres", body: chips(p.genres), wide: true });
  if (types.length) tiles.push({ key: "type", icon: UserRound, label: "Type", body: chips(types) });
  if (p.instruments.length)
    tiles.push({ key: "inst", icon: Guitar, label: "Instruments", body: chips(p.instruments) });
  if (p.languages.length)
    tiles.push({ key: "lang", icon: Languages, label: "Languages", body: chips(p.languages) });
  if (p.location) tiles.push({ key: "city", icon: MapPin, label: "City", body: text(p.location) });
  if (p.yearsActive)
    tiles.push({ key: "exp", icon: Clock3, label: "Experience", body: text(p.yearsActive) });
  for (const d of professionalDetails(p)) {
    const v = String(d.value);
    // A long value reads better across the row; a short one pairs with its neighbour.
    tiles.push({
      key: `d-${d.label}`,
      icon: SlidersHorizontal,
      label: d.label,
      body: text(v),
      wide: v.length > 22,
    });
  }
  if (!tiles.length) return null;
  // Fill rows of two: a single tile left alone before a wide one, or at the end, spans the row.
  let col = 0;
  const laid = tiles.map((t, i) => {
    if (t.wide) {
      col = 0;
      return t;
    }
    // The end counts as a wide neighbour; a normal tile does not (`??` read its missing flag as
    // true and made every tile span the row).
    const nextWide = i + 1 < tiles.length ? Boolean(tiles[i + 1]!.wide) : true;
    const spans = col === 0 && nextWide;
    col = spans ? 0 : (col + 1) % 2;
    return { ...t, wide: spans };
  });
  return (
    <ProfileSection title="At a glance">
      <div className="grid grid-cols-2 gap-2.5">
        {laid.map((t) => (
          <BentoCard key={t.key} icon={t.icon} label={t.label} wide={!!t.wide}>
            {t.body}
          </BentoCard>
        ))}
      </div>
    </ProfileSection>
  );
}

/** No price, rate or budget on a profile (owner, 4 Oct, item 8): those live on Service Cards. */
function professionalDetails(p: TalentProfile) {
  return p.professional.filter(
    (item) => typeof item.value === "string" && !/budget|rate|price|fee/i.test(item.label),
  );
}
