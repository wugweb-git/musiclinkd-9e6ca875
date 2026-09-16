import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, MessageSquare, QrCode, Settings2, Share2, UserPlus } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, VerifiedBadge } from "@/components/ml/ui";
import { Card, Segmented, StatusPill, EmptyState, Price, Row } from "@/components/ml/kit";
import { bandRoleCopy } from "@/data/band";
import { useAuth } from "@/hooks/use-auth";
import { bandViewFromRow, loadBand } from "@/lib/band-view";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/bands/$id/")({
  // The id is the band's slug. A band is a group of talent profiles, not an account.
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

const tabs = ["Overview", "Members", "Shows", "Music"] as const;

function BandProfile() {
  const { band: row, labels } = Route.useLoaderData();
  const { user } = useAuth();
  const band = row ? bandViewFromRow(row, labels, user?.id ?? null) : undefined;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

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

  return (
    <Screen>
      <TopBar
        title={band.name}
        back="/bands"
        right={
          <Link
            to="/identity/qr"
            aria-label="Band QR"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle"
          >
            <QrCode size={18} aria-hidden />
          </Link>
        }
      />
      {band.cover ? (
        <img src={band.cover} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div aria-hidden className="h-40 w-full bg-subtle" />
      )}
      <div className="px-5">
        <div className="-mt-10 flex items-end gap-3">
          {band.avatar ? (
            <img
              src={band.avatar}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg border-4 border-background object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="h-20 w-20 shrink-0 rounded-lg border-4 border-background bg-subtle"
            />
          )}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-[22px] leading-tight">{band.name}</h1>
              {band.verified ? <VerifiedBadge /> : null}
            </div>
            {band.subtitle ? (
              <p className="truncate text-[12px] text-muted-foreground">{band.subtitle}</p>
            ) : null}
          </div>
        </div>

        {band.tagline ? (
          <p className="mt-3 text-[13px] text-muted-foreground">{band.tagline}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {owner ? (
            <>
              <Link
                to="/bands/$id/manage"
                params={{ id: band.id }}
                className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground"
              >
                <Settings2 size={14} aria-hidden />
                Manage
              </Link>
              <Link
                to="/bands/$id/invite"
                params={{ id: band.id }}
                className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-subtle px-2 text-xs font-semibold text-muted-foreground"
              >
                <UserPlus size={14} aria-hidden />
                Invite
              </Link>
            </>
          ) : (
            <>
              <Btn className="col-span-1 min-w-0 gap-1 px-2 text-xs">Follow</Btn>
              <Link
                to="/bands/$id/contact"
                params={{ id: band.id }}
                className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-subtle px-2 text-xs font-semibold text-muted-foreground"
              >
                <MessageSquare size={14} aria-hidden />
                Message
              </Link>
            </>
          )}
          <Link
            to="/bookings"
            className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-ink px-2 text-xs font-semibold text-background"
          >
            <CalendarDays size={14} aria-hidden />
            Book
          </Link>
          <Link
            to="/identity/card"
            className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-subtle px-2 text-xs font-semibold text-muted-foreground"
          >
            <Share2 size={14} aria-hidden />
            Share
          </Link>
        </div>

        <div className="mt-5">
          <Segmented value={tab} options={tabs} onChange={setTab} />
        </div>

        <div className="mt-4 space-y-3 pb-4">
          {tab === "Overview" ? (
            <>
              {band.bio || band.availability || band.rate ? (
                <Card>
                  <h2 className="text-[15px]">About</h2>
                  {band.bio ? (
                    <p className="mt-2 text-[13px] text-muted-foreground">{band.bio}</p>
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
              <Row
                icon={<CalendarDays size={16} />}
                title="Next show"
                subtitle={band.nextShow}
                onClick={() => setTab("Shows")}
              />
              <Row
                title="Band portfolio"
                subtitle={
                  band.portfolioCount
                    ? `${band.portfolioCount} shared work items`
                    : "No shared work yet"
                }
                to="/bands/$id/portfolio"
                params={{ id: band.id }}
              />
            </>
          ) : null}

          {tab === "Members"
            ? band.members.map((m) => {
                const card = (
                  <Card className="flex items-center gap-3 py-3">
                    {m.photo ? (
                      <img
                        src={m.photo}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div aria-hidden className="h-12 w-12 shrink-0 rounded-full bg-subtle" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold">{m.name}</p>
                        {m.verified ? <VerifiedBadge size={13} /> : null}
                      </div>
                      {m.detail ? (
                        <p className="truncate text-[12px] text-muted-foreground">{m.detail}</p>
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
                      <h3 className="truncate text-[15px]">{e.title}</h3>
                      {e.place ? (
                        <p className="mt-1 truncate text-[12px] text-muted-foreground">{e.place}</p>
                      ) : null}
                      {e.date ? (
                        <p className="mt-1 text-[12px] font-semibold text-foreground">{e.date}</p>
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
                    <p className="mt-3 text-[12px] text-muted-foreground">{e.ticketNote}</p>
                  ) : null}
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
                  <article
                    key={r.id}
                    className="overflow-hidden rounded-[24px] border border-border bg-card"
                  >
                    {r.cover ? (
                      <img
                        src={r.cover}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div aria-hidden className="aspect-square w-full bg-subtle" />
                    )}
                    <div className="p-3">
                      <h3 className="truncate text-[13px]">{r.title}</h3>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {joinParts(r.kind, r.year ? String(r.year) : "")}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No releases yet" body="Add band work from your portfolio.">
                <BtnLink
                  to="/bands/$id/portfolio"
                  params={{ id: band.id }}
                  variant="outline"
                  className="w-full"
                >
                  Open Portfolio
                </BtnLink>
              </EmptyState>
            )
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
