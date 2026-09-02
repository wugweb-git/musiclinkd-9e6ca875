import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, Flag, Share2, CalendarDays, MapPin, Wallet, CheckCircle2, Circle } from "lucide-react";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Dialog } from "@/components/ml/kit";
import { MatchBar, PosterRow, statusTone, useSavedOpportunities } from "@/components/ml/opportunity";
import { getOpportunity, categoryLabel, payLabel, reportReasons, myApplications } from "@/data/opportunities";

export const Route = createFileRoute("/opportunities/$id/")({
  head: ({ params }) => {
    const o = getOpportunity(params.id);
    const title = o ? `${o.title} | MusicLinkd Opportunities` : "Opportunity | MusicLinkd";
    const desc = o?.summary ?? "This opportunity is no longer available.";
    return {
      meta: [
        { title },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: desc.slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: OpportunityDetail,
});

function OpportunityDetail() {
  const { id } = Route.useParams();
  const o = getOpportunity(id);
  const { has, toggle } = useSavedOpportunities();
  const [report, setReport] = useState(false);
  const [reported, setReported] = useState(false);
  const [share, setShare] = useState(false);

  if (!o) {
    return (
      <Screen>
        <TopBar title="Opportunity" back="/opportunities" />
        <div className="px-5 pt-6">
          <EmptyState title="This opportunity is gone" body="It was closed, filled or removed by the poster.">
            <Link to="/opportunities">
              <Btn className="w-full">Browse open opportunities</Btn>
            </Link>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  const existing = myApplications.find((a) => a.opportunityId === o.id);
  const saved = has(o.id) || o.saved;

  return (
    <Screen>
      <TopBar
        title={categoryLabel(o.categoryKey)}
        subtitle={o.closesAt}
        back="/opportunities"
        right={
          <button
            type="button"
            onClick={() => setShare(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Share"
          >
            <Share2 size={16} />
          </button>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-28">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={o.status} tone={statusTone(o.status)} />
            <StatusPill label={o.workMode} />
            <StatusPill label={`${o.applicants} applied`} />
          </div>
          <h1 className="mt-2 text-[24px] leading-tight">{o.title}</h1>
          <p className="mt-2 text-[14px] text-text2">{o.summary}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Wallet size={14} />, label: "Pay", value: payLabel(o) },
            { icon: <MapPin size={14} />, label: "Where", value: `${o.city} · ${o.workMode}` },
            { icon: <CalendarDays size={14} />, label: "When", value: o.dates },
          ].map((s) => (
            <div key={s.label} className="rounded-[20px] bg-subtle p-3">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {s.icon} {s.label}
              </span>
              <p className="mt-1 text-[13px] font-semibold leading-snug">{s.value}</p>
            </div>
          ))}
        </div>

        <MatchBar score={o.matchScore} reasons={o.matchReasons} />

        <Card className="space-y-2">
          <h2 className="text-[15px]">The brief</h2>
          {o.brief.map((b) => (
            <p key={b} className="text-[13px] leading-relaxed text-text2">
              {b}
            </p>
          ))}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-[15px]">Requirements</h2>
          {o.requirements.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              {r.must ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
              ) : (
                <Circle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <p className="text-[13px]">
                {r.label}
                <span className="ml-1 text-[11px] uppercase tracking-wide text-muted-foreground">{r.must ? "must have" : "nice to have"}</span>
              </p>
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[...o.genres, ...o.languages].map((g) => (
              <span key={g} className="rounded-full bg-subtle px-2.5 py-1 text-[11px] font-semibold">
                {g}
              </span>
            ))}
          </div>
        </Card>

        <div>
          <h2 className="mb-2 text-[15px]">Posted by</h2>
          <PosterRow o={o} />
        </div>

        <button
          type="button"
          onClick={() => setReport(true)}
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground"
        >
          <Flag size={13} /> Report this opportunity
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-[430px] border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggle(o.id)}
            aria-label={saved ? "Saved" : "Save"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background"
          >
            <Bookmark size={18} className={saved ? "text-primary" : "text-muted-foreground"} fill={saved ? "currentColor" : "none"} />
          </button>
          {existing ? (
            <Link to="/opportunities/applications/$aid" params={{ aid: existing.id }} className="min-w-0 flex-1">
              <Btn className="w-full">View your application · {existing.status}</Btn>
            </Link>
          ) : o.status === "closed" ? (
            <Btn className="min-w-0 flex-1" disabled>
              Applications closed
            </Btn>
          ) : (
            <Link to="/opportunities/$id/apply" params={{ id: o.id }} search={{ step: "portfolio" }} className="min-w-0 flex-1">
              <Btn className="w-full">Apply</Btn>
            </Link>
          )}
        </div>
      </div>

      <Sheet open={share} onClose={() => setShare(false)} title="Share opportunity">
        <div className="space-y-2">
          <Btn variant="outline" className="w-full">
            Copy link
          </Btn>
          <Link to="/messages" className="block">
            <Btn variant="outline" className="w-full">
              Send in a conversation
            </Btn>
          </Link>
          <Link to="/identity/qr" className="block">
            <Btn variant="ghost" className="w-full">
              Show as QR
            </Btn>
          </Link>
        </div>
      </Sheet>

      <Sheet open={report} onClose={() => setReport(false)} title="Report opportunity">
        <div className="space-y-2">
          {reportReasons.map((r) => (
            <Btn
              key={r}
              variant="outline"
              className="w-full"
              onClick={() => {
                setReport(false);
                setReported(true);
              }}
            >
              {r}
            </Btn>
          ))}
        </div>
      </Sheet>

      <Dialog
        open={reported}
        title="Report sent"
        body="Our trust team reviews reports within 24 hours. You won't see this opportunity in your feed."
        onClose={() => setReported(false)}
      >
        <Btn onClick={() => setReported(false)}>Done</Btn>
      </Dialog>
    </Screen>
  );
}
