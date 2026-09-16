import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flag, Pencil, ShieldCheck } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, Segmented, Stars, StatusPill, EmptyState, Meter, Row } from "@/components/ml/kit";
import {
  receivedReviews,
  givenReviews,
  pendingReviews,
  ratingSummary,
  reviewPolicy,
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

  return (
    <Screen>
      <TopBar title="Reviews" subtitle="Only from completed work" back="/me" />
      <div className="space-y-4 px-5 pt-4">
        <Card className="space-y-3">
          <div className="flex items-end gap-3">
            <p className="text-4 font-bold leading-none">{ratingSummary.average}</p>
            <div className="min-w-0 flex-1 pb-1">
              <Stars value={ratingSummary.average} />
              <p className="mt-1 truncate text-1 text-muted-foreground">
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
              <div key={c.label} className="rounded-lg bg-subtle p-3">
                <p className="truncate text-0 text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2 font-bold">{c.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Received" ? (
          receivedReviews.length ? (
            receivedReviews.map((r) => <ReviewCard key={r.id} r={r} mine={false} />)
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
                    className="h-12 w-12 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="truncate text-1 text-muted-foreground">{p.subtitle}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.criteria.map((c) => (
                    <StatusPill key={c} label={c} />
                  ))}
                </div>
                <BtnLink to="/reviews/write/$id" params={{ id: p.id }} className="w-full">
                  Write Review
                </BtnLink>
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
            givenReviews.map((r) => <ReviewCard key={r.id} r={r} mine />)
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
              <h2 className="text-sm">How reviews work</h2>
            </div>
            <ul className="space-y-1.5">
              {reviewPolicy.map((p) => (
                <li key={p} className="text-1 text-muted-foreground">
                  · {p}
                </li>
              ))}
            </ul>
          </Card>
          <Row
            title="Ask for a review"
            subtitle="From clients you have completed work with"
            to="/reviews/request"
          />
          <Row
            title="Full review policy"
            subtitle="Trust & safety"
            to="/help/$slug"
            params={{ slug: "review-policy" }}
          />
        </section>
      </div>
    </Screen>
  );
}

function ReviewCard({ r, mine }: { r: Review; mine: boolean }) {
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
          <p className="truncate text-1 text-muted-foreground">
            {r.sourceLabel} · {r.createdAt}
          </p>
        </div>
        <Stars value={r.rating} />
      </div>
      <StatusPill label="Verified transaction" tone="good" />
      <p className="text-1 text-muted-foreground">{r.body}</p>
      <div className="flex flex-wrap gap-2">
        {r.criteria.map((c) => (
          <span
            key={c.key}
            className="rounded-full bg-subtle px-2.5 py-1 text-0 font-semibold text-muted-foreground"
          >
            {c.label} {c.value}
          </span>
        ))}
      </div>
      {r.response ? (
        <div className="rounded-lg bg-subtle p-3">
          <p className="text-0 font-bold uppercase tracking-wide text-muted-foreground">
            Your response · {r.response.at}
          </p>
          <p className="mt-1 text-1 text-muted-foreground">{r.response.body}</p>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        {mine ? (
          <BtnLink
            to="/reviews/$id/edit"
            params={{ id: r.id }}
            variant="outline"
            className="flex-1 gap-1 text-1"
          >
            <Pencil size={13} aria-hidden />
            Edit
          </BtnLink>
        ) : (
          <>
            {!r.response ? (
              <BtnLink
                to="/reviews/$id/reply"
                params={{ id: r.id }}
                variant="outline"
                className="flex-1 text-1"
              >
                Respond
              </BtnLink>
            ) : null}
            <BtnLink
              to="/reviews/$id/report"
              params={{ id: r.id }}
              variant="ghost"
              className="flex-1 gap-1 text-1"
            >
              <Flag size={13} aria-hidden />
              Report
            </BtnLink>
          </>
        )}
      </div>
    </Card>
  );
}
