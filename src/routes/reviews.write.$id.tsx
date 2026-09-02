import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, StatusPill } from "@/components/ml/kit";
import { pendingReviews, reviewPolicy } from "@/data/reviews";

export const Route = createFileRoute("/reviews/write/$id")({
  head: () => ({
    meta: [
      { title: "Write a Review | MusicLinkd" },
      { name: "description", content: "Rate a completed booking, order or rental and help other professionals get booked." },
      { property: "og:title", content: "Write a Review | MusicLinkd" },
      { property: "og:description", content: "Rate completed work on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WriteReview,
});

function WriteReview() {
  const { id } = Route.useParams();
  const item = pendingReviews.find((p) => p.id === id);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  if (!item) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Write a review" back="/reviews" />
        <div className="px-5 pt-8">
          <EmptyState title="This review window has closed" body="Reviews are open for 14 days after a transaction completes.">
            <Link to="/reviews"><Btn className="w-full">Back to reviews</Btn></Link>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  const complete = item.criteria.every((c) => scores[c]) && body.trim().length > 10;

  return (
    <Screen bottomNav={false}>
      <TopBar title="Write a review" subtitle={item.title} back="/reviews" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card className="flex items-center gap-3">
          <img src={item.photo} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="truncate text-[12px] text-muted-foreground">{item.subtitle}</p>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-[15px]">Rate the experience</h2>
          {item.criteria.map((c) => (
            <div key={c}>
              <p className="text-[13px] font-semibold">{c}</p>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-label={`${c}: ${n} of 5`} onClick={() => setScores((p) => ({ ...p, [c]: n }))} className="p-1">
                    <Star size={26} className={n <= (scores[c] ?? 0) ? "text-primary" : "text-border"} fill={n <= (scores[c] ?? 0) ? "currentColor" : "none"} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-[15px]">What happened</h2>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the work, communication and whether you would book again."
            className="w-full rounded-2xl border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
          />
          <p className="text-[12px] text-muted-foreground">{body.trim().length}/1000 · contact details are removed automatically.</p>
        </Card>

        <Card className="space-y-2">
          <StatusPill label="Blind review" tone="warn" />
          <ul className="space-y-1.5">{reviewPolicy.map((p) => <li key={p} className="text-[12px] text-text2">· {p}</li>)}</ul>
        </Card>

        <Btn className="w-full" onClick={() => complete && setDone(true)}>{complete ? "Submit review" : "Rate every category and add a note"}</Btn>
      </div>

      <Dialog open={done} title="Review submitted" body="It publishes once the other side submits theirs, or after 14 days." onClose={() => setDone(false)}>
        <Link to="/reviews"><Btn className="w-full">Back to reviews</Btn></Link>
      </Dialog>
    </Screen>
  );
}
