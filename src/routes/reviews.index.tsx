import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Flag, ShieldCheck } from "lucide-react";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, Segmented, Stars, StatusPill, EmptyState, Meter, Row } from "@/components/ml/kit";
import {
  receivedReviews,
  givenReviews,
  pendingReviews,
  ratingSummary,
  reviewPolicy,
  flagReasons,
  type Review,
} from "@/data/reviews";

export const Route = createFileRoute("/reviews/")({
  head: () => ({
    meta: [
      { title: "Reviews & Ratings | MusicLinkd" },
      {
        name: "description",
        content: "Reviews from completed bookings, orders and rentals, plus reviews you still owe.",
      },
      { property: "og:title", content: "Reviews & Ratings | MusicLinkd" },
      { property: "og:description", content: "Reviews from completed work on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewsHub,
});

const tabs = ["Received", "To review", "Given"] as const;

function ReviewsHub() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Received");
  const [flagging, setFlagging] = useState<string | null>(null);

  return (
    <Screen>
      <TopBar title="Reviews" subtitle="Only from completed work" back="/me" />
      <div className="space-y-4 px-5 pt-4">
        <Card className="space-y-3">
          <div className="flex items-end gap-3">
            <p className="text-[34px] font-bold leading-none">{ratingSummary.average}</p>
            <div className="min-w-0 flex-1 pb-1">
              <Stars value={ratingSummary.average} />
              <p className="mt-1 truncate text-[12px] text-muted-foreground">
                {ratingSummary.total} reviews · verified transactions only
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {ratingSummary.distribution.map((d) => (
              <Meter
                key={d.stars}
                label={`${d.stars} star`}
                value={d.count}
                max={ratingSummary.total}
                hint={`${d.count}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {ratingSummary.criteria.map((c) => (
              <div key={c.label} className="rounded-2xl bg-subtle p-3">
                <p className="truncate text-[11px] text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-[17px] font-bold">{c.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Received" ? (
          receivedReviews.length ? (
            receivedReviews.map((r) => (
              <ReviewCard
                key={r.id}
                r={r}
                onFlag={() => setFlagging(r.id)}
                canRespond={!r.response}
              />
            ))
          ) : (
            <EmptyState
              title="No reviews yet"
              body="Complete your first booking and the client can leave a review."
            />
          )
        ) : null}

        {tab === "To review" ? (
          pendingReviews.length ? (
            pendingReviews.map((p) => (
              <Card key={p.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={p.photo}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{p.subtitle}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.criteria.map((c) => (
                    <StatusPill key={c} label={c} />
                  ))}
                </div>
                <Link to="/reviews/write/$id" params={{ id: p.id }}>
                  <Btn className="w-full">Write review</Btn>
                </Link>
              </Card>
            ))
          ) : (
            <EmptyState
              title="Nothing to review"
              body="Reviews open once a booking, order or rental is completed."
            />
          )
        ) : null}

        {tab === "Given" ? (
          givenReviews.length ? (
            givenReviews.map((r) => (
              <ReviewCard key={r.id} r={r} onFlag={() => setFlagging(r.id)} canRespond={false} />
            ))
          ) : (
            <EmptyState
              title="You have not reviewed anyone yet"
              body="Your reviews help other professionals get booked."
            />
          )
        ) : null}

        <section className="space-y-2 pb-4">
          <Card className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" aria-hidden />
              <h2 className="text-[15px]">How reviews work</h2>
            </div>
            <ul className="space-y-1.5">
              {reviewPolicy.map((p) => (
                <li key={p} className="text-[12px] text-text2">
                  · {p}
                </li>
              ))}
            </ul>
          </Card>
          <Row
            title="Full review policy"
            subtitle="Trust & safety"
            to="/help/$slug"
            params={{ slug: "review-policy" }}
          />
        </section>
      </div>

      <Sheet open={!!flagging} onClose={() => setFlagging(null)} title="Report this review">
        <div className="space-y-2">
          {flagReasons.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFlagging(null)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-[13px] font-semibold"
            >
              {r}
            </button>
          ))}
          <p className="pt-1 text-[12px] text-muted-foreground">
            Reported reviews are re-checked within 48 hours.
          </p>
        </div>
      </Sheet>
    </Screen>
  );
}

function ReviewCard({
  r,
  onFlag,
  canRespond,
}: {
  r: Review;
  onFlag: () => void;
  canRespond: boolean;
}) {
  const [responding, setResponding] = useState(false);
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={r.authorPhoto}
          alt=""
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{r.authorName}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {r.sourceLabel} · {r.createdAt}
          </p>
        </div>
        <Stars value={r.rating} />
      </div>
      <StatusPill label="Verified transaction" tone="good" />
      <p className="text-[13px] text-text2">{r.body}</p>
      <div className="flex flex-wrap gap-2">
        {r.criteria.map((c) => (
          <span
            key={c.key}
            className="rounded-full bg-subtle px-2.5 py-1 text-[11px] font-semibold text-text2"
          >
            {c.label} {c.value}
          </span>
        ))}
      </div>
      {r.response ? (
        <div className="rounded-2xl bg-subtle p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Your response · {r.response.at}
          </p>
          <p className="mt-1 text-[13px] text-text2">{r.response.body}</p>
        </div>
      ) : null}
      {responding ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            placeholder="Reply once, publicly."
            className="w-full rounded-2xl border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <Btn className="flex-1 text-xs" onClick={() => setResponding(false)}>
              Publish response
            </Btn>
            <Btn variant="outline" className="flex-1 text-xs" onClick={() => setResponding(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {canRespond ? (
            <Btn variant="outline" className="flex-1 text-xs" onClick={() => setResponding(true)}>
              Respond
            </Btn>
          ) : null}
          <Btn variant="ghost" className="flex-1 gap-1 text-xs" onClick={onFlag}>
            <Flag size={13} aria-hidden />
            Report
          </Btn>
        </div>
      )}
    </Card>
  );
}
