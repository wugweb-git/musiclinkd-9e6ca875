import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";

import { AccountTypeCard, OnboardingProvider, resumeTarget, useOnboarding } from "@/components/ml/onboarding";
import { Btn } from "@/components/ml/ui";
import { visibleSteps } from "@/data/onboarding";
import { beat, useArrival } from "@/lib/flow-motion";
import { haptic } from "@/lib/haptics";
import { iconSize } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Select — MusicLinkd" },
      {
        name: "description",
        content: "Choose how you work in music and begin building your MusicLinkd profile.",
      },
      { property: "og:title", content: "Select — MusicLinkd" },
      {
        property: "og:description",
        content: "A focused, role-adaptive profile setup for music talent and businesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <SelectScreen />
    </OnboardingProvider>
  ),
});

const kindOrder = ["Talent", "Business"] as const;
type AccountKind = (typeof kindOrder)[number];

const kindInfo: Record<
  AccountKind,
  { estimate: string; goTo?: { to: "/business/new"; search: { step: "type" } } }
> = {
  Talent: { estimate: "About 2 minutes" },
  Business: {
    estimate: "About 3 minutes",
    goTo: { to: "/business/new", search: { step: "type" } },
  },
};

function SelectScreen() {
  const { draft, hydrated, bucket } = useOnboarding();
  const navigate = useNavigate();
  const total = visibleSteps(draft, bucket).length;
  const started = draft.completedSteps.length > 0;
  const rise = useArrival("onboarding-intro") ? "animate-rise" : "";
  const [kind, setKind] = useState<AccountKind | null>(null);

  function continueAs(next: AccountKind) {
    if (next === "Business") {
      const destination = kindInfo.Business.goTo;
      if (destination) void navigate({ to: destination.to, search: destination.search });
      return;
    }
    if (hydrated && started) {
      void navigate({ to: "/onboarding/resume" });
      return;
    }
    void navigate({ to: "/onboarding/step/$id", params: { id: resumeTarget(draft, bucket) } });
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <p className="truncate text-1 font-semibold text-muted-foreground">Profile setup</p>
        <p className="shrink-0 text-1 font-semibold text-foreground">1 of {total + 1}</p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className="h-full w-[8%] rounded-full bg-brand" />
      </div>

      <main className="flex flex-1 flex-col py-6">
        <h1 className={cn("text-4 font-bold text-foreground", rise)} style={beat(1)}>
          What brings you to MusicLinkd?
        </h1>
        <p className={cn("mt-2 text-2 leading-relaxed text-muted-foreground", rise)} style={beat(2)}>
          Choose the profile that best represents your work. You can add more later.
        </p>

        <div className={cn("mt-6 space-y-3", rise)} style={beat(2.5)}>
          <p className="text-1 font-semibold text-muted-foreground">Choose one</p>
          <AccountTypeCard
            title="Music Talent"
            description="Musician, singer, producer, writer"
            selected={kind === "Talent"}
            onSelect={() => {
              haptic("select");
              setKind("Talent");
            }}
          />
          <AccountTypeCard
            title="Business"
            description="Studio, label, agency, venue"
            selected={kind === "Business"}
            onSelect={() => {
              haptic("select");
              setKind("Business");
            }}
          />
          <AccountTypeCard
            title="Upcoming"
            description="A new account type is on the way"
            hollow
          />
        </div>

        <section className="mt-6 border-t border-border pt-4">
          <h2 className="text-sm font-semibold text-foreground">Why create a profile?</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Check size={iconSize.sm} className="mt-0.5 shrink-0 text-pink-strong" aria-hidden />
              <span>Show your work in one professional place</span>
            </li>
            <li className="flex gap-2">
              <Check size={iconSize.sm} className="mt-0.5 shrink-0 text-pink-strong" aria-hidden />
              <span>Be found for relevant projects and collaborations</span>
            </li>
          </ul>
        </section>
      </main>

      <div className="sticky bottom-0 -mx-5 border-t border-border bg-background/95 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Btn
          className="h-12 w-full text-sm font-semibold"
          disabled={!kind}
          onClick={() => {
            if (kind) continueAs(kind);
          }}
        >
          Continue
        </Btn>
        <p className="mt-2 text-center text-1 text-muted-foreground">
          {kind ? kindInfo[kind].estimate : "Select a profile type to continue"}
        </p>
      </div>
    </div>
  );
}