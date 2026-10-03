import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Btn, Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, LoadError, Loading, Row, Segmented } from "@/components/ml/kit";
import { RatingSummary, ReviewCard, ReviewRail } from "@/components/ml/profile";
import { reviewItemFrom } from "@/lib/review-item";
import { reviewPolicy } from "@/data/reviews";
import {
  listMyReviews,
  listReviewable,
  listReviewsAboutMe,
  type ReviewRow,
} from "@/lib/reviews.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { TextLink } from "@/components/ml/links";

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

/** Reviews, all from the database: what people wrote about you, who you can review, what you wrote. */
function ReviewsHub() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Received");
  const { signedIn, loading: authLoading } = useAuth();
  const loadAbout = useServerFn(listReviewsAboutMe);
  const loadMine = useServerFn(listMyReviews);
  const loadReviewable = useServerFn(listReviewable);

  const about = useQuery({
    queryKey: ["reviews", "about-me"],
    queryFn: () => loadAbout(),
    enabled: signedIn,
  });
  const mine = useQuery({
    queryKey: ["reviews", "mine"],
    queryFn: () => loadMine(),
    enabled: signedIn,
  });
  const reviewable = useQuery({
    queryKey: ["reviewable"],
    queryFn: () => loadReviewable(),
    enabled: signedIn,
  });

  const received = about.data ?? [];
  const total = received.length;
  const average = total
    ? Math.round((received.reduce((sum, r) => sum + Number(r.rating), 0) / total) * 10) / 10
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: received.filter((r) => Math.round(Number(r.rating)) === stars).length,
  }));

  return (
    <Screen>
      <TopBar title="Reviews" subtitle="Only from completed work" back="/profile" />
      <div className="space-y-4 px-5 pt-4">
        {!signedIn && !authLoading ? (
          <EmptyState
            title="Sign in to see your reviews"
            body="Reviews of your work, and the ones you can write, live here."
          >
            <BtnLink to="/welcome" className="w-full">
              Sign In
            </BtnLink>
          </EmptyState>
        ) : (
          <>
            {/* Loading and a failed read are their own states: never "No reviews yet". */}
            {about.isLoading ? (
              <Loading rows={1} />
            ) : about.isError ? (
              <LoadError what="your rating" />
            ) : (
              <RatingSummary average={average} count={total} distribution={distribution} />
            )}

            <Segmented value={tab} options={tabs} onChange={setTab} />

            {tab === "Received" ? (
              about.isLoading ? (
                <Loading rows={2} />
              ) : about.isError ? (
                <LoadError what="reviews" />
              ) : received.length ? (
                <ReviewRail label="Reviews you received">
                  {received.map((r) => (
                    <ReceivedReview key={r.id} r={r} />
                  ))}
                </ReviewRail>
              ) : (
                <EmptyState
                  title="No reviews yet"
                  body="Finish a session or an accepted application and the other side can review you."
                />
              )
            ) : null}

            {tab === "To review" ? (
              reviewable.isLoading ? (
                <Loading rows={2} />
              ) : reviewable.isError ? (
                <LoadError what="reviews" />
              ) : (reviewable.data ?? []).length ? (
                (reviewable.data ?? []).map((s) => (
                  <Card key={s.id} className="space-y-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="truncate text-1 text-muted-foreground">{s.context}</p>
                    </div>
                    <BtnLink to="/reviews/write/$id" params={{ id: s.id }} className="w-full">
                      Write Review
                    </BtnLink>
                  </Card>
                ))
              ) : (
                <EmptyState
                  title="Nothing to review"
                  body="A review follows real work: a confirmed studio session, or an application one of you accepted."
                />
              )
            ) : null}

            {tab === "Given" ? (
              mine.isLoading ? (
                <Loading rows={2} />
              ) : mine.isError ? (
                <LoadError what="reviews" />
              ) : (mine.data ?? []).length ? (
                <ReviewRail label="Reviews you gave">
                  {(mine.data ?? []).map((r) => (
                    <ReviewCard key={r.id} r={reviewItemFrom(r)} />
                  ))}
                </ReviewRail>
              ) : (
                <EmptyState
                  title="You have not reviewed anyone yet"
                  body="Your reviews help other professionals get booked."
                />
              )
            ) : null}
          </>
        )}

        <section className="space-y-2 pb-4">
          <Card className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={iconSize.sm} className="text-ink" aria-hidden />
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
          {signedIn ? (
            <Row
              title="Ask for a review"
              subtitle="People you have worked with"
              to="/reviews/request"
            />
          ) : null}
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

/** One review about you. Reviews take no replies; you can report one that breaks the rules. */
function ReceivedReview({ r }: { r: ReviewRow }) {
  return (
    <ReviewCard
      r={reviewItemFrom(r)}
      footer={
        <div className="flex justify-end">
          <TextLink
            to="/reviews/$id/report"
            params={{ id: r.id }}
            className="text-1 text-muted-foreground"
          >
            Report
          </TextLink>
        </div>
      }
    />
  );
}
