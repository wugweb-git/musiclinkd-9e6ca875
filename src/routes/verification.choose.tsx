import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ChevronRight } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Loading, StatusPill } from "@/components/ml/kit";
import { StateCard } from "@/components/ml/portfolio";
import { gateFor, useMyVerification } from "@/hooks/use-my-verification";
import { statusLabel, statusTone } from "@/data/verification";
import { TextLink } from "@/components/ml/links";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/verification/choose")({
  head: () => ({
    meta: [
      { title: "Choose a verification type | MusicLinkd" },
      {
        name: "description",
        content: "Compare identity, professional, business and studio verification on MusicLinkd.",
      },
      { property: "og:title", content: "Choose a verification type | MusicLinkd" },
      {
        property: "og:description",
        content: "What each badge verifies, what people see and what is required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChooseType,
});

function ChooseType() {
  const { types, requests, history, pending, error, retry } = useMyVerification();
  return (
    <Screen>
      <TopBar title="Get verified" subtitle="Pick the badge that fits you" back="/verification" />
      <div className="space-y-3 px-5 pt-4 pb-6">
        <p className="text-1 text-muted-foreground">
          Every badge is reviewed by a person. We only ask for what the badge actually proves.
        </p>

        {pending ? <Loading /> : null}
        {error ? (
          <StateCard
            tone="error"
            title="We couldn't load your verification"
            body="Check your connection and try again."
            action={<Btn onClick={retry}>Retry</Btn>}
          />
        ) : null}

        {(types ?? []).map((t) => {
          const req = requests.find((v) => v.type === t.key);
          const status = req?.status ?? "unverified";
          const gate = gateFor(t, history);
          const locked = !gate.allowed && status === "unverified";
          const body = (
            <Card className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2 leading-tight">{t.title}</h2>
                  <p className="mt-0.5 text-1 text-muted-foreground">{t.appliesTo}</p>
                </div>
                {locked ? (
                  <StatusPill
                    label="Locked"
                    tone="neutral"
                    icon={<Lock size={iconSize.xs} aria-hidden />}
                  />
                ) : (
                  <StatusPill label={statusLabel[status]} tone={statusTone[status]} />
                )}
              </div>

              <dl className="space-y-2 text-1">
                <div>
                  <dt className="text-1 uppercase tracking-wide text-muted-foreground">Verifies</dt>
                  <dd className="text-muted-foreground">{t.verifies}</dd>
                </div>
                <div>
                  <dt className="text-1 uppercase tracking-wide text-muted-foreground">
                    People see
                  </dt>
                  <dd className="text-muted-foreground">{t.whatOthersSee}</dd>
                </div>
                <div>
                  <dt className="text-1 uppercase tracking-wide text-muted-foreground">You need</dt>
                  <dd className="text-muted-foreground">
                    {t.requirements.map((r) => r.label).join(" · ")}
                  </dd>
                </div>
              </dl>

              {locked ? (
                <p className="rounded-[16px] bg-subtle px-3 py-2 text-1 text-muted-foreground">
                  {gate.reason}
                </p>
              ) : (
                <p className="flex items-center gap-1 text-1 font-semibold text-foreground">
                  {status === "unverified" ? "See requirements" : "Open request"}
                  <ChevronRight size={iconSize.sm} aria-hidden />
                </p>
              )}
            </Card>
          );

          if (locked) return <div key={t.key}>{body}</div>;
          return (
            <Link
              key={t.key}
              to="/verification/$type"
              params={{ type: t.key }}
              search={{ step: 0 }}
              className="block"
            >
              {body}
            </Link>
          );
        })}

        <Card className="py-3">
          <p className="text-1 font-semibold">Not sure which one?</p>
          <p className="mt-1 text-1 text-muted-foreground">
            Read{" "}
            <TextLink to="/help/$slug" params={{ slug: "how-verification-works" }}>
              how verification works
            </TextLink>{" "}
            or check <TextLink to="/verification/privacy">how your documents are used</TextLink>.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
