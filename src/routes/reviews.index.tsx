import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Btn, Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, Segmented, Stars, EmptyState, Loading, Meter, Row } from "@/components/ml/kit";
import { reviewPolicy } from "@/data/reviews";
import {
  listMyReviews,
  listReviewable,
  listReviewsAboutMe,
  replyToReview,
  type ReviewRow,
} from "@/lib/reviews.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

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
            <Card className="space-y-3">
              <div className="flex items-end gap-3">
                <p className="text-4 font-bold leading-none">{total ? average : "—"}</p>
                <div className="min-w-0 flex-1 pb-1">
                  <Stars value={average} />
                  <p className="mt-1 truncate text-1 text-muted-foreground">
                    {total ? `${total} ${total === 1 ? "review" : "reviews"}` : "No reviews yet"}
                  </p>
                </div>
              </div>
              {total ? (
                <div className="space-y-1.5">
                  {distribution.map((d) => (
                    <Meter
                      key={d.stars}
                      label={`${d.stars} star`}
                      value={d.count}
                      max={total}
                      hint={`${d.count}`}
                    />
                  ))}
                </div>
              ) : null}
            </Card>

            <Segmented value={tab} options={tabs} onChange={setTab} />

            {tab === "Received" ? (
              about.isLoading ? (
                <Loading rows={2} />
              ) : received.length ? (
                received.map((r) => <ReceivedReview key={r.id} r={r} />)
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
              ) : (mine.data ?? []).length ? (
                (mine.data ?? []).map((r) => (
                  <Card key={r.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-1 text-muted-foreground">
                        {r.context ?? "Your review"}
                      </p>
                      <Stars value={Number(r.rating)} />
                    </div>
                    <p className="text-1 leading-relaxed">{r.body}</p>
                    {r.response ? (
                      <div className="rounded-lg bg-background p-3">
                        <p className="pill bg-subtle text-muted-foreground">Their reply</p>
                        <p className="mt-1 text-1 text-muted-foreground">{r.response}</p>
                      </div>
                    ) : null}
                  </Card>
                ))
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
              <ShieldCheck size={iconSize.sm} className="text-primary" aria-hidden />
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

/** One review about you, with the reply box until you have answered it. */
function ReceivedReview({ r }: { r: ReviewRow }) {
  const queryClient = useQueryClient();
  const reply = useServerFn(replyToReview);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const answer = useMutation({
    mutationFn: () => reply({ data: { id: r.id, response: text.trim() } }),
    onSuccess: () => {
      setOpen(false);
      setText("");
      void queryClient.invalidateQueries({ queryKey: ["reviews", "about-me"] });
    },
    onError: () => toast.error("That didn't save. Try again."),
  });

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{r.author_name}</p>
          {r.context ? <p className="truncate text-1 text-muted-foreground">{r.context}</p> : null}
        </div>
        <Stars value={Number(r.rating)} />
      </div>
      <p className="text-1 leading-relaxed">{r.body}</p>

      {r.response ? (
        <div className="rounded-lg bg-background p-3">
          <p className="pill bg-subtle text-muted-foreground">Your reply</p>
          <p className="mt-1 text-1 text-muted-foreground">{r.response}</p>
        </div>
      ) : open ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim() && !answer.isPending) answer.mutate();
          }}
        >
          <label className="sr-only" htmlFor={`reply-${r.id}`}>
            Your reply
          </label>
          <textarea
            id={`reply-${r.id}`}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Answer publicly, once."
            className="w-full resize-none rounded-lg border border-border bg-card p-3 text-1 outline-none"
          />
          <div className="flex gap-2">
            <Btn variant="ghost" className="min-h-10 flex-1 text-1" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn
              type="submit"
              className="min-h-10 flex-1 text-1"
              disabled={!text.trim()}
              loading={answer.isPending}
            >
              Reply
            </Btn>
          </div>
        </form>
      ) : (
        <Btn variant="outline" className="min-h-10 w-full text-1" onClick={() => setOpen(true)}>
          Respond
        </Btn>
      )}
    </Card>
  );
}
