import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, LoadError, Loading, Stars } from "@/components/ml/kit";
import { deleteMyReview, editMyReview, listMyReviews } from "@/lib/reviews.functions";

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
  const queryClient = useQueryClient();
  const load = useServerFn(listMyReviews);
  const save = useServerFn(editMyReview);
  const remove = useServerFn(deleteMyReview);
  const q = useQuery({ queryKey: ["reviews", "mine"], queryFn: () => load() });
  const r = q.data?.find((x) => x.id === id);
  const [body, setBody] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setBody(r?.body ?? ""), [r?.body]);

  async function onSave() {
    if (!r) return;
    setBusy(true);
    try {
      await save({ data: { id: r.id, body: body.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["reviews", "mine"] });
      toast.success("Review updated");
      void navigate({ to: "/reviews" });
    } catch {
      toast.error("Couldn't save that — try again");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!r) return;
    setBusy(true);
    try {
      await remove({ data: { id: r.id } });
      await queryClient.invalidateQueries({ queryKey: ["reviews", "mine"] });
      toast.success("Review deleted");
      void navigate({ to: "/reviews" });
    } catch {
      toast.error("Couldn't delete that — try again");
      setBusy(false);
      setConfirm(false);
    }
  }

  if (q.isError) {
    return (
      <Screen>
        <TopBar title="Edit review" back="/reviews" />
        <div className="px-5 pt-6">
          <LoadError what="this review" />
        </div>
      </Screen>
    );
  }

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Edit review" back="/reviews" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }

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
      <TopBar title="Edit review" subtitle={r.author_name} back="/reviews" />

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
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Card>

        <Btn
          className="w-full"
          disabled={body.trim().length < 10 || busy}
          onClick={() => void onSave()}
        >
          {busy ? "Saving…" : "Save changes"}
        </Btn>
        <Btn variant="ghost" className="w-full" onClick={() => setConfirm(true)} disabled={busy}>
          Delete this review
        </Btn>
      </div>

      <Dialog
        open={confirm}
        title="Delete your review?"
        body="It disappears from their profile and from your history. This cannot be undone."
        onClose={() => setConfirm(false)}
      >
        <Btn onClick={() => void onDelete()} disabled={busy}>
          {busy ? "Deleting…" : "Delete review"}
        </Btn>
        <Btn variant="ghost" onClick={() => setConfirm(false)} disabled={busy}>
          Keep it
        </Btn>
      </Dialog>
    </Screen>
  );
}
