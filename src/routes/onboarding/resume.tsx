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
import { AuthTextButton } from "@/components/ml/auth";

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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[414px] flex-col justify-between bg-warm px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-12">
      <div>
        <SyncBanner state={hydrated ? sync : "loading"} onRetry={retry} />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-foreground border border-border/80 shadow-xs">
          <Clock size={24} />
        </div>

        <h1 className="mt-4 text-3 font-bold text-foreground leading-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          You have completed {done} of {list.length} questions. Your progress is saved.
        </p>

        <div className="mt-6 rounded-lg bg-card p-5 border border-border/80">
          <span className="inline-block rounded-full bg-subtle px-2.5 py-0.5 text-1 font-bold text-foreground">
            Next question
          </span>
          <p className="mt-2 text-2 font-bold text-foreground">
            {def?.title ?? "Review your profile"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {def?.subtitle ?? "One last look before publishing."}
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-1 font-semibold text-muted-foreground mb-1.5">
              <span>Setup progress</span>
              <span className="text-foreground font-bold">
                {Math.round((done / Math.max(1, list.length)) * 100)}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-background"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={list.length}
              aria-label="Setup progress"
            >
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{ width: `${Math.round((done / Math.max(1, list.length)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-2.5">
        <Btn
          className="w-full h-12 text-sm font-semibold"
          onClick={() => navigate({ to: "/setup/$step", params: { step: target } })}
        >
          Continue Setup
        </Btn>
        <p className="flex justify-center pt-1 text-sm">
          <AuthTextButton
            className="text-muted-foreground hover:text-foreground font-medium"
            onClick={() => {
              reset();
              navigate({ to: "/onboarding" });
            }}
          >
            Start Over from Scratch
          </AuthTextButton>
        </p>
      </div>
    </div>
  );
}
