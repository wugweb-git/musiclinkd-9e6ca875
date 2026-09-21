import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Info, ShieldCheck } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, Loading, StatusPill, Row } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import {
  explainResult,
  listMySearchFeedback,
  type ResultKind,
  type WhySignal,
} from "@/lib/global-search.functions";
import { FEEDBACK_REASONS, sendSearchFeedback, type FeedbackReason } from "@/lib/search-feedback";
import { iconSize } from "@/lib/tokens";

/*
 * Why one search result came up: read from the result itself (which of its fields hold the words
 * typed) and from how its kind is ordered — nothing else goes into search. "Not a good match" is
 * stored (search_feedback), and a signed-in person's own answers move that result down in their
 * later searches.
 */

const KINDS: ResultKind[] = [
  "person",
  "business",
  "studio",
  "collab",
  "opportunity",
  "listing",
  "service",
];

type WhyParams = { kind: ResultKind; q?: string };

export const Route = createFileRoute("/search/why/$id")({
  validateSearch: (search: Record<string, unknown>): WhyParams => {
    const kind = KINDS.includes(search["kind"] as ResultKind)
      ? (search["kind"] as ResultKind)
      : "person";
    return typeof search["q"] === "string" && search["q"] ? { kind, q: search["q"] } : { kind };
  },
  head: () => ({
    meta: [
      { title: "Why am I seeing this? | MusicLinkd" },
      {
        name: "description",
        content:
          "The exact signals behind a MusicLinkd search result, what is never used, and how to change it.",
      },
      { property: "og:title", content: "Why am I seeing this? | MusicLinkd" },
      {
        property: "og:description",
        content: "Every search result on MusicLinkd can be explained and adjusted.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WhyThisResult,
});

const weightTone = { strong: "brand", medium: "neutral", light: "neutral" } as const;
const weightLabel = { strong: "Strong match", medium: "Contributing", light: "Minor" } as const;

/** What search never reads — true of every query /search runs. */
const NOT_USED = ["Your messages", "Your payment history", "Anything from your contacts"];

function WhyThisResult() {
  const { id } = Route.useParams();
  const { kind, q } = Route.useSearch();
  const { signedIn } = useAuth();
  const explain = useServerFn(explainResult);
  const why = useQuery({
    queryKey: ["search", "why", kind, id, q ?? ""],
    queryFn: () => explain({ data: { kind, id, ...(q ? { q } : {}) } }),
  });
  const fetchFeedback = useServerFn(listMySearchFeedback);
  const feedback = useQuery({
    queryKey: ["search", "feedback"],
    queryFn: () => fetchFeedback().catch((): string[] => []),
    enabled: signedIn,
  });
  const [sent, setSent] = useState<{ label: string; stored: boolean } | null>(null);
  const [sending, setSending] = useState<FeedbackReason | null>(null);

  const back = { to: "/search" as const, search: q ? { q } : {} };
  const flagged = feedback.data?.includes(`${kind}:${id}`) ?? false;
  const signals: WhySignal[] = [
    ...(why.data?.signals ?? []),
    ...(flagged
      ? [
          {
            label: "Your feedback",
            detail: "You said this was not a good match, so it shows after the rest for you",
            weight: "strong" as const,
          },
        ]
      : []),
  ];
  // "Your word in the name", "Your words in the city" → "name", "city".
  const fields = signals
    .map((s) => /^Your words? in the (.+)$/.exec(s.label)?.[1])
    .filter((f): f is string => Boolean(f));
  const where =
    fields.length > 1 ? `${fields.slice(0, -1).join(", ")} and ${fields.at(-1)}` : fields[0];

  const give = async (reason: FeedbackReason, label: string) => {
    setSending(reason);
    const stored = await sendSearchFeedback({ kind, id, reason, ...(q ? { query: q } : {}) });
    setSending(null);
    if (stored) void feedback.refetch();
    setSent({ label, stored });
  };

  return (
    <Screen>
      <TopBar
        title="Why am I seeing this"
        subtitle={why.data?.title ?? "This result"}
        back="/search"
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {why.isLoading ? (
          <Loading />
        ) : !why.data ? (
          <EmptyState
            title={why.isError ? "We couldn't load this" : "This result is gone"}
            body={
              why.isError
                ? "Check your connection, then try again."
                : "It may have been removed or made private."
            }
          >
            <BtnLink {...back} className="w-full">
              Back to Search
            </BtnLink>
          </EmptyState>
        ) : (
          <>
            <Card className="space-y-2">
              <div className="flex items-center gap-2">
                <Info size={iconSize.sm} className="shrink-0 text-primary" aria-hidden />
                <h2 className="min-w-0 text-2 leading-tight">
                  {q
                    ? `Matched “${q}”${where ? ` in the ${where}` : ""}`
                    : "Came up without a search"}
                </h2>
              </div>
              <p className="text-1 text-muted-foreground">
                Ranking is never a black box here. These are the signals, strongest first.
              </p>
            </Card>

            <Card className="space-y-3">
              <h2 className="text-2">What was used</h2>
              {[...signals]
                .sort((a, b) => order[a.weight] - order[b.weight])
                .map((s) => (
                  <div key={s.label} className="rounded-lg bg-subtle px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-semibold">{s.label}</p>
                      <StatusPill label={weightLabel[s.weight]} tone={weightTone[s.weight]} />
                    </div>
                    <p className="mt-1 text-1 text-muted-foreground">{s.detail}</p>
                  </div>
                ))}
            </Card>

            <Card className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={iconSize.sm} className="shrink-0 text-primary" aria-hidden />
                <h2 className="text-2">What is never used</h2>
              </div>
              <ul className="space-y-1.5">
                {NOT_USED.map((n) => (
                  <li key={n} className="text-1 text-muted-foreground">
                    {n}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="space-y-2">
              <h2 className="text-2">Not a good match?</h2>
              <p className="text-1 text-muted-foreground">
                {signedIn
                  ? "Tell us why and this result moves down in your searches."
                  : "Tell us why. Sign in and this result also moves down in your searches."}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {FEEDBACK_REASONS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    disabled={sending !== null}
                    aria-busy={sending === f.key || undefined}
                    onClick={() => void give(f.key, f.label)}
                    className="min-h-touch rounded-full border border-border bg-card px-4 text-1 font-semibold disabled:opacity-50"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        <Row
          title="Recommendation settings"
          subtitle="Choose which signals we may use"
          to="/settings"
        />
        <Row
          title="Privacy settings"
          subtitle="Control what your profile shares"
          to="/settings/privacy"
        />
      </div>

      <Dialog
        open={!!sent}
        title={sent?.stored ? "Thanks — noted" : "That didn't go through"}
        body={
          sent?.stored
            ? `${signedIn ? "This result now shows after the rest in your searches. " : ""}Reason recorded: ${sent.label}.`
            : "Your answer wasn't kept. Check your connection, then try again."
        }
        onClose={() => setSent(null)}
      >
        <BtnLink {...back} className="w-full">
          Back to Search
        </BtnLink>
        <Btn variant="ghost" onClick={() => setSent(null)}>
          Stay Here
        </Btn>
      </Dialog>
    </Screen>
  );
}

const order = { strong: 0, medium: 1, light: 2 } as const;
