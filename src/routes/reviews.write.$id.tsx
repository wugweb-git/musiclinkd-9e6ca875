import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, LoadError, Loading, StatusPill } from "@/components/ml/kit";
import { reviewPolicy } from "@/data/reviews";
import { listReviewable, writeReview } from "@/lib/reviews.functions";
import { getMyProfile } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/reviews/write/$id")({
  head: () => ({
    meta: [
      { title: "Write a Review | MusicLinkd" },
      {
        name: "description",
        content:
          "Rate a completed booking, order or rental and help other professionals get booked.",
      },
      { property: "og:title", content: "Write a Review | MusicLinkd" },
      { property: "og:description", content: "Rate completed work on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WriteReview,
});

/**
 * Writing a review about one studio or person you have worked with. Who that can be comes from the
 * database (a confirmed session, or an accepted application), so this screen cannot invent one.
 */
function WriteReview() {
  const { id } = Route.useParams();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const loadSubjects = useServerFn(listReviewable);
  const loadProfile = useServerFn(getMyProfile);
  const send = useServerFn(writeReview);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const subjects = useQuery({
    queryKey: ["reviewable"],
    queryFn: () => loadSubjects(),
    enabled: signedIn,
  });
  const me = useQuery({
    queryKey: ["profile", "mine"],
    queryFn: () => loadProfile(),
    enabled: signedIn,
  });
  const item = (subjects.data ?? []).find((s) => s.id === id);

  const submit = useMutation({
    mutationFn: () =>
      send({
        data: {
          ...(item?.kind === "studio" ? { targetStudioId: id } : { targetProfileId: id }),
          rating,
          body: body.trim(),
          ...(item?.context ? { context: item.context } : {}),
          authorName:
            (me.data as { display_name?: string | null; username?: string | null } | null)
              ?.display_name ??
            (me.data as { username?: string | null } | null)?.username ??
            "A MusicLinkd member",
        },
      }),
    onSuccess: () => {
      setDone(true);
      void queryClient.invalidateQueries({ queryKey: ["reviewable"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  if (subjects.isError) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Write a review" back="/reviews" />
        <div className="px-5 pt-6">
          <LoadError what="who you can review" />
        </div>
      </Screen>
    );
  }

  if (signedIn && subjects.isLoading) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Write a review" back="/reviews" />
        <div className="px-5 pt-6">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

  // Once it is written the subject leaves the reviewable list, so the confirmation stands on its own.
  if (done) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Review published" back="/reviews" />
        <div className="space-y-3 px-5 pt-8 text-center">
          <p className="text-3 leading-tight">Thanks — that's published</p>
          <p className="text-1 text-muted-foreground">It is on their profile now.</p>
          <BtnLink to="/reviews" className="w-full">
            Back to Reviews
          </BtnLink>
        </div>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Write a review" back="/reviews" />
        <div className="px-5 pt-8">
          <EmptyState
            title="Nothing to review here"
            body="A review follows real work: a confirmed studio session, or an application one of you accepted."
          >
            <BtnLink to="/reviews" className="w-full">
              Back to Reviews
            </BtnLink>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  const complete = rating > 0 && body.trim().length > 10;

  return (
    <Screen bottomNav={false}>
      <TopBar title="Write a review" subtitle={item.name} back="/reviews" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="truncate text-1 text-muted-foreground">{item.context}</p>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm">Rate the experience</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} of 5`}
                aria-pressed={n === rating}
                onClick={() => setRating(n)}
                className="p-1"
              >
                <Star
                  size={iconSize.lg}
                  className={n <= rating ? "text-ink" : "text-border"}
                  fill={n <= rating ? "currentColor" : "none"}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm">What happened</h2>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the work, communication and whether you would book again."
            className="w-full rounded-lg border border-input bg-card p-3 text-1 outline-none field-focus"
          />
          <p className="text-1 text-muted-foreground">{body.trim().length}/2000</p>
        </Card>

        <Card className="space-y-2">
          <StatusPill label="How reviews work" />
          <ul className="space-y-1.5">
            {reviewPolicy.map((p) => (
              <li key={p} className="text-1 text-muted-foreground">
                · {p}
              </li>
            ))}
          </ul>
        </Card>

        <Btn
          className="w-full"
          disabled={!complete}
          loading={submit.isPending}
          onClick={() => submit.mutate()}
        >
          {complete ? "Submit review" : "Add a rating and a note"}
        </Btn>
      </div>
    </Screen>
  );
}
