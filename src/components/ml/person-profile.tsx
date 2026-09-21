import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
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
  FolderKanban,
  Globe2,
  Guitar,
  Heart,
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
  Share2,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import type { PersonProfile, profileInsights } from "@/data/profile";
import type { WorkKind } from "@/data/portfolio";
import { cn, joinParts } from "@/lib/utils";
import { Btn, BtnLink, Chip, IconBtn, IconBtnLink, Screen } from "./ui";
import { SectionTabs, StateIcon, type Move, type SolidIcon } from "./tab-icon";
import { Price } from "./kit";
import {
  AudioTrackCard,
  CollaboratorCard,
  CompletionCard,
  ExperienceCard,
  FeaturedCard,
  NoCover,
  MarketEntryCard,
  MoreSheet,
  OpportunityCard,
  ProfileEmpty,
  type ProfileEmptyCta,
  ProfileHero,
  ProfileSection,
  StackSection,
  ClampedText,
  ProjectCard,
  ReviewCard,
  ServiceCard,
  ServicesProvided,
  ReviewInviteCard,
  ShareSheet,
  SocialLinks,
  VideoCard,
  ChipGroup,
  ChipGroupList,
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
import { PhotoSheet } from "./booking";
import { useAuth } from "@/hooks/use-auth";
import { useMessagePerson } from "@/hooks/use-message-person";
import { iconSize } from "@/lib/tokens";

type ProfileTab = "Overview" | "Portfolio" | "Projects" | "Services" | "About" | "Reviews";

/** Each section carries an icon, so an unselected tab can be the icon alone. */
const tabs: { key: ProfileTab; icon: LucideIcon; solid: SolidIcon; move: Move }[] = [
  { key: "Overview", icon: Sparkles, solid: "sparkle", move: "spin" },
  { key: "About", icon: Info, solid: "info", move: "hop" },
  { key: "Portfolio", icon: Music, solid: "music", move: "dance" },
  { key: "Projects", icon: FolderKanban, solid: "folder", move: "swing" },
  { key: "Services", icon: BriefcaseBusiness, solid: "briefcase", move: "swing" },
  { key: "Reviews", icon: Star, solid: "star", move: "stamp" },
];

/** An owner's empty-state button that opens new portfolio work of the kind the section shows. */
const addWork = (label: string, kind: WorkKind): ProfileEmptyCta => ({
  label,
  to: "/portfolio/new/$kind",
  kind,
});

type Completion = { percent: number; missing: { id: string; label: string; to?: string }[] };

export function PersonProfileExperience({
  p,
  owner = false,
  completion,
  insights,
  onPickImage,
  onGalleryChange,
}: {
  p: PersonProfile;
  owner?: boolean;
  /** Owner only: uploads a chosen photo or cover and saves it to the profile. */
  onPickImage?: ((kind: "avatar" | "cover", file: File) => Promise<void>) | undefined;
  /**
   * Signed-in owner only: the gallery becomes editable, and this runs after each change so the
   * profile can reload it.
   */
  onGalleryChange?: (() => void) | undefined;
  /** Owner only: what the profile still needs. Hidden when nothing is missing. */
  completion?: Completion | undefined;
  /** Owner only: insight figures. Left out for a real profile, so no sample numbers show. */
  insights?: typeof profileInsights | undefined;
}) {
  const [tab, setTab] = useState<ProfileTab>("Overview");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const { signedIn, loading } = useAuth();

  const toggleTrack = (id: string) => setPlayingId((current) => (current === id ? null : id));
  // Sharing needs a public link, and the link needs a username.
  const share = p.username ? () => setShareOpen(true) : undefined;

  return (
    <Screen>
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
            <OwnerActions
              username={p.username}
              onShare={share}
              onInsights={() => setInsightsOpen((open) => !open)}
            />
          ) : (
            <ViewerActions
              profileId={p.profileId}
              onHire={isOpenForWork(p.availability) ? () => setHireOpen(true) : undefined}
            />
          )}
        </div>
      </div>

      {owner ? (
        <OwnerPanel completion={completion} insights={insights} insightsOpen={insightsOpen} />
      ) : null}

      {owner ? null : (
        <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Profile sections" />
      )}

      <main className="px-5 pb-8">
        {owner ? (
          <OwnerStack
            p={p}
            playingId={playingId}
            onToggleTrack={toggleTrack}
            onHire={() => setHireOpen(true)}
            onGalleryChange={onGalleryChange}
          />
        ) : null}
        {tab === "Overview" && !owner ? (
          <Overview
            p={p}
            playingId={playingId}
            onToggleTrack={toggleTrack}
            onHire={() => setHireOpen(true)}
            owner={owner}
            onTab={setTab}
          />
        ) : null}
        {!owner && tab === "Portfolio" ? (
          <Portfolio p={p} playingId={playingId} onToggleTrack={toggleTrack} owner={owner} />
        ) : null}
        {!owner && tab === "Projects" ? <Projects p={p} owner={owner} /> : null}
        {!owner && tab === "Services" ? <Services p={p} onHire={() => setHireOpen(true)} /> : null}
        {!owner && tab === "About" ? <About p={p} /> : null}
        {!owner && tab === "Reviews" ? <Reviews p={p} owner={owner} /> : null}
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
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} name={p.name} />
      <HireModal
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        subject={{ name: p.name, detail: [p.primaryRole, p.location].filter(Boolean).join(" · ") }}
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
  profileId,
  onHire,
}: {
  profileId?: string | undefined;
  onHire?: (() => void) | undefined;
}) {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: () => toast.error("That didn't save. Try again."),
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
      strokeWidth={2}
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
  onInsights,
}: {
  username: string;
  onShare?: (() => void) | undefined;
  onInsights: () => void;
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
      <IconBtn label="Stats" variant="outline" className="h-11 w-11" onClick={onInsights}>
        <BarChart3 size={iconSize.md} aria-hidden />
      </IconBtn>
      {/* The public page needs a username; without one, set it in profile edit. */}
      <IconBtnLink
        {...(username
          ? { to: "/profile/$username" as const, params: { username } }
          : { to: "/profile/edit" as const })}
        label="View Public Profile"
        variant="outline"
        className="h-11 w-11"
      >
        <ExternalLink size={iconSize.md} aria-hidden />
      </IconBtnLink>
    </div>
  );
}

function OwnerPanel({
  completion,
  insights,
  insightsOpen,
}: {
  completion: Completion | undefined;
  insights: typeof profileInsights | undefined;
  insightsOpen: boolean;
}) {
  return (
    <section className="space-y-3 px-5 pt-5">
      {completion?.missing.length ? (
        <CompletionCard percent={completion.percent} missing={completion.missing} />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <OwnerLink
          to="/portfolio"
          icon={<FolderKanban size={iconSize.sm} />}
          label="Manage portfolio"
        />
        <OwnerLink
          to="/services"
          icon={<BriefcaseBusiness size={iconSize.sm} />}
          label="Manage services"
        />
        <OwnerLink to="/reviews" icon={<Star size={iconSize.sm} />} label="Reviews" />
        <OwnerLink to="/settings" icon={<Settings size={iconSize.sm} />} label="Settings" />
      </div>

      {insightsOpen ? (
        <div className="rounded-lg bg-subtle p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="pill bg-background text-muted-foreground">Profile insights</p>
              {insights ? <h2 className="mt-1 text-2">{insights.range}</h2> : null}
            </div>
            <BarChart3 size={iconSize.md} className="text-primary" aria-hidden />
          </div>
          {insights ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {insights.headline.map((item) => (
                <div key={item.label} className="rounded-lg bg-subtle p-3">
                  <p className="text-1 text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2 font-bold">{item.value}</p>
                  <p className="text-1 font-semibold text-foreground">{item.delta}</p>
                </div>
              ))}
            </div>
          ) : null}
          <BtnLink to="/profile/insights" variant="ghost" className="mt-3 w-full">
            Full Insights
          </BtnLink>
        </div>
      ) : null}
    </section>
  );
}

type OwnerDestination =
  | "/profile/edit"
  | "/portfolio"
  | "/services"
  | "/services/availability"
  | "/settings"
  | "/identity/qr"
  | "/verification"
  | "/reviews"
  | "/bands"
  | "/help";

function OwnerLink({ to, icon, label }: { to: OwnerDestination; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="state-layer flex min-w-0 items-center gap-2 rounded-lg bg-subtle px-3 py-3 text-1 font-semibold transition-transform duration-125 ease-standard active:scale-97"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
      <ChevronRight
        size={iconSize.sm}
        className="ml-auto shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}

function Overview({
  p,
  playingId,
  onToggleTrack,
  onHire,
  owner,
  onTab,
}: {
  p: PersonProfile;
  playingId: string | null;
  onToggleTrack: (id: string) => void;
  onHire: () => void;
  owner: boolean;
  onTab: (tab: ProfileTab) => void;
}) {
  return (
    <>
      <ProfileSection title="Professional summary">
        {p.shortBio ? (
          <div className="rounded-lg bg-subtle p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{p.shortBio}</p>
            <button
              type="button"
              className="state-layer hit-area mt-3 inline-flex items-center gap-1 rounded-full text-1 font-semibold text-foreground transition-transform duration-125 ease-standard active:scale-97"
              onClick={() => onTab("About")}
            >
              Read full profile <ChevronRight size={iconSize.sm} aria-hidden />
            </button>
          </div>
        ) : (
          <ProfileEmpty
            title="No summary yet"
            body="This professional has not written a summary yet."
            cta={owner ? { label: "Write a summary", to: "/profile/edit" } : undefined}
          />
        )}
      </ProfileSection>
      {p.featured ? (
        <ProfileSection title="Featured work">
          <FeaturedCard featured={p.featured} />
        </ProfileSection>
      ) : null}
      {typesOf(p).length || p.genres.length || p.instruments.length || p.languages.length ? (
        <ProfileSection title="Music identity">
          <ChipGroupList>
            <ChipGroup label="Type" icon={UserRound} items={typesOf(p)} />
            <ChipGroup label="Genres" icon={Music} items={p.genres} />
            <ChipGroup label="Instruments" icon={Guitar} items={p.instruments} />
            <ChipGroup label="Languages" icon={Languages} items={p.languages} />
          </ChipGroupList>
        </ProfileSection>
      ) : null}
      {p.audio.length ? (
        <ProfileSection
          title="Audio portfolio"
          action="View All"
          onAction={() => onTab("Portfolio")}
        >
          <div className="space-y-2">
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
          <ProfileEmpty
            title="No audio yet"
            body="This professional has not added audio samples yet."
            cta={owner ? addWork("Add audio", "track") : undefined}
          />
        </ProfileSection>
      )}
      {p.projects.length ? (
        <ProfileSection
          title="Selected projects"
          action="View All"
          onAction={() => onTab("Projects")}
        >
          <div className="space-y-2">
            {p.projects.slice(0, 2).map((project) => (
              <ProjectCard key={project.id} p={project} />
            ))}
          </div>
        </ProfileSection>
      ) : null}
      {p.services.length ? (
        <ProfileSection
          title="Available to work"
          action="Services"
          onAction={() => onTab("Services")}
        >
          <ServiceCard s={p.services[0]!} onEnquire={onHire} />
        </ProfileSection>
      ) : null}
      <RelationshipSections p={p} />
    </>
  );
}

/**
 * The owner's own profile: every section stacked, each editable from its own heading row, the way
 * LinkedIn lays out a profile you own. No tabs — tabs are for the public profile, where a visitor
 * is choosing what to look at rather than working through their own record.
 */
function OwnerStack({
  p,
  playingId,
  onToggleTrack,
  onHire,
  onGalleryChange,
}: {
  p: PersonProfile;
  playingId: string | null;
  onToggleTrack: (id: string) => void;
  onHire: () => void;
  onGalleryChange?: (() => void) | undefined;
}) {
  const edit = "/profile/edit" as const;
  // The signed-in owner manages the gallery here; the demo profile shown signed out only shows it.
  const gallery = onGalleryChange ? (
    <GalleryEditor title="Gallery" onChange={onGalleryChange} />
  ) : p.gallery.length ? (
    <GalleryView images={p.gallery} title="Gallery" />
  ) : null;
  const bio = p.longBio || p.shortBio;
  return (
    <>
      <StackSection title="About" editTo={edit} editSection="identity">
        {bio ? (
          <ClampedText text={bio} />
        ) : (
          <ProfileEmpty title="No summary yet" body="Say what you do and who you do it for." />
        )}
      </StackSection>

      {p.featured ? (
        <StackSection title="Featured" editTo="/portfolio">
          <FeaturedCard featured={p.featured} />
        </StackSection>
      ) : null}

      <StackSection title="Services provided" editTo="/services" collapsible>
        {p.services.length ? (
          <ServicesProvided services={p.services} />
        ) : (
          <ProfileEmpty
            title="No services yet"
            body="List what you offer and what it costs, so people can book it."
          />
        )}
      </StackSection>

      {typesOf(p).length ||
      p.genres.length ||
      p.instruments.length ||
      p.languages.length ||
      p.specialisations.length ||
      p.influences.length ? (
        <StackSection title="Music identity" editTo={edit} editSection="music" collapsible>
          <ChipGroupList>
            <ChipGroup label="Type" icon={UserRound} items={typesOf(p)} />
            <ChipGroup label="Genres" icon={Music} items={p.genres} />
            <ChipGroup label="Instruments" icon={Guitar} items={p.instruments} />
            <ChipGroup label="Languages" icon={Languages} items={p.languages} />
            <ChipGroup label="Specialisations" icon={Sparkles} items={p.specialisations} />
            <ChipGroup label="Influences" icon={Heart} items={p.influences} />
          </ChipGroupList>
        </StackSection>
      ) : null}

      <StackSection title="Portfolio" editTo="/portfolio">
        {p.audio.length || p.video.length || p.gallery.length ? (
          <div className="space-y-4">
            {p.audio.length ? (
              <div className="space-y-2">
                {p.audio.slice(0, 2).map((track) => (
                  <AudioTrackCard
                    key={track.id}
                    track={track}
                    playing={playingId === track.id}
                    onToggle={() => onToggleTrack(track.id)}
                  />
                ))}
              </div>
            ) : null}
            {p.video.length ? (
              <div className="space-y-3">
                {p.video.slice(0, 2).map((video) => (
                  <VideoCard key={video.id} v={video} layout="row" />
                ))}
              </div>
            ) : null}
            {gallery}
          </div>
        ) : (
          <div className="space-y-4">
            <ProfileEmpty
              title="No work yet"
              body="Tracks, videos and credits are what turn a profile view into an enquiry."
            />
            {gallery}
          </div>
        )}
      </StackSection>

      {p.projects.length ? (
        <StackSection title="Projects" editTo="/portfolio" collapsible>
          <div className="space-y-2">
            {p.projects.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} p={project} />
            ))}
          </div>
        </StackSection>
      ) : null}

      {p.experience.length ? (
        <StackSection title="Experience" editTo={edit} editSection="experience" collapsible>
          <div className="space-y-2">
            {p.experience.map((item) => (
              <ExperienceCard key={item.id} e={item} />
            ))}
          </div>
        </StackSection>
      ) : null}

      <StackSection
        title="Professional details"
        editTo={edit}
        editSection={p.professional.length ? "details" : "professional"}
        collapsible
        defaultOpen={false}
      >
        {p.professional.length ? (
          <div className="divide-y divide-border rounded-lg bg-subtle">
            {p.professional.map((item) => (
              <InfoRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : (
          <ProfileEmpty
            title="No details yet"
            body="Setup, tools and working details will appear here."
          />
        )}
      </StackSection>

      <StackSection title="Links" editTo={edit} editSection="links" collapsible defaultOpen={false}>
        {p.links.length ? (
          <SocialLinks links={p.links} />
        ) : (
          <ProfileEmpty title="No links yet" body="Streaming and social links will appear here." />
        )}
      </StackSection>

      <StackSection title="Reviews">
        {p.reviews.length ? (
          <div className="space-y-3">
            {p.reviews.slice(0, 2).map((review) => (
              <ReviewCard key={review.id} r={review} />
            ))}
          </div>
        ) : (
          <p className="text-1 text-foreground">
            You haven't received enough reviews to show an overall rating.
          </p>
        )}
        <div className="mt-3">
          <ReviewInviteCard />
        </div>
      </StackSection>

      {p.collaborators.length ? (
        <StackSection title="Works with" collapsible>
          <div className="rail flex gap-4 overflow-x-auto pb-1 no-scrollbar">
            {p.collaborators.map((collaborator) => (
              <CollaboratorCard key={collaborator.id} c={collaborator} />
            ))}
          </div>
        </StackSection>
      ) : null}

      {p.opportunities.length ? (
        <StackSection title="Opportunities" collapsible>
          <div className="space-y-2">
            {p.opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} o={opportunity} />
            ))}
          </div>
        </StackSection>
      ) : null}

      {p.market.length ? (
        <StackSection title="Marketplace" collapsible>
          <div className="rail flex gap-3 overflow-x-auto no-scrollbar">
            {p.market.map((entry) => (
              <MarketEntryCard key={entry.id} m={entry} />
            ))}
          </div>
        </StackSection>
      ) : null}
    </>
  );
}

function Portfolio({
  p,
  playingId,
  onToggleTrack,
  owner,
}: {
  p: PersonProfile;
  playingId: string | null;
  onToggleTrack: (id: string) => void;
  owner: boolean;
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
            <ProfileEmpty
              title="No tracks added"
              body="Audio samples, demos and sessions will appear here."
              cta={owner ? addWork("Add track", "track") : undefined}
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
              <ProfileEmpty
                title="No videos yet"
                body="Performance and studio videos will appear here."
                cta={owner ? addWork("Add video", "video") : undefined}
              />
            </div>
          )}
        </div>
      </ProfileSection>
      {/* Visitors see a gallery only when it has photos; the owner adds them on their own profile. */}
      {p.gallery.length ? (
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
                  <img src={image} alt="" loading="lazy" className="h-56 w-full object-cover" />
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

function Projects({ p, owner }: { p: PersonProfile; owner: boolean }) {
  return (
    <>
      <ProfileSection title="Projects">
        {p.projects.length ? (
          <div className="space-y-2">
            {p.projects.map((project) => (
              <ProjectCard key={project.id} p={project} />
            ))}
          </div>
        ) : (
          <ProfileEmpty
            title="No projects yet"
            body="Released work, film scores and collaborations will appear here."
            cta={owner ? addWork("Add project", "project") : undefined}
          />
        )}
      </ProfileSection>
      <ProfileSection title="Discography">
        {p.discography.length ? (
          <div className="grid grid-cols-2 gap-3">
            {p.discography.map((release) => (
              <article key={release.id} className="overflow-hidden rounded-lg bg-subtle">
                {release.cover ? (
                  <img
                    src={release.cover}
                    alt={release.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <NoCover className="aspect-square w-full" />
                )}
                <div className="p-3">
                  <h3 className="truncate text-1">{release.title}</h3>
                  <p className="mt-1 truncate text-1 text-muted-foreground">
                    {joinParts(release.kind, release.year)}
                  </p>
                  <p className="mt-1 truncate text-1 font-semibold text-foreground">
                    {release.label}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ProfileEmpty
            title="No releases yet"
            body="Discography and credited releases will appear here."
            cta={owner ? addWork("Add release", "album") : undefined}
          />
        )}
      </ProfileSection>
      <ProfileSection title="Experience & credits">
        {p.experience.length ? (
          <div className="divide-y divide-border rounded-lg bg-subtle">
            {p.experience.map((item) => (
              <ExperienceCard key={item.id} e={item} />
            ))}
          </div>
        ) : (
          // No owner button: nothing in the app adds experience yet.
          <ProfileEmpty title="No credits yet" body="Professional experience will appear here." />
        )}
      </ProfileSection>
    </>
  );
}

function Services({ p, onHire }: { p: PersonProfile; onHire: () => void }) {
  return (
    <ProfileSection title="Services">
      <div className="space-y-3">
        {p.services.length ? (
          p.services.map((service) => (
            <ServiceCard key={service.id} s={service} onEnquire={onHire} />
          ))
        ) : (
          // No owner button: the new-service flow does not save a service yet.
          <ProfileEmpty
            title="No services listed"
            body="This professional has not listed services yet."
          />
        )}
      </div>
    </ProfileSection>
  );
}

function About({ p }: { p: PersonProfile }) {
  return (
    <>
      <ProfileSection title="About">
        {p.longBio ? (
          <div className="rounded-lg bg-subtle p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{p.longBio}</p>
          </div>
        ) : (
          <ProfileEmpty title="No bio yet" body="This professional has not written a bio yet." />
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
          <ProfileEmpty
            title="No details yet"
            body="Setup, tools and working details will appear here."
          />
        )}
      </ProfileSection>
      <ProfileSection title="Music identity">
        {typesOf(p).length ||
        p.specialisations.length ||
        p.influences.length ||
        p.instruments.length ||
        p.languages.length ? (
          <ChipGroupList>
            <ChipGroup label="Type" icon={UserRound} items={typesOf(p)} />
            <ChipGroup label="Specialisations" icon={Sparkles} items={p.specialisations} />
            <ChipGroup label="Influences" icon={Heart} items={p.influences} />
            <ChipGroup label="Instruments" icon={Guitar} items={p.instruments} />
            <ChipGroup label="Languages" icon={Languages} items={p.languages} />
          </ChipGroupList>
        ) : (
          <ProfileEmpty
            title="No music identity yet"
            body="Specialisations, instruments and languages will appear here."
          />
        )}
      </ProfileSection>
      <ProfileSection title="External links">
        {p.links.length ? (
          <SocialLinks links={p.links} />
        ) : (
          <ProfileEmpty title="No links yet" body="Streaming and social links will appear here." />
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

function Reviews({ p, owner }: { p: PersonProfile; owner: boolean }) {
  return (
    <>
      <ProfileSection title="Reviews">
        {p.reviewCount ? (
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Star size={iconSize.sm} className="fill-foreground" aria-hidden />
            {p.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              · {p.reviewCount} {p.reviewCount === 1 ? "review" : "reviews"}
            </span>
          </p>
        ) : null}
        {p.reviews.length ? (
          <div className="space-y-3">
            {p.reviews.map((review) => (
              <ReviewCard key={review.id} r={review} />
            ))}
          </div>
        ) : (
          <ProfileEmpty
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

function RelationshipSections({ p }: { p: PersonProfile }) {
  return (
    <>
      {p.collaborators.length ? (
        <ProfileSection title="Works with">
          <div className="rail flex gap-4 overflow-x-auto pb-1 no-scrollbar">
            {p.collaborators.map((collaborator) => (
              <CollaboratorCard key={collaborator.id} c={collaborator} />
            ))}
          </div>
        </ProfileSection>
      ) : null}
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
              <MarketEntryCard key={entry.id} m={entry} />
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
function typesOf(p: PersonProfile) {
  return [p.primaryRole, ...p.secondaryRoles].filter(Boolean);
}
