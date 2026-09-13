import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import {
  OnboardingProvider,
  resumeTarget,
  SyncBanner,
  useOnboarding,
} from "@/components/ml/onboarding";

import { steps, visibleSteps } from "@/data/onboarding";

export const Route = createFileRoute("/onboarding/resume")({
  head: () => ({
    meta: [
      { title: "Pick up where you left off — MusicLinkd" },
      {
        name: "description",
        content:
          "Your profile setup is saved. Continue from the exact question you stopped at, or start fresh.",
      },
      { property: "og:title", content: "Pick up where you left off — MusicLinkd" },
      { property: "og:description", content: "Resume your saved MusicLinkd profile setup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <Resume />
    </OnboardingProvider>
  ),
});

function Resume() {
  const { draft, reset, sync, retry, hydrated } = useOnboarding();
  const navigate = useNavigate();
  const target = resumeTarget(draft);
  const def = steps.find((s) => s.id === target);
  const list = visibleSteps(draft);
  const done = draft.completedSteps.length;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-16">
      <div>
        <SyncBanner
          state={hydrated ? sync : "loading"}
          onRetry={retry}
          localNote="Picking up from this device. Sign in to continue on any device."
        />
        <Clock size={40} className="text-primary" />
        <h1 className="mt-4 text-[28px] leading-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You finished {done} of {list.length} questions. Nothing was lost — carry on from{" "}
          <span className="font-semibold text-foreground">{def?.title ?? "the next step"}</span>.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Next up
          </p>
          <p className="mt-1 text-lg">{def?.title ?? "Review your profile"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {def?.subtitle ?? "One last look before publishing."}
          </p>
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-subtle"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={list.length}
            aria-label="Setup progress"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round((done / Math.max(1, list.length)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <Btn
          className="w-full"
          onClick={() => navigate({ to: "/onboarding/step/$id", params: { id: target } })}
        >
          Continue setup
        </Btn>
        <Btn
          variant="ghost"
          className="w-full"
          onClick={() => {
            reset();
            navigate({ to: "/onboarding" });
          }}
        >
          Start over
        </Btn>
      </div>
    </div>
  );
}
