import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Loading, Stars } from "@/components/ml/kit";
import { reviewPolicy } from "@/data/reviews";
import { listReviewsAboutMe, replyToReview } from "@/lib/reviews.functions";

export const Route = createFileRoute("/reviews/$id/reply")({
  head: () => ({
    meta: [
      { title: "Reply to a review | MusicLinkd" },
      {
        name: "description",
        content: "Answer a review once, publicly, with the facts of what happened.",
      },
      { property: "og:title", content: "Reply to a review | MusicLinkd" },
      { property: "og:description", content: "Post one public response to a review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReplyToReview,
});

function ReplyToReview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const load = useServerFn(listReviewsAboutMe);
  const reply = useServerFn(replyToReview);
  const q = useQuery({ queryKey: ["reviews", "about-me"], queryFn: () => load() });
  const r = q.data?.find((x) => x.id === id);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => setBody(r?.response ?? ""), [r?.response]);

  async function post() {
    if (!r) return;
    setSending(true);
    try {
      await reply({ data: { id: r.id, response: body.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["reviews", "about-me"] });
      toast.success("Reply posted");
      void navigate({ to: "/reviews" });
    } catch {
      toast.error("Couldn't post that reply — try again");
      setSending(false);
    }
  }

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Reply" back="/reviews" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }

  if (!r) {
    return (
      <Screen>
        <TopBar title="Reply" back="/reviews" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Review not found"
            body="It may have been removed after a policy check."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Reply" subtitle={r.author_name} back="/reviews" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-background" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.author_name}</p>
              <p className="text-1 text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <Stars value={r.rating} />
          </div>
          <p className="mt-3 text-1">{r.body}</p>
        </Card>

        <Card>
          <label htmlFor="reply" className="text-sm font-semibold">
            Your response
          </label>
          <textarea
            id="reply"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Short, factual and calm reads better than a defence."
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none"
          />
          <p className="mt-2 text-1 text-muted-foreground">
            {body.length}/600 · one response per review
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold">House rules</p>
          <ul className="mt-2 space-y-1 text-1 text-muted-foreground">
            {reviewPolicy.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </Card>

        <Btn
          className="w-full"
          disabled={body.trim().length < 4 || sending}
          onClick={() => void post()}
        >
          {sending ? "Posting…" : "Post response"}
        </Btn>
      </div>
    </Screen>
  );
}
