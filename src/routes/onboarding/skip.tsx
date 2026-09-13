import { createFileRoute, Link } from "@tanstack/react-router";
import { PauseCircle } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { OnboardingProvider, resumeTarget, useOnboarding } from "@/components/ml/onboarding";
import { readiness } from "@/data/onboarding";

export const Route = createFileRoute("/onboarding/skip")({
  head: () => ({
    meta: [
      { title: "Finish your profile later — MusicLinkd" },
      {
        name: "description",
        content:
          "Pause setup without losing anything. We'll keep your answers and remind you what's still missing.",
      },
      { property: "og:title", content: "Finish your profile later — MusicLinkd" },
      {
        property: "og:description",
        content: "Pause your MusicLinkd profile setup and resume any time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <SkipLater />
    </OnboardingProvider>
  ),
});

function SkipLater() {
  const { draft } = useOnboarding();
  const missing = readiness(draft).filter((r) => !r.done);
  const target = resumeTarget(draft);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-16">
      <div>
        <PauseCircle size={40} className="text-primary" />
        <h1 className="mt-4 text-[28px] leading-tight">We've saved your progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can use MusicLinkd right away. An incomplete profile just shows up less in search and
          gets fewer enquiries.
        </p>

        <div className="mt-6 rounded-3xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Still missing</p>
          <ul className="mt-2 space-y-1.5">
            {missing.map((m) => (
              <li key={m.key} className="text-xs text-muted-foreground">
                · {m.label} — {m.hint}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            You'll find "Complete your profile" in Settings whenever you're ready.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <Link to="/onboarding/step/$id" params={{ id: target }} className="block">
          <Btn className="w-full">Continue setup</Btn>
        </Link>
        <Link to="/feed" className="block">
          <Btn variant="ghost" className="w-full">
            Explore MusicLinkd first
          </Btn>
        </Link>
      </div>
    </div>
  );
}
