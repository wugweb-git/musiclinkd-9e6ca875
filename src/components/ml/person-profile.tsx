import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  FolderKanban,
  Globe2,
  Languages,
  LifeBuoy,
  MapPin,
  Mic2,
  Pencil,
  Play,
  Settings2,
  QrCode,
  Share2,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import type { PersonProfile } from "@/data/profile";
import { profileInsights, profileCompletion } from "@/data/profile";
import { Btn, Chip, Screen } from "./ui";
import {
  AudioTrackCard,
  CollaboratorCard,
  CompletionCard,
  ExperienceCard,
  FeaturedCard,
  GalleryGrid,
  MarketEntryCard,
  MoreSheet,
  OpportunityCard,
  ProfileEmpty,
  ProfileHero,
  ProfileSection,
  ProjectCard,
  ReviewCard,
  ServiceCard,
  ShareSheet,
  SocialLinks,
  VideoCard,
  ChipGroup,
  InfoRow,
  StatRow,
} from "./profile";
import { HireModal } from "./hire-modal";

type ProfileTab = "Overview" | "Portfolio" | "Projects" | "Services" | "About";

const tabs: ProfileTab[] = ["Overview", "Portfolio", "Projects", "Services", "About"];

export function PersonProfileExperience({
  p,
  owner = false,
}: {
  p: PersonProfile;
  owner?: boolean;
}) {
  const [tab, setTab] = useState<ProfileTab>("Overview");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const toggleTrack = (id: string) => setPlayingId((current) => (current === id ? null : id));

  return (
    <Screen>
      <ProfileHero
        p={p}
        owner={owner}
        back={owner ? undefined : "/"}
        onShare={() => setShareOpen(true)}
        onMore={owner ? undefined : () => setMoreOpen(true)}
      />

      <div className="px-5 pt-4">
        {owner ? (
          <OwnerActions
            onShare={() => setShareOpen(true)}
            onInsights={() => setInsightsOpen((open) => !open)}
          />
        ) : (
          <ViewerActions onHire={() => setHireOpen(true)} />
        )}
        <StatRow p={p} />
      </div>

      {owner ? <OwnerPanel p={p} insightsOpen={insightsOpen} /> : null}

      <nav
        aria-label="Profile sections"
        className="rail sticky top-0 z-20 mt-5 flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-5 py-3 backdrop-blur no-scrollbar"
      >
        {tabs.map((item) => (
          <Chip key={item} active={tab === item} onClick={() => setTab(item)}>
            {item}
          </Chip>
        ))}
      </nav>

      <main className="px-5 pb-8">
        {tab === "Overview" ? (
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
        {tab === "Services" ? (
          <Services p={p} onHire={() => setHireOpen(true)} owner={owner} />
        ) : null}
        {tab === "About" ? <About p={p} /> : null}
      </main>

      <ShareSheet p={p} open={shareOpen} onClose={() => setShareOpen(false)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} name={p.name} />
      <HireModal
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        subject={{ name: p.name, detail: [p.primaryRole, p.location].filter(Boolean).join(" · ") }}
      />
    </Screen>
  );
}

function ViewerActions({ onHire }: { onHire: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Btn variant="ink" className="min-w-0 px-2 text-xs" onClick={() => undefined}>
        Connect
      </Btn>
      <Link
        to="/messages"
        className="inline-flex min-h-12 min-w-0 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground"
      >
        Message
      </Link>
      <Btn variant="outline" className="min-w-0 px-2 text-xs" onClick={onHire}>
        Hire
      </Btn>
      <Btn variant="ghost" className="min-w-0 px-2 text-xs" onClick={() => undefined}>
        Follow
      </Btn>
    </div>
  );
}

function OwnerActions({ onShare, onInsights }: { onShare: () => void; onInsights: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Link
        to="/profile/edit"
        className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground"
      >
        <Pencil size={14} aria-hidden />
        Edit
      </Link>
      <Btn variant="outline" className="min-w-0 gap-1 px-2 text-xs" onClick={onShare}>
        <Share2 size={14} aria-hidden />
        Share
      </Btn>
      <Btn variant="ink" className="min-w-0 gap-1 px-2 text-xs" onClick={onInsights}>
        <BarChart3 size={14} aria-hidden />
        Stats
      </Btn>
      <Link
        to="/profile/$username"
        params={{ username: "rahul-iyer" }}
        className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-subtle px-2 text-xs font-semibold text-muted-foreground"
      >
        <ExternalLink size={14} aria-hidden />
        Public
      </Link>
    </div>
  );
}

function OwnerPanel({ p, insightsOpen }: { p: PersonProfile; insightsOpen: boolean }) {
  return (
    <section className="space-y-3 px-5 pt-5">
      <CompletionCard percent={profileCompletion.percent} missing={profileCompletion.missing} />
      <div className="grid grid-cols-2 gap-2">
        <OwnerLink to="/profile/edit" icon={<FolderKanban size={16} />} label="Manage portfolio" />
        <OwnerLink
          to="/profile/edit"
          icon={<BriefcaseBusiness size={16} />}
          label="Manage services"
        />
        <OwnerLink to="/profile/edit" icon={<Clock3 size={16} />} label="Availability" />
        <OwnerLink to="/identity/qr" icon={<QrCode size={16} />} label="My QR & digital ID" />
        <OwnerLink to="/verification" icon={<BadgeCheck size={16} />} label="Verification" />
        <OwnerLink to="/reviews" icon={<Star size={16} />} label="Reviews" />
        <OwnerLink to="/bands" icon={<Users size={16} />} label="My bands" />
        <OwnerLink to="/plans" icon={<CreditCard size={16} />} label="Plan & earnings" />
        <OwnerLink to="/recommendations" icon={<Sparkles size={16} />} label="For you" />
        <OwnerLink to="/help" icon={<LifeBuoy size={16} />} label="Help & guides" />
        <OwnerLink to="/profile/edit" icon={<Settings2 size={16} />} label="Profile settings" />
      </div>

      {insightsOpen ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-1 font-bold uppercase tracking-wide text-muted-foreground">
                Profile insights
              </p>
              <h2 className="mt-1 text-2">{profileInsights.range}</h2>
            </div>
            <BarChart3 size={18} className="text-primary" aria-hidden />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {profileInsights.headline.map((item) => (
              <div key={item.label} className="rounded-lg bg-subtle p-3">
                <p className="text-1 text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-bold">{item.value}</p>
                <p className="text-1 font-semibold text-primary">{item.delta}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

type OwnerDestination =
  | "/profile/edit"
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
      className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-xs font-semibold"
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
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              onClick={() => onTab("About")}
            >
              Read full profile <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        ) : (
          <ProfileEmpty
            title="No summary yet"
            body="This professional has not written a summary yet."
            cta={owner ? "Write a summary" : undefined}
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
          <div className="space-y-3">
            <ChipGroup label="Genres" items={p.genres} tone="pink" />
            <div className="grid grid-cols-2 gap-3">
              <ChipGroup label="Instruments" items={p.instruments} />
              <ChipGroup label="Languages" items={p.languages} />
            </div>
          </div>
        </ProfileSection>
      ) : null}
      {p.audio.length ? (
        <ProfileSection
          title="Audio portfolio"
          action="View all"
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
            cta={owner ? "Add audio" : undefined}
          />
        </ProfileSection>
      )}
      {p.projects.length ? (
        <ProfileSection
          title="Selected projects"
          action="View all"
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
  return (
    <>
      <ProfileSection title="Audio">
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
              cta={owner ? "Add track" : undefined}
            />
          )}
        </div>
      </ProfileSection>
      <ProfileSection title="Video">
        <div className="rail flex gap-3 overflow-x-auto no-scrollbar">
          {p.video.length ? (
            p.video.map((video) => <VideoCard key={video.id} v={video} />)
          ) : (
            <div className="w-full">
              <ProfileEmpty
                title="No videos yet"
                body="Performance and studio videos will appear here."
                cta={owner ? "Add video" : undefined}
              />
            </div>
          )}
        </div>
      </ProfileSection>
      <ProfileSection title="Gallery">
        {p.gallery.length ? (
          <GalleryGrid images={p.gallery} />
        ) : (
          <ProfileEmpty
            title="No gallery images"
            body="Studio, performance and behind-the-scenes images will appear here."
            cta={owner ? "Add images" : undefined}
          />
        )}
      </ProfileSection>
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
            cta={owner ? "Add project" : undefined}
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
                <img
                  src={release.cover}
                  alt={release.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <div className="p-3">
                  <h3 className="truncate text-1">{release.title}</h3>
                  <p className="mt-1 truncate text-1 text-muted-foreground">
                    {release.kind} · {release.year}
                  </p>
                  <p className="mt-1 truncate text-1 font-semibold text-primary">{release.label}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ProfileEmpty
            title="No releases yet"
            body="Discography and credited releases will appear here."
            cta={owner ? "Add release" : undefined}
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
          <ProfileEmpty
            title="No credits yet"
            body="Professional experience will appear here."
            cta={owner ? "Add experience" : undefined}
          />
        )}
      </ProfileSection>
    </>
  );
}

function Services({ p, onHire, owner }: { p: PersonProfile; onHire: () => void; owner: boolean }) {
  return (
    <ProfileSection title="Services">
      <div className="space-y-3">
        {p.services.length ? (
          p.services.map((service) => (
            <ServiceCard key={service.id} s={service} onEnquire={onHire} />
          ))
        ) : (
          <ProfileEmpty
            title="No services listed"
            body="This professional has not listed services yet."
            cta={owner ? "Add a service" : undefined}
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
          <div className="space-y-3">
            <ChipGroup label="Specialisations" items={p.specialisations} tone="purple" />
            <ChipGroup label="Influences" items={p.influences} />
            <div className="grid grid-cols-2 gap-3">
              <ChipGroup label="Instruments" items={p.instruments} />
              <ChipGroup label="Languages" items={p.languages} />
            </div>
          </div>
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
      <ProfileSection title="Reviews">
        {p.reviews.length ? (
          <div className="space-y-3">
            {p.reviews.map((review) => (
              <ReviewCard key={review.id} r={review} />
            ))}
          </div>
        ) : (
          <ProfileEmpty
            title="No reviews yet"
            body="Verified project and service reviews will appear here."
          />
        )}
      </ProfileSection>
    </>
  );
}

function IdentityFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-subtle text-primary">
        {icon}
      </span>
      <p className="mt-3 text-1 font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold">{value}</p>
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
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-subtle text-primary">
              <Mic2 size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{p.studio.name}</span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {p.studio.meta}
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </ProfileSection>
      ) : null}
    </>
  );
}
