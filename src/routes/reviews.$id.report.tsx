import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { flagReasons, getReview } from "@/data/reviews";

export const Route = createFileRoute("/reviews/$id/report")({
  head: () => ({
    meta: [
      { title: "Report a review | MusicLinkd" },
      {
        name: "description",
        content: "Flag a review that breaks the rules and tell the team what is wrong with it.",
      },
      { property: "og:title", content: "Report a review | MusicLinkd" },
      { property: "og:description", content: "Flag a review that breaks the rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportReview,
});

function ReportReview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const r = getReview(id);
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);

  if (!r) {
    return (
      <Screen>
        <TopBar title="Report" back="/reviews" />
        <div className="px-5 pt-6">
          <EmptyState title="Review not found" body="It may already have been removed." />
        </div>
      </Screen>
    );
  }

  if (sent) {
    return (
      <Screen>
        <TopBar title="Reported" back="/reviews" />
        <div className="space-y-4 px-5 pt-6">
          <Card>
            <h2 className="text-2.5 leading-tight">Thanks — the team will look at it</h2>
            <p className="mt-2 text-1 text-muted-foreground">
              The review stays visible while it is checked. You will hear back either way, usually
              within two days.
            </p>
          </Card>
          <Btn className="w-full" onClick={() => navigate({ to: "/reviews" })}>
            Back to reviews
          </Btn>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Report review" subtitle={r.authorName} back="/reviews" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-1 text-muted-foreground">"{r.body}"</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold">What is wrong with it?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {flagReasons.map((f) => (
              <Chip key={f} active={reason === f} onClick={() => setReason(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </Card>

        <Card>
          <label htmlFor="detail" className="text-sm font-semibold">
            Anything else? (optional)
          </label>
          <textarea
            id="detail"
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="mt-2 w-full rounded-[16px] border border-border bg-background p-3 text-sm outline-none"
          />
        </Card>

        <Btn className="w-full" disabled={!reason} onClick={() => setSent(true)}>
          Send report
        </Btn>
        <p className="text-center text-1 text-muted-foreground">
          Disagreeing with a rating is not a reason on its own — use a public reply instead.
        </p>
      </div>
    </Screen>
  );
}
