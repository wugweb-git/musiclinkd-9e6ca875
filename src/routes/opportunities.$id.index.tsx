import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Bookmark, Share2, CalendarDays, MapPin, Wallet, CheckCircle2, Circle } from "lucide-react";
import { ActionBar, Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Price } from "@/components/ml/kit";
import { MatchBar, statusTone, useSavedOpportunities } from "@/components/ml/opportunity";
import { categoryLabel, payParts } from "@/data/opportunities";
import { loadDbOpportunity, opportunityViewSource } from "@/lib/opportunity-view";
import { usePreviousPath } from "@/lib/flow-back";
import { myApplicationTo, recordOpportunityView } from "@/lib/applications.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { PersonRow } from "@/components/ml/cards";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/opportunities/$id/")({
  // The id is a stored opportunity slug.
  loader: async ({ params }) => ({ db: await loadDbOpportunity(params.id) }),
  head: ({ params, loaderData }) => {
    const o = loaderData?.db ?? undefined;
    const title = o ? `${o.title} | MusicLinkd Opportunities` : "Opportunity | MusicLinkd";
    const desc = o?.summary || (o ? o.title : "This opportunity is no longer available.");
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
  const { db } = Route.useLoaderData();
  const o = db ?? undefined;
  const { has, toggle } = useSavedOpportunities();
  const [share, setShare] = useState(false);

  // Whether this account has already applied, read from the database. Before the missing-opportunity
  // guard below, so the hooks run in the same order on every render.
  const { signedIn } = useAuth();
  const readApplication = useServerFn(myApplicationTo);
  const mine = useQuery({
    queryKey: ["application", id],
    queryFn: () => readApplication({ data: { slug: id } }),
    enabled: signedIn,
    retry: false,
  });

  const recordView = useServerFn(recordOpportunityView);
  const previousPath = usePreviousPath();
  useEffect(() => {
    // Once per real opportunity view, with the screen it was opened from; the database decides
    // whether it actually counts.
    if (signedIn && db)
      void recordView({
        data: { slug: id, source: opportunityViewSource(previousPath()) },
      }).catch(() => {});
    // previousPath reads the history as it is now; it is not a dependency of when to record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, db, id, recordView]);

  if (!o) {
    return (
      <Screen>
        <TopBar title="Opportunity" back="/opportunities" />
        <div className="px-5 pt-6">
          <EmptyState
            title="This opportunity is gone"
            body="It was closed, filled or removed by the poster."
          >
            <BtnLink to="/opportunities" className="w-full">
              Browse Open Opportunities
            </BtnLink>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  const applied = mine.data?.status ?? null;
  const saved = has(o.id) || o.saved;
  const tags = [...o.genres, ...o.languages];

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
            <Share2 size={iconSize.sm} />
          </button>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-28">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={o.status} tone={statusTone(o.status)} />
            {o.workMode ? <StatusPill label={o.workMode} /> : null}
            <StatusPill label={`${o.applicants} applied`} />
          </div>
          <h1 className="mt-2 text-3 leading-tight">{o.title}</h1>
          {o.summary ? <p className="mt-2 text-sm text-muted-foreground">{o.summary}</p> : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Wallet size={iconSize.sm} />, label: "Pay", value: payParts(o) },
            {
              icon: <MapPin size={iconSize.sm} />,
              label: "Where",
              value: [o.city, o.workMode].filter(Boolean).join(" · "),
            },
            { icon: <CalendarDays size={iconSize.sm} />, label: "When", value: o.dates },
          ]
            .filter((s) => s.value)
            .map((s) => (
              <div key={s.label} className="rounded-[20px] bg-subtle p-3">
                <span className="flex items-center gap-1 text-1 text-muted-foreground">
                  {s.icon} {s.label}
                </span>
                {typeof s.value === "string" ? (
                  <p className="mt-1 text-1 font-semibold leading-snug">{s.value}</p>
                ) : (
                  <Price
                    price={s.value}
                    className="mt-1"
                    amountClassName="text-1 font-semibold leading-snug"
                  />
                )}
              </div>
            ))}
        </div>

        {o.matchScore ? <MatchBar score={o.matchScore} reasons={o.matchReasons} /> : null}

        {o.brief.length ? (
          <Card className="space-y-2">
            <h2 className="text-sm">The brief</h2>
            {o.brief.map((b) => (
              <p key={b} className="text-1 leading-relaxed text-muted-foreground">
                {b}
              </p>
            ))}
          </Card>
        ) : null}

        {o.requirements.length || tags.length ? (
          <Card className="space-y-2">
            <h2 className="text-sm">Requirements</h2>
            {o.requirements.map((r) => (
              <div key={r.label} className="flex items-start gap-2">
                {r.must ? (
                  <CheckCircle2 size={iconSize.sm} className="mt-0.5 shrink-0 text-primary" />
                ) : (
                  <Circle size={iconSize.sm} className="mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <p className="text-1">
                  {r.label}
                  <span className="eyebrow ml-1 text-muted-foreground">
                    {r.must ? "must have" : "nice to have"}
                  </span>
                </p>
              </div>
            ))}
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-background px-2.5 py-1 text-1 font-semibold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}

        <div>
          <h2 className="mb-2 text-sm">Posted by</h2>
          {/* Stored opportunities have no poster kind, rating or hires; only what exists shows. */}
          <PersonRow
            as="div"
            className="rounded-lg bg-subtle p-3"
            action={null}
            person={{
              id: o.poster.id,
              username: o.poster.username || null,
              name: o.poster.name,
              headline: null,
              city: null,
              avatarUrl: o.poster.photo || null,
              verified: o.poster.verified,
              rating: o.poster.rating || null,
            }}
            detail={
              joinParts(o.poster.kindLabel, o.poster.hires ? `${o.poster.hires} hires` : "") ||
              undefined
            }
          />
        </div>
      </div>

      <ActionBar>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggle(o.id)}
            aria-label={saved ? "Bookmarked" : "Bookmark"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background"
          >
            <Bookmark
              size={iconSize.md}
              className={saved ? "text-primary" : "text-muted-foreground"}
              fill={saved ? "currentColor" : "none"}
            />
          </button>
          {applied && applied !== "withdrawn" ? (
            <BtnLink to="/opportunities/applications" className="min-w-0 flex-1 w-full">
              {applied === "pending"
                ? "Applied · view"
                : applied === "shortlisted"
                  ? "Shortlisted · view"
                  : applied === "accepted"
                    ? "Accepted · view"
                    : "Not selected · view"}
            </BtnLink>
          ) : o.status === "closed" ? (
            <Btn className="min-w-0 flex-1" disabled>
              Applications Closed
            </Btn>
          ) : (
            <BtnLink
              to="/opportunities/$id/apply"
              params={{ id: o.id }}
              search={{ step: "portfolio" }}
              className="min-w-0 flex-1 w-full"
            >
              Apply
            </BtnLink>
          )}
        </div>
      </ActionBar>

      <Sheet open={share} onClose={() => setShare(false)} title="Share opportunity">
        <div className="space-y-2">
          <Btn variant="outline" className="w-full">
            Copy Link
          </Btn>
          <BtnLink to="/messages" variant="outline" className="w-full">
            Send in a Conversation
          </BtnLink>
          <BtnLink to="/identity/qr" variant="ghost" className="w-full">
            Show as QR
          </BtnLink>
        </div>
      </Sheet>
    </Screen>
  );
}
