import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, Stars } from "@/components/ml/kit";
import { getReview } from "@/data/reviews";

export const Route = createFileRoute("/reviews/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit your review | MusicLinkd" },
      {
        name: "description",
        content: "Change the wording of a review you left, or delete it entirely.",
      },
      { property: "og:title", content: "Edit your review | MusicLinkd" },
      { property: "og:description", content: "Update or delete a review you wrote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditReview,
});

function EditReview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const r = getReview(id);
  const [body, setBody] = useState(r?.body ?? "");
  const [confirm, setConfirm] = useState(false);

  if (!r) {
    return (
      <Screen>
        <TopBar title="Edit review" back="/reviews" />
        <div className="px-5 pt-6">
          <EmptyState title="Review not found" body="It may already have been deleted." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Edit review" subtitle={r.sourceLabel} back="/reviews" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Your rating</p>
            <Stars value={r.rating} size={20} />
          </div>
          <p className="mt-2 text-1 text-muted-foreground">
            Ratings are locked once published. You can still correct the written part.
          </p>
        </Card>

        <Card>
          <label htmlFor="body" className="text-sm font-semibold">
            What you wrote
          </label>
          <textarea
            id="body"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none"
          />
        </Card>

        <Btn
          className="w-full"
          disabled={body.trim().length < 10}
          onClick={() => navigate({ to: "/reviews" })}
        >
          Save changes
        </Btn>
        <Btn variant="ghost" className="w-full" onClick={() => setConfirm(true)}>
          Delete this review
        </Btn>
      </div>

      <Dialog
        open={confirm}
        title="Delete your review?"
        body="It disappears from their profile and from your history. This cannot be undone."
        onClose={() => setConfirm(false)}
      >
        <Btn onClick={() => navigate({ to: "/reviews" })}>Delete review</Btn>
        <Btn variant="ghost" onClick={() => setConfirm(false)}>
          Keep it
        </Btn>
      </Dialog>
    </Screen>
  );
}
