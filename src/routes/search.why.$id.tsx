import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Info, ShieldCheck } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Dialog, StatusPill, Row } from "@/components/ml/kit";
import { getWhy } from "@/data/search-meta";
import { feedbackOptions } from "@/data/recommendations";

export const Route = createFileRoute("/search/why/$id")({
  head: () => ({
    meta: [
      { title: "Why am I seeing this? | MusicLinkd" },
      {
        name: "description",
        content:
          "The exact signals behind a MusicLinkd recommendation, what is never used, and how to change it.",
      },
      { property: "og:title", content: "Why am I seeing this? | MusicLinkd" },
      {
        property: "og:description",
        content: "Every recommendation on MusicLinkd can be explained and adjusted.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WhyThisResult,
});

const weightTone = { strong: "brand", medium: "neutral", light: "neutral" } as const;
const weightLabel = { strong: "Strong match", medium: "Contributing", light: "Minor" } as const;

function WhyThisResult() {
  const { id } = Route.useParams();
  const why = getWhy(id);
  const [sent, setSent] = useState<string | null>(null);

  return (
    <Screen>
      <TopBar title="Why am I seeing this" subtitle={why.subject} back="/recommendations" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <Info size={16} className="shrink-0 text-primary" aria-hidden />
            <h2 className="min-w-0 text-2 leading-tight">{why.headline}</h2>
          </div>
          <p className="text-1 text-muted-foreground">
            Ranking is never a black box here. These are the signals, strongest first.
          </p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-2">What was used</h2>
          {why.signals.map((s) => (
            <div key={s.label} className="rounded-md bg-subtle px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold">{s.label}</p>
                <StatusPill label={weightLabel[s.weight]} tone={weightTone[s.weight]} />
              </div>
              <p className="mt-1 text-1 text-text2">{s.detail}</p>
            </div>
          ))}
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0 text-primary" aria-hidden />
            <h2 className="text-2">What is never used</h2>
          </div>
          <ul className="space-y-1.5">
            {why.notUsed.map((n) => (
              <li key={n} className="text-1 text-text2">
                {n}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-2">Not a good match?</h2>
          <p className="text-1 text-muted-foreground">
            Tell us why and this kind of result moves down.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {feedbackOptions.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSent(f)}
                className="min-h-11 rounded-full border border-border bg-card px-4 text-xs font-semibold"
              >
                {f}
              </button>
            ))}
          </div>
        </Card>

        <Row
          title="Recommendation settings"
          subtitle="Choose which signals we may use"
          to="/recommendations/settings"
        />
        <Row title="Privacy settings" subtitle="Control what your profile shares" to="/settings/privacy" />
      </div>

      <Dialog
        open={!!sent}
        title="Thanks — noted"
        body={`We will show fewer results like this. Reason recorded: ${sent ?? ""}.`}
        onClose={() => setSent(null)}
      >
        <Link to="/recommendations">
          <Btn className="w-full">Back to recommendations</Btn>
        </Link>
        <Btn variant="ghost" onClick={() => setSent(null)}>
          Stay here
        </Btn>
      </Dialog>
    </Screen>
  );
}
