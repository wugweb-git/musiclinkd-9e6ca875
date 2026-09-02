import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, MessageSquare, QrCode, Settings2, Share2, UserPlus } from "lucide-react";
import { Screen, TopBar, Btn, VerifiedBadge } from "@/components/ml/ui";
import { Card, Segmented, StatusPill, EmptyState, Row } from "@/components/ml/kit";
import { getBand, myBandId, bandRoleCopy } from "@/data/band";

export const Route = createFileRoute("/bands/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Band profile | MusicLinkd` },
      { name: "description", content: `Line-up, releases, shows and open seats for ${params.id} on MusicLinkd.` },
      { property: "og:title", content: "Band profile | MusicLinkd" },
      { property: "og:description", content: "Line-up, releases, shows and open seats." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BandProfile,
});

const tabs = ["Overview", "Members", "Shows", "Music"] as const;

function BandProfile() {
  const { id } = Route.useParams();
  const band = getBand(id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  if (!band) {
    return (
      <Screen>
        <TopBar title="Band" back="/bands" />
        <div className="px-5 pt-8">
          <EmptyState title="This band is no longer available" body="It may have been deleted or made private by its owner.">
            <Link to="/bands"><Btn className="w-full">Back to bands</Btn></Link>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  const owner = band.id === myBandId;

  return (
    <Screen>
      <TopBar title={band.name} back="/bands" right={<Link to="/identity/qr" aria-label="Band QR" className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle"><QrCode size={18} aria-hidden /></Link>} />
      <img src={band.cover} alt="" className="h-40 w-full object-cover" />
      <div className="px-5">
        <div className="-mt-10 flex items-end gap-3">
          <img src={band.avatar} alt="" className="h-20 w-20 shrink-0 rounded-3xl border-4 border-background object-cover" />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-[22px] leading-tight">{band.name}</h1>
              {band.verified ? <VerifiedBadge /> : null}
            </div>
            <p className="truncate text-[12px] text-muted-foreground">{band.genres.join(" · ")} · {band.city} · since {band.formed}</p>
          </div>
        </div>

        <p className="mt-3 text-[13px] text-text2">{band.tagline}</p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {owner ? (
            <>
              <Link to="/bands/$id/manage" params={{ id: band.id }} className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground"><Settings2 size={14} aria-hidden />Manage</Link>
              <Link to="/bands/$id/invite" params={{ id: band.id }} className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-subtle px-2 text-xs font-semibold text-text2"><UserPlus size={14} aria-hidden />Invite</Link>
            </>
          ) : (
            <>
              <Btn className="col-span-1 min-w-0 gap-1 px-2 text-xs">Follow</Btn>
              <Link to="/messages" className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-subtle px-2 text-xs font-semibold text-text2"><MessageSquare size={14} aria-hidden />Message</Link>
            </>
          )}
          <Link to="/booking" className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-navy px-2 text-xs font-semibold text-background"><CalendarDays size={14} aria-hidden />Book</Link>
          <Link to="/identity/card" className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-subtle px-2 text-xs font-semibold text-text2"><Share2 size={14} aria-hidden />Share</Link>
        </div>

        <div className="mt-5"><Segmented value={tab} options={tabs} onChange={setTab} /></div>

        <div className="mt-4 space-y-3 pb-4">
          {tab === "Overview" ? (
            <>
              <Card>
                <h2 className="text-[15px]">About</h2>
                <p className="mt-2 text-[13px] text-text2">{band.bio}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill label={band.availability} tone={band.availability === "Available" ? "good" : "warn"} />
                  <StatusPill label={band.rate} tone="brand" />
                </div>
              </Card>
              {band.lookingFor.length ? (
                <Card>
                  <h2 className="text-[15px]">Open seats</h2>
                  <div className="mt-3 space-y-2">
                    {band.lookingFor.map((l) => (
                      <Row key={l} title={l} subtitle="Apply through Messaging" to="/messages" />
                    ))}
                  </div>
                </Card>
              ) : null}
              <Row icon={<CalendarDays size={16} />} title="Next show" subtitle={`${band.events[0]?.title ?? "No shows scheduled"} · ${band.events[0]?.date ?? ""}`} onClick={() => setTab("Shows")} />
              <Row title="Band portfolio" subtitle={band.portfolioItemIds.length ? `${band.portfolioItemIds.length} shared work items` : "No shared work yet"} to="/portfolio" />
            </>
          ) : null}

          {tab === "Members" ? (
            band.members.map((m) => (
              <Link key={m.userId} to="/profile/$username" params={{ username: m.userId }} className="block">
                <Card className="flex items-center gap-3 py-3">
                  <img src={m.photo} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      {m.verified ? <VerifiedBadge size={13} /> : null}
                    </div>
                    <p className="truncate text-[12px] text-muted-foreground">{m.instrument} · since {m.since}</p>
                  </div>
                  <StatusPill label={bandRoleCopy[m.role].label} tone={m.role === "owner" ? "brand" : "neutral"} />
                </Card>
              </Link>
            ))
          ) : null}

          {tab === "Shows" ? (
            band.events.length ? (
              band.events.map((e) => (
                <Card key={e.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px]">{e.title}</h3>
                      <p className="mt-1 truncate text-[12px] text-muted-foreground">{e.venue} · {e.city}</p>
                      <p className="mt-1 text-[12px] font-semibold text-primary">{e.date}</p>
                    </div>
                    <StatusPill label={e.status === "confirmed" ? "Confirmed" : e.status === "hold" ? "On hold" : "Past"} tone={e.status === "confirmed" ? "good" : e.status === "hold" ? "warn" : "neutral"} />
                  </div>
                  {e.ticketNote ? <p className="mt-3 text-[12px] text-text2">{e.ticketNote}</p> : null}
                </Card>
              ))
            ) : (
              <EmptyState title="No shows yet" body="Confirmed and held dates will appear here." />
            )
          ) : null}

          {tab === "Music" ? (
            band.releases.length ? (
              <div className="grid grid-cols-2 gap-3">
                {band.releases.map((r) => (
                  <article key={r.id} className="overflow-hidden rounded-[24px] border border-border bg-card">
                    <img src={r.cover} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                    <div className="p-3">
                      <h3 className="truncate text-[13px]">{r.title}</h3>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{r.kind} · {r.year}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No releases yet" body="Add band work from your portfolio.">
                <Link to="/portfolio"><Btn variant="outline" className="w-full">Open portfolio</Btn></Link>
              </EmptyState>
            )
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
