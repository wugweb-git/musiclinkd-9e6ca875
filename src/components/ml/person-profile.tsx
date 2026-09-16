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
  Play,
  Settings,
  Settings2,
  QrCode,
  Rows3,
  Share2,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PersonProfile, profileInsights } from "@/data/profile";
import type { WorkKind } from "@/data/portfolio";
import { cn, joinParts } from "@/lib/utils";
import { Btn, BtnLink, Chip, IconBtn, IconBtnLink, Screen } from "./ui";
import { Price } from "./kit";
import {
  AudioTrackCard,
  CollaboratorCard,
  CompletionCard,
  ExperienceCard,
  FeaturedCard,
  GalleryGrid,
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
  ShareSheet,
  SocialLinks,
  VideoCard,
  ChipGroup,
  ChipGroupList,
  InfoRow,
  isOpenForWork,
} from "./profile";
import { HireModal } from "./hire-modal";

type ProfileTab = "Overview" | "Portfolio" | "Projects" | "Services" | "About" | "Reviews";

/** Each section carries an icon, so an unselected tab can be the icon alone. */
const tabs: { key: ProfileTab; icon: LucideIcon }[] = [
  { key: "Overview", icon: Sparkles },
  { key: "About", icon: Info },
  { key: "Portfolio", icon: Music },
  { key: "Projects", icon: FolderKanban },
  { key: "Services", icon: BriefcaseBusiness },
  { key: "Reviews", icon: Star },
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
}: {
  p: PersonProfile;
  owner?: boolean;
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

  const toggleTrack = (id: string) => setPlayingId((current) => (current === id ? null : id));
  // Sharing needs a public link, and the link needs a username.
  const share = p.username ? () => setShareOpen(true) : undefined;

  return (
    <Screen>
      <ProfileHero
        p={p}
        owner={owner}
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
            onHire={isOpenForWork(p.availability) ? () => setHireOpen(true) : undefined}
          />
        )}
      </div>

      {owner ? (
        <OwnerPanel completion={completion} insights={insights} insightsOpen={insightsOpen} />
      ) : null}

      <nav
        aria-label="Profile sections"
        className="sticky top-0 z-20 mt-5 border-b border-border bg-background/95 px-2 backdrop-blur"
      >
        <div role="tablist" aria-label="Profile sections" className="flex items-stretch">
          {tabs.map(({ key, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={key}
                onClick={() => setTab(key)}
                className={cn(
                  "state-layer relative flex items-center justify-center gap-1.5 rounded-t-md py-3.5 transition-[flex,color] duration-200 ease-standard",
                  active ? "flex-1 px-2 text-foreground" : "w-11 shrink-0 text-muted-foreground",
                )}
              >
                <Icon size={18} aria-hidden />
                <span
                  className={cn(
                    "overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold transition-all duration-200 ease-standard motion-reduce:transition-none",
                    active ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
                  )}
                >
                  {key}
                </span>
                {active ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="px-5 pb-8">
        {tab === "Overview" && owner ? (
          <OwnerOverview
            p={p}
            playingId={playingId}
            onToggleTrack={toggleTrack}
            onHire={() => setHireOpen(true)}
            owner={owner}
            onTab={setTab}
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
        {tab === "Portfolio" ? (
          <Portfolio p={p} playingId={playingId} onToggleTrack={toggleTrack} owner={owner} />
        ) : null}
        {tab === "Projects" ? <Projects p={p} owner={owner} /> : null}
        {tab === "Services" ? <Services p={p} onHire={() => setHireOpen(true)} /> : null}
        {tab === "About" ? <About p={p} /> : null}
        {tab === "Reviews" ? <Reviews p={p} owner={owner} /> : null}
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

function ViewerActions({ onHire }: { onHire?: (() => void) | undefined }) {
  const [following, setFollowing] = useState(false);
  const [connected, setConnected] = useState(false);

  return (
    // One row, primary first: connect, then message, then hire, then follow. Each says its state.
    <div className="flex items-center gap-2">
      <Btn
        variant={connected ? "outline" : "primary"}
        className="min-w-0 flex-1 px-3"
        icon={connected ? <Check size={16} aria-hidden /> : <UserPlus size={16} aria-hidden />}
        onClick={() => setConnected((c) => !c)}
      >
        {connected ? "Requested" : "Connect"}
      </Btn>
      <BtnLink
        to="/messages"
        variant="outline"
        className="min-w-0 flex-1 px-3"
        icon={<Send size={16} aria-hidden />}
      >
        Message
      </BtnLink>
      {onHire ? (
        <Btn
          variant="outline"
          className="min-w-0 flex-1 px-3"
          icon={<BriefcaseBusiness size={16} aria-hidden />}
          onClick={onHire}
        >
          Hire
        </Btn>
      ) : null}
      <IconBtn
        label={following ? "Following" : "Follow"}
        variant={following ? "ghost" : "outline"}
        className="h-12 w-12"
        onClick={() => setFollowing((f) => !f)}
      >
        {following ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
      </IconBtn>
    </div>
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
        <Pencil size={18} aria-hidden />
      </IconBtnLink>
      {onShare ? (
        <IconBtn label="Share Profile" variant="outline" className="h-11 w-11" onClick={onShare}>
          <Share2 size={18} aria-hidden />
        </IconBtn>
      ) : null}
      <IconBtn label="Stats" variant="outline" className="h-11 w-11" onClick={onInsights}>
        <BarChart3 size={18} aria-hidden />
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
        <ExternalLink size={18} aria-hidden />
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
        <OwnerLink to="/portfolio" icon={<FolderKanban size={16} />} label="Manage portfolio" />
        <OwnerLink to="/services" icon={<BriefcaseBusiness size={16} />} label="Manage services" />
        <OwnerLink to="/verification" icon={<BadgeCheck size={16} />} label="Verification" />
        <OwnerLink to="/reviews" icon={<Star size={16} />} label="Reviews" />
        <OwnerLink to="/profile/edit" icon={<Settings2 size={16} />} label="Profile settings" />
        <OwnerLink to="/settings" icon={<Settings size={16} />} label="Settings" />
      </div>

      {insightsOpen ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="pill bg-subtle text-muted-foreground">Profile insights</p>
              {insights ? <h2 className="mt-1 text-2">{insights.range}</h2> : null}
            </div>
            <BarChart3 size={18} className="text-primary" aria-hidden />
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
  | "/plans"
  | "/recommendations"
  | "/help";

function OwnerLink({ to, icon, label }: { to: OwnerDestination; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="state-layer flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-1 font-semibold transition-transform duration-125 ease-standard active:scale-98"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
      <ChevronRight size={14} className="ml-auto shrink-0 text-muted-foreground" aria-hidden />
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
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{p.shortBio}</p>
            <button
              type="button"
              className="state-layer hit-area mt-3 inline-flex items-center gap-1 rounded-full text-1 font-semibold text-foreground transition-transform duration-125 ease-standard active:scale-98"
              onClick={() => onTab("About")}
            >
              Read full profile <ChevronRight size={14} aria-hidden />
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
      {p.genres.length || p.instruments.length || p.languages.length ? (
        <ProfileSection title="Music identity">
          <ChipGroupList>
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

function OwnerOverview({
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
  // The owner's own profile: stacked sections, each editable from its heading row.
  const edit = "/profile/edit" as const;
  return (
    <>
      <StackSection
        title="About"
        editTo={edit}
        showAll="Read full profile"
        onShowAll={() => onTab("About")}
      >
        {p.shortBio ? (
          <ClampedText text={p.shortBio} />
        ) : (
          <ProfileEmpty
            title="No summary yet"
            body={
              owner
                ? "Say what you do and who you do it for."
                : "This professional has not written a summary yet."
            }
            cta={owner ? { label: "Write a summary", to: "/profile/edit" } : undefined}
          />
        )}
      </StackSection>

      {p.featured ? (
        <StackSection title="Featured" editTo={edit}>
          <FeaturedCard featured={p.featured} />
        </StackSection>
      ) : null}

      {p.genres.length || p.instruments.length || p.languages.length ? (
        <StackSection title="Music identity" editTo={edit} collapsible>
          <ChipGroupList>
            <ChipGroup label="Genres" icon={Music} items={p.genres} />
            <ChipGroup label="Instruments" icon={Guitar} items={p.instruments} />
            <ChipGroup label="Languages" icon={Languages} items={p.languages} />
          </ChipGroupList>
        </StackSection>
      ) : null}

      <StackSection
        title="Audio"
        editTo={edit}
        {...(p.audio.length > 2
          ? { showAll: `Show all ${p.audio.length} tracks`, onShowAll: () => onTab("Portfolio") }
          : {})}
      >
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
        ) : (
          <ProfileEmpty
            title="No audio yet"
            body="This professional has not added audio samples yet."
            cta={owner ? addWork("Add audio", "track") : undefined}
          />
        )}
      </StackSection>

      {p.projects.length ? (
        <StackSection
          title="Projects"
          editTo={edit}
          collapsible
          {...(p.projects.length > 2
            ? {
                showAll: `Show all ${p.projects.length} projects`,
                onShowAll: () => onTab("Projects"),
              }
            : {})}
        >
          <div className="space-y-2">
            {p.projects.slice(0, 2).map((project) => (
              <ProjectCard key={project.id} p={project} />
            ))}
          </div>
        </StackSection>
      ) : null}

      {p.services.length ? (
        <StackSection
          title="Services"
          editTo={edit}
          collapsible
          showAll="All services"
          onShowAll={() => onTab("Services")}
        >
          <ServiceCard s={p.services[0]!} onEnquire={onHire} />
        </StackSection>
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
}: {
  p: PersonProfile;
  playingId: string | null;
  onToggleTrack: (id: string) => void;
  owner: boolean;
}) {
  const [layout, setLayout] = useState<"grid" | "rows">("grid");
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
              <LayoutGrid size={16} aria-hidden />
            </IconBtn>
            <IconBtn
              label="Row view"
              variant={layout === "rows" ? "outline" : "ghost"}
              className="h-10 w-10"
              onClick={() => setLayout("rows")}
            >
              <Rows3 size={16} aria-hidden />
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
      {/* Gallery shows only for profiles that already have images (owner, 15 Sep); there is no upload. */}
      {p.gallery.length ? (
        <ProfileSection title="Gallery">
          {layout === "grid" ? (
            <GalleryGrid images={p.gallery} />
          ) : (
            <div className="space-y-3">
              {p.gallery.map((image) => (
                <img
                  key={image}
                  src={image}
                  alt=""
                  loading="lazy"
                  className="h-56 w-full rounded-lg object-cover"
                />
              ))}
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
              <article
                key={release.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
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
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
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
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{p.longBio}</p>
          </div>
        ) : (
          <ProfileEmpty title="No bio yet" body="This professional has not written a bio yet." />
        )}
      </ProfileSection>
      <ProfileSection title="Professional details">
        {p.professional.length ? (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
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
        {p.specialisations.length ||
        p.influences.length ||
        p.instruments.length ||
        p.languages.length ? (
          <ChipGroupList>
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
            icon={<Users size={16} />}
            label="Connections"
            value={p.stats.connections}
          />
          <IdentityFact icon={<Globe2 size={16} />} label="Followers" value={p.stats.followers} />
          <IdentityFact icon={<MapPin size={16} />} label="Location" value={p.location || "—"} />
          <IdentityFact
            icon={<Clock3 size={16} />}
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
            <Star size={15} className="fill-foreground" aria-hidden />
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
      <div className="mt-5 rounded-lg border border-border bg-card p-4">
        <p className="text-1 text-muted-foreground">
          {owner
            ? "Ask the people you have worked with to review you. Requests go out from Reviews."
            : `You can review ${p.name || "this profile"} once a booking, order or rental with them is complete. It stays open for 14 days.`}
        </p>
        <BtnLink to="/reviews" variant="outline" className="mt-3 w-full">
          {owner ? "Request a review" : "Write a review"}
        </BtnLink>
      </div>
    </>
  );
}

function IdentityFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-subtle text-foreground">
        {icon}
      </span>
      <p className="pill mt-3 bg-subtle text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-1 font-semibold">{value}</p>
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
          <Link
            to={p.studio.to}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-subtle text-foreground">
              <Mic2 size={20} aria-hidden />
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
                amountClassName="text-1 font-semibold"
              />
            </span>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </ProfileSection>
      ) : null}
    </>
  );
}
