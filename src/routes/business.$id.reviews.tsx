import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Stars } from "@/components/ml/kit";
import { businessReviews, getBusiness } from "@/data/business";

export const Route = createFileRoute("/business/$id/reviews")({
  head: () => ({
    meta: [
      { title: "Business reviews | MusicLinkd" },
      { name: "description", content: "Read reviews left after real sessions and reply to them as the business owner." },
      { property: "og:title", content: "Business reviews | MusicLinkd" },
      { property: "og:description", content: "Verified reviews and owner replies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessReviews,
});

function BusinessReviews() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Record<string, string>>({});

  if (!b) {
    return (
      <Screen>
        <TopBar title="Reviews" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or is no longer public." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Reviews" subtitle={`${b.stats.rating} · ${b.stats.reviews} reviews`} back={`/business/${b.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        {businessReviews.length ? (
          businessReviews.map((r) => {
            const response = sent[r.id] ?? r.response;
            return (
              <Card key={r.id}>
                <div className="flex items-center gap-3">
                  <img src={r.photo} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.author}</p>
                    <p className="text-[12px] text-muted-foreground">{r.at}</p>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-3 text-[13px]">{r.body}</p>

                {response ? (
                  <div className="mt-3 rounded-[16px] bg-subtle p-3">
                    <p className="text-[12px] font-semibold">{b.name} replied</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{response}</p>
                  </div>
                ) : replyTo === r.id ? (
                  <div className="mt-3">
                    <textarea
                      value={drafts[r.id] ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                      rows={3}
                      placeholder="Reply once, publicly. Keep it short and factual."
                      className="w-full rounded-[16px] border border-border bg-background p-3 text-sm outline-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <Btn
                        className="flex-1"
                        disabled={(drafts[r.id] ?? "").trim().length < 4}
                        onClick={() => {
                          setSent({ ...sent, [r.id]: drafts[r.id] ?? "" });
                          setReplyTo(null);
                        }}
                      >
                        Post reply
                      </Btn>
                      <Btn variant="ghost" className="flex-1" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Btn>
                    </div>
                  </div>
                ) : (
                  <Btn variant="outline" className="mt-3 w-full" onClick={() => setReplyTo(r.id)}>
                    Reply as {b.name}
                  </Btn>
                )}
              </Card>
            );
          })
        ) : (
          <EmptyState title="No reviews yet" body="Reviews appear here after a completed session or order." />
        )}
      </div>
    </Screen>
  );
}
