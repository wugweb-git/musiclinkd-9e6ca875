import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Stars } from "@/components/ml/kit";
import { getReview, reviewPolicy } from "@/data/reviews";

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
  const r = getReview(id);
  const [body, setBody] = useState(r?.response?.body ?? "");

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
      <TopBar title="Reply" subtitle={r.sourceLabel} back="/reviews" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-center gap-3">
            <img
              src={r.authorPhoto}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.authorName}</p>
              <p className="text-1 text-muted-foreground">{r.createdAt}</p>
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
          disabled={body.trim().length < 4}
          onClick={() => navigate({ to: "/reviews" })}
        >
          Post response
        </Btn>
      </div>
    </Screen>
  );
}
