import { createFileRoute } from "@tanstack/react-router";
import { PauseCircle } from "lucide-react";
import { BtnLink } from "@/components/ml/ui";
import { OnboardingProvider, resumeTarget, useOnboarding } from "@/components/ml/onboarding";
import { readiness } from "@/data/onboarding";
import { AuthLink } from "@/components/ml/auth";

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
  const { draft, bucket } = useOnboarding();
  const missing = readiness(draft).filter((r) => !r.done);
  const target = resumeTarget(draft, bucket);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-16">
      <div>
        <PauseCircle size={40} className="text-primary" />
        <h1 className="mt-4 text-3 leading-tight">We've saved your progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can use MusicLinkd right away. An incomplete profile just shows up less in search and
          gets fewer enquiries.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold">Still missing</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-1 text-muted-foreground">
            {missing.map((m) => (
              <li key={m.key}>
                <span className="font-medium text-foreground">{m.label}</span>. {m.hint}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-1 text-muted-foreground">
            You'll find "Complete your profile" in Settings whenever you're ready.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <BtnLink to="/onboarding/step/$id" params={{ id: target }} className="w-full">
          Continue Setup
        </BtnLink>
        <p className="flex justify-center pt-2 text-sm">
          <AuthLink to="/home" className="text-muted-foreground">
            Explore MusicLinkd First
          </AuthLink>
        </p>
      </div>
    </div>
  );
}
