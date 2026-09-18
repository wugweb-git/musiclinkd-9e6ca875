import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, EmptyState, Loading } from "@/components/ml/kit";
import { flagReasons } from "@/data/reviews";
import { listReviewsAboutMe } from "@/lib/reviews.functions";
import { fileReport } from "@/lib/reports.functions";

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
  // A review is reported by the person it's about, from the reviews they received.
  const load = useServerFn(listReviewsAboutMe);
  const report = useServerFn(fileReport);
  const q = useQuery({ queryKey: ["reviews", "about-me"], queryFn: () => load() });
  const found = (q.data ?? []).find((x) => x.id === id);
  const r = found ? { authorName: found.author_name, body: found.body } : undefined;
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const send = useMutation({
    mutationFn: () =>
      report({
        data: {
          subjectType: "review",
          subjectId: id,
          reason: reason!,
          ...(detail.trim() ? { detail: detail.trim() } : {}),
        },
      }),
    onError: () => toast.error("That didn't send. Try again."),
  });
  const sent = send.isSuccess;

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Report" back="/reviews" />
        <div className="px-5 pt-6">
          <Loading rows={2} />
        </div>
      </Screen>
    );
  }

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
            <h2 className="text-3 leading-tight">Thanks — the team will look at it</h2>
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
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none"
          />
        </Card>

        <Btn
          className="w-full"
          disabled={!reason}
          loading={send.isPending}
          onClick={() => send.mutate()}
        >
          Send report
        </Btn>
        <p className="text-center text-1 text-muted-foreground">
          Disagreeing with a rating is not a reason on its own — use a public reply instead.
        </p>
      </div>
    </Screen>
  );
}
