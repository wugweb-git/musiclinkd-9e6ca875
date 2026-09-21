import { useAuth } from "@/hooks/use-auth";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { ReviewCard, ReviewRail } from "@/components/ml/profile";
import { businessView, loadBusiness } from "@/lib/business-view";
import { replyToReview } from "@/lib/reviews.functions";

export const Route = createFileRoute("/business/$id/reviews")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business reviews | MusicLinkd" },
      {
        name: "description",
        content: "Read reviews left after real sessions and reply to them as the business owner.",
      },
      { property: "og:title", content: "Business reviews | MusicLinkd" },
      { property: "og:description", content: "Verified reviews and owner replies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessReviews,
});

function BusinessReviews() {
  const queryClient = useQueryClient();
  const b = businessView(Route.useLoaderData());
  const { user } = useAuth();
  // Only the business itself answers its reviews.
  const owner = Boolean(b && user && user.id === b.profileId);
  const reply = useServerFn(replyToReview);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  async function postReply(id: string) {
    const response = (drafts[id] ?? "").trim();
    if (response.length < 4) return;
    setSending(id);
    try {
      await reply({ data: { id, response } });
      setSent((s) => ({ ...s, [id]: response }));
      setReplyTo(null);
      await queryClient.invalidateQueries();
    } catch {
      toast.error("Couldn't post that reply — try again");
    } finally {
      setSending(null);
    }
  }

  if (!b) {
    return (
      <Screen>
        <TopBar title="Reviews" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or is no longer public."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Reviews"
        subtitle={
          b.rating != null && b.reviewCount != null
            ? `${b.rating.toFixed(1)} · ${b.reviewCount} reviews`
            : ""
        }
        back={`/business/${b.id}`}
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        {b.reviews.length ? (
          <ReviewRail>
            {b.reviews.map((r) => {
              const response = sent[r.id] ?? r.response;
              return (
                // The shared review card; the owner's reply controls sit at its foot.
                <ReviewCard
                  key={r.id}
                  r={{
                    id: r.id,
                    by: r.author,
                    org: r.org,
                    context: r.context,
                    stars: r.rating,
                    text: r.body,
                    tags: r.tags,
                    ...(response ? { response } : {}),
                  }}
                  responseLabel={`${b.name} replied`}
                  footer={
                    response ? null : replyTo === r.id ? (
                      <div>
                        <textarea
                          value={drafts[r.id] ?? ""}
                          onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                          rows={3}
                          placeholder="Reply once, publicly. Keep it short and factual."
                          className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none"
                        />
                        <div className="mt-2 flex gap-2">
                          <Btn
                            className="flex-1"
                            disabled={(drafts[r.id] ?? "").trim().length < 4 || sending === r.id}
                            onClick={() => void postReply(r.id)}
                          >
                            {sending === r.id ? "Posting…" : "Post reply"}
                          </Btn>
                          <Btn variant="ghost" className="flex-1" onClick={() => setReplyTo(null)}>
                            Cancel
                          </Btn>
                        </div>
                      </div>
                    ) : owner ? (
                      <Btn variant="outline" className="w-full" onClick={() => setReplyTo(r.id)}>
                        Reply as {b.name}
                      </Btn>
                    ) : null
                  }
                />
              );
            })}
          </ReviewRail>
        ) : (
          <EmptyState
            title="No reviews yet"
            body="Reviews appear here after a completed session or order."
          />
        )}
      </div>
    </Screen>
  );
}
