import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { shareUrl } from "@/lib/site";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  ClipboardList,
  ImagePlus,
  LayoutGrid,
  MessageSquare,
  Music,
  Pencil,
  Plus,
  QrCode,
  Settings2,
  Share2,
  Sparkles,
  UserPlus,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  BandLiveVideoList,
  BandLiveVideoRail,
  BandLiveVideoSheet,
  BandReleaseSheet,
  BandRiderCard,
  BandShowcaseEditor,
  BandStagePlotCard,
  RemoveReleaseButton,
} from "@/components/ml/band-sections";
import {
  Screen,
  TopBar,
  Btn,
  BtnLink,
  IconBtn,
  IconBtnLink,
  VerifiedBadge,
} from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Price, Row } from "@/components/ml/kit";
import { CoverHero, ImagePickButton, StackSection } from "@/components/ml/profile";
import { GalleryView } from "@/components/ml/gallery";
import { SectionTabs, StateIcon, type Move, type SolidIcon } from "@/components/ml/tab-icon";
import { bandRoleCopy } from "@/data/band";
import { useAuth } from "@/hooks/use-auth";
import { bandViewFromRow, loadBand } from "@/lib/band-view";
import { setCollabImage } from "@/lib/collabs.functions";
import { uploadProfileImage, type ProfileImageKind } from "@/lib/profile-images";
import { shareLink } from "@/lib/booking-actions";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { joinParts } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

type BandTab = "Overview" | "Members" | "Shows" | "Music";

const tabKeys: readonly BandTab[] = ["Overview", "Members", "Shows", "Music"];

export const Route = createFileRoute("/bands/$id/")({
  // The id is the band's slug. A band is a group of talent profiles, not an account.
  // ?tab=Music opens that tab (the old /bands/$id/portfolio lands here).
  validateSearch: (s: Record<string, unknown>): { tab?: BandTab } =>
    tabKeys.includes(s["tab"] as BandTab) ? { tab: s["tab"] as BandTab } : {},
  loader: ({ params }) => loadBand(params.id),
  head: ({ params }) => ({
    meta: [
      { title: `Band profile | MusicLinkd` },
      {
        name: "description",
        content: `Line-up, releases, shows and open seats for ${params.id} on MusicLinkd.`,
      },
      { property: "og:title", content: "Band profile | MusicLinkd" },
      { property: "og:description", content: "Line-up, releases, shows and open seats." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BandProfile,
});

/** The profiles' section row: icon alone until selected, then solid with its move. */
const tabs: { key: BandTab; icon: LucideIcon; solid: SolidIcon; move: Move }[] = [
  { key: "Overview", icon: Sparkles, solid: "sparkle", move: "spin" },
  { key: "Members", icon: UsersRound, solid: "person", move: "dance" },
  { key: "Shows", icon: CalendarDays, solid: "check", move: "stamp" },
  { key: "Music", icon: Music, solid: "music", move: "beat" },
];

type Sheet = "release" | "live" | null;

function BandProfile() {
  const { band: row, labels } = Route.useLoaderData();
  const search = Route.useSearch();
  const { user } = useAuth();
  const band = row ? bandViewFromRow(row, labels, user?.id ?? null) : undefined;
  const [tab, setTab] = useState<BandTab>(search.tab ?? "Overview");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [following, setFollowing] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const saveImage = useServerFn(setCollabImage);

  if (!band) {
    return (
      <Screen>
        <TopBar title="Band" back="/bands" />
        <div className="px-5 pt-8">
          <EmptyState
            title="This band is no longer available"
            body="It may have been deleted or made private by its owner."
          >
            <BtnLink to="/bands" className="w-full">
              Back to Bands
            </BtnLink>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  const owner = band.owner;
  const share = () => void shareLink({ title: band.name, url: shareUrl(`/bands/${band.id}`) });

  function onToggleFollow() {
    if (!band) return;
    if (!user) {
      toast.info("Please sign in to follow this band.");
      return;
    }
    const next = !following;
    setFollowing(next);
    toast.success(next ? `Now following ${band.name}` : `Unfollowed ${band.name}`);
  }

  const bandStructuredData = band
    ? {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        name: band.name,
        description: band.bio || band.tagline,
        image: band.avatar || band.cover,
        genre: band.genres,
        location: band.city
          ? {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressLocality: band.city,
                addressCountry: "IN",
              },
            }
          : undefined,
        member: band.members.map((m) => ({
          "@type": "Person",
          name: m.name,
          roleName: m.instrument || m.role,
        })),
      }
    : null;

  // Banner and picture: uploaded to the signed-in manager's folder, then saved on the band.
  async function pickImage(which: ProfileImageKind, file: File) {
    if (!band) return;
    try {
      const url = await uploadProfileImage(which, file);
      await saveImage({ data: { id: band.dbId, kind: which, url } });
      await router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "That didn't upload. Try again.");
    }
  }

  return (
    <Screen>
      {bandStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bandStructuredData) }}
        />
      ) : null}
      {/* The profiles' header: cover at the top, the band's square picture over it, the name once. */}
      <CoverHero
        cover={band.cover || undefined}
        photo={band.avatar || undefined}
        name={band.name}
        square
        back="/bands"
        actions={
          <>
            <Link
              to="/identity/qr"
              aria-label="Band QR"
              className="grid h-10 w-10 place-items-center rounded-full bg-card/90"
            >
              <QrCode size={iconSize.sm} aria-hidden />
            </Link>
            {owner ? (
              <>
                <ImagePickButton
                  kind="cover"
                  label="Change banner"
                  className="h-10 w-10 bg-card/90 text-foreground"
                  onPick={pickImage}
                >
                  <ImagePlus size={iconSize.sm} aria-hidden />
                </ImagePickButton>
                <Link
                  to="/bands/$id/manage"
                  params={{ id: band.id }}
                  aria-label="Manage band"
                  className="grid h-10 w-10 place-items-center rounded-full bg-card/90"
                >
                  <Settings2 size={iconSize.sm} aria-hidden />
                </Link>
              </>
            ) : (
              <SavedToggle targetType="band" targetId={band.dbId} size={40} />
            )}
          </>
        }
        photoPick={
          owner ? (
            <ImagePickButton
              kind="avatar"
              label="Change picture"
              className="absolute -bottom-1 -left-1 h-9 w-9 border border-border bg-card text-foreground"
              onPick={pickImage}
            >
              <Camera size={iconSize.sm} aria-hidden />
            </ImagePickButton>
          ) : null
        }
        title={
          <div className="mt-3 flex items-center gap-1.5">
            <h1 className="text-3 leading-tight">{band.name}</h1>
            {band.verified ? <VerifiedBadge /> : null}
          </div>
        }
      >
        {band.subtitle ? (
          <p className="mt-0.5 text-1 text-muted-foreground">{band.subtitle}</p>
        ) : null}
        {band.tagline ? (
          <p className="mt-1.5 text-1 text-muted-foreground">{band.tagline}</p>
        ) : null}
      </CoverHero>

      <div className="px-5 pt-4 pb-4">
        {/* The profiles' action row: one primary, the rest outline icon buttons. */}
        {owner ? (
          <div className="flex items-center gap-2">
            <IconBtnLink
              to="/bands/$id/manage"
              params={{ id: band.id }}
              label="Manage"
              variant="ink"
              className="h-11 w-11"
            >
              <Pencil size={iconSize.md} aria-hidden />
            </IconBtnLink>
            <IconBtnLink
              to="/bands/$id/invite"
              params={{ id: band.id }}
              label="Invite"
              variant="outline"
              className="h-11 w-11"
            >
              <UserPlus size={iconSize.md} aria-hidden />
            </IconBtnLink>
            <IconBtnLink to="/bookings" label="Book" variant="outline" className="h-11 w-11">
              <CalendarDays size={iconSize.md} aria-hidden />
            </IconBtnLink>
            <IconBtn label="Share" variant="outline" className="h-11 w-11" onClick={share}>
              <Share2 size={iconSize.md} aria-hidden />
            </IconBtn>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <BtnLink
              to="/bands/$id/contact"
              params={{ id: band.id }}
              variant="outline"
              className="min-w-0 flex-1 px-3"
              icon={<MessageSquare size={iconSize.sm} aria-hidden />}
            >
              Message
            </BtnLink>
            <BtnLink
              to="/bookings"
              className="min-w-0 flex-1 px-3"
              icon={<CalendarDays size={iconSize.sm} aria-hidden />}
            >
              Book
            </BtnLink>
            <IconBtn label="Share" variant="outline" className="h-12 w-12" onClick={share}>
              <Share2 size={iconSize.md} aria-hidden />
            </IconBtn>
            <IconBtn
              label={following ? "Following" : "Follow"}
              variant={following ? "ghost" : "outline"}
              className="h-12 w-12"
              onClick={onToggleFollow}
            >
              <StateIcon
                outline={Plus}
                solid="check"
                active={following}
                size={iconSize.md}
                move="stamp"
              />
            </IconBtn>
          </div>
        )}
      </div>

      <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Band sections" />

      <div className="px-5">
        <div className="mt-4 space-y-3 pb-4">
          {tab === "Overview" ? (
            <>
              {band.bio || band.availability || band.rate ? (
                <Card>
                  <h2 className="text-sm">About</h2>
                  {band.bio ? (
                    <p className="mt-2 text-1 text-muted-foreground">{band.bio}</p>
                  ) : null}
                  {band.availability || band.rate ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {band.availability ? (
                        <StatusPill
                          label={band.availability}
                          tone={band.availability === "Available" ? "good" : "warn"}
                        />
                      ) : null}
                      <Price price={band.rate} amountClassName="text-sm font-semibold" />
                    </div>
                  ) : null}
                </Card>
              ) : null}
              {/* The band's photos: visitors see them once there are some; managers edit them. */}
              {owner ? (
                <StackSection title="Showcase">
                  <BandShowcaseEditor bandId={band.dbId} title={`${band.name} showcase`} />
                </StackSection>
              ) : band.gallery.length ? (
                <StackSection title="Showcase">
                  <GalleryView images={band.gallery} title={`${band.name} showcase`} />
                </StackSection>
              ) : null}
              {band.lookingFor.length ? (
                <Card>
                  <h2 className="text-sm">Open seats</h2>
                  <div className="mt-3 space-y-2">
                    {band.lookingFor.map((l) => (
                      <Row key={l} title={l} subtitle="Apply through Messaging" to="/messages" />
                    ))}
                  </div>
                </Card>
              ) : null}
              {/* Band Pulse Bento Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Cell 1: Next Show */}
                <button
                  type="button"
                  onClick={() => setTab("Shows")}
                  className="rounded-lg border border-border/80 bg-card p-3.5 text-left transition-all hover:border-foreground/30 active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-1 font-semibold text-foreground">
                      <CalendarDays size={15} className="text-foreground" aria-hidden />
                      Next show
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground" aria-hidden />
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground truncate">
                    {band.nextShow || "Touring soon"}
                  </p>
                  <p className="mt-0.5 text-1 text-muted-foreground">View dates & tickets</p>
                </button>

                {/* Cell 2: Lineup */}
                <button
                  type="button"
                  onClick={() => setTab("Members")}
                  className="rounded-lg border border-border/80 bg-card p-3.5 text-left transition-all hover:border-foreground/30 active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-1 font-semibold text-foreground">
                      <UsersRound size={15} className="text-foreground" aria-hidden />
                      Lineup
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground" aria-hidden />
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground">
                    {band.members.length} members
                  </p>
                  <div className="mt-1 flex -space-x-1.5 overflow-hidden">
                    {band.members
                      .slice(0, 4)
                      .map((m) =>
                        m.photo ? (
                          <img
                            key={m.key}
                            src={sized(m.photo, { width: 20 })}
                            alt=""
                            className="inline-block h-5 w-5 rounded-full ring-1 ring-card object-cover"
                          />
                        ) : (
                          <span
                            key={m.key}
                            className="inline-block h-5 w-5 rounded-full bg-subtle ring-1 ring-card"
                          />
                        ),
                      )}
                  </div>
                </button>

                {/* Cell 3: Booking & Rate */}
                <div className="rounded-lg border border-border/80 bg-card p-3.5">
                  <span className="text-1 font-semibold text-foreground">Booking rate</span>
                  <div className="mt-2">
                    {band.rate ? (
                      <Price price={band.rate} amountClassName="text-2 font-bold text-foreground" />
                    ) : (
                      <span className="text-sm font-bold text-foreground">On enquiry</span>
                    )}
                  </div>
                  {band.availability ? (
                    <div className="mt-1.5">
                      <StatusPill
                        label={band.availability}
                        tone={band.availability === "Available" ? "good" : "warn"}
                      />
                    </div>
                  ) : null}
                </div>

                {/* Cell 4: Music & Portfolio */}
                <button
                  type="button"
                  onClick={() => setTab("Music")}
                  className="rounded-lg border border-border/80 bg-card p-3.5 text-left transition-all hover:border-foreground/30 active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-1 font-semibold text-foreground">
                      <Music size={15} className="text-foreground" aria-hidden />
                      Discography
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground" aria-hidden />
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground">
                    {band.releases.length} releases
                  </p>
                  <p className="mt-0.5 text-1 text-muted-foreground">
                    {band.portfolioCount ? `${band.portfolioCount} shared works` : "Stream in-app"}
                  </p>
                </button>
              </div>
              {/* Live videos, rider and stage plot: hidden while empty, an Add row for managers. */}
              {band.liveVideos.length ? (
                <section>
                  <h2 className="mb-2 mt-2 text-sm">Live performance videos</h2>
                  <BandLiveVideoRail videos={band.liveVideos} />
                </section>
              ) : owner ? (
                <Row
                  icon={<Video size={iconSize.sm} />}
                  title="Live performance videos"
                  subtitle="Add a link to a live set"
                  onClick={() => setSheet("live")}
                />
              ) : null}
              {band.rider.length ? (
                <BandRiderCard lines={band.rider} />
              ) : owner ? (
                <Row
                  icon={<ClipboardList size={iconSize.sm} />}
                  title="Technical rider"
                  subtitle="Add backline, inputs, monitors and power"
                  onClick={() =>
                    void navigate({
                      to: "/bands/$id/manage",
                      params: { id: band.id },
                      search: { edit: "rider" },
                    })
                  }
                />
              ) : null}
              {band.stagePlot ? (
                <BandStagePlotCard plot={band.stagePlot} bandName={band.name} />
              ) : owner ? (
                <Row
                  icon={<LayoutGrid size={iconSize.sm} />}
                  title="Stage plot"
                  subtitle="Add an image of your stage layout"
                  onClick={() =>
                    void navigate({
                      to: "/bands/$id/manage",
                      params: { id: band.id },
                      search: { edit: "stage-plot" },
                    })
                  }
                />
              ) : null}
            </>
          ) : null}

          {tab === "Members"
            ? band.members.map((m) => {
                const card = (
                  <Card className="flex items-center gap-3 py-3">
                    {m.photo ? (
                      <img
                        src={sized(m.photo, { width: 48 })}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div aria-hidden className="h-12 w-12 shrink-0 rounded-full bg-background" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold">{m.name}</p>
                        {m.verified ? <VerifiedBadge size={12} /> : null}
                      </div>
                      {m.detail ? (
                        <p className="truncate text-1 text-muted-foreground">{m.detail}</p>
                      ) : null}
                    </div>
                    <StatusPill
                      label={bandRoleCopy[m.role].label}
                      tone={m.role === "owner" ? "brand" : "neutral"}
                    />
                  </Card>
                );
                // A member whose profile has no username has no page to open.
                return m.username ? (
                  <Link
                    key={m.key}
                    to="/profile/$username"
                    params={{ username: m.username }}
                    className="block"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={m.key}>{card}</div>
                );
              })
            : null}

          {tab === "Shows" ? (
            <Row
              title="Shows and opportunities"
              subtitle="Every date, plus gigs looking for a band"
              to="/bands/$id/events"
              params={{ id: band.id }}
            />
          ) : null}

          {tab === "Shows" ? (
            band.events.length ? (
              band.events.map((e) => (
                <Card key={e.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm">{e.title}</h3>
                      {e.place ? (
                        <p className="mt-1 truncate text-1 text-muted-foreground">{e.place}</p>
                      ) : null}
                      {e.date ? (
                        <p className="mt-1 text-1 font-semibold text-foreground">{e.date}</p>
                      ) : null}
                    </div>
                    {e.status ? (
                      <StatusPill
                        label={
                          e.status === "confirmed"
                            ? "Confirmed"
                            : e.status === "hold"
                              ? "On hold"
                              : "Past"
                        }
                        tone={
                          e.status === "confirmed"
                            ? "good"
                            : e.status === "hold"
                              ? "warn"
                              : "neutral"
                        }
                      />
                    ) : null}
                  </div>
                  {e.ticketNote ? (
                    <p className="mt-3 text-1 text-muted-foreground">{e.ticketNote}</p>
                  ) : null}
                </Card>
              ))
            ) : (
              <EmptyState title="No shows yet" body="Confirmed and held dates will appear here." />
            )
          ) : null}

          {/* The band portfolio, on the page: its discography, then its live work. */}
          {tab === "Music" ? (
            <>
              <section>
                <h2 className="mb-2 mt-2 text-sm">Discography</h2>
                {band.releases.length ? (
                  <div className="space-y-3">
                    {band.releases.map((r) => (
                      <Card key={r.id}>
                        <div className="flex items-center gap-3">
                          {r.cover ? (
                            <img
                              src={sized(r.cover, { width: 56 })}
                              alt=""
                              className="h-14 w-14 rounded-sm object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              aria-hidden
                              className="h-14 w-14 shrink-0 rounded-sm bg-background"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {r.title}
                            </p>
                            <p className="truncate text-1 font-medium text-muted-foreground">
                              {joinParts(r.kind, r.year ? String(r.year) : "")}
                            </p>
                          </div>
                          {owner ? <RemoveReleaseButton releaseId={r.id} title={r.title} /> : null}
                        </div>
                      </Card>
                    ))}
                    {owner ? (
                      <Btn variant="outline" className="w-full" onClick={() => setSheet("release")}>
                        Add a release
                      </Btn>
                    ) : null}
                  </div>
                ) : owner ? (
                  <EmptyState
                    title="No releases yet"
                    body="Add the band's EPs, singles and albums so bookers can hear you."
                  >
                    <Btn onClick={() => setSheet("release")}>Add a release</Btn>
                  </EmptyState>
                ) : (
                  <EmptyState
                    title="No releases yet"
                    body="The band's releases will appear here."
                  />
                )}
              </section>

              <section className="space-y-3">
                <h2 className="mb-2 mt-4 text-sm">Live videos</h2>
                {/* Adding live work is for the band's owner and admins. */}
                {owner ? (
                  <Card>
                    <p className="text-sm font-semibold">Live recordings and sets</p>
                    <p className="mt-1 text-1 text-muted-foreground">
                      A single well-shot live video does more for a booking than five studio demos.
                      Add one set video and a photo from the room.
                    </p>
                    <Btn variant="outline" className="mt-3 w-full" onClick={() => setSheet("live")}>
                      Add live work
                    </Btn>
                  </Card>
                ) : null}
                {band.liveVideos.length ? (
                  <BandLiveVideoList videos={band.liveVideos} canManage={owner} />
                ) : (
                  <EmptyState
                    title="Nothing live yet"
                    body="Upload a set video or link one from YouTube."
                  />
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>

      {/* Mounted only while open, so each opening starts empty. */}
      {sheet === "release" ? (
        <BandReleaseSheet bandId={band.dbId} open onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "live" ? (
        <BandLiveVideoSheet bandId={band.dbId} open onClose={() => setSheet(null)} />
      ) : null}
    </Screen>
  );
}
