import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { PartyPopper } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { saveMyProfile } from "@/lib/portfolio.functions";
import { draftToProfile } from "@/lib/profile-map";
import { useAuth } from "@/hooks/use-auth";
import { BtnLink, TopBar } from "@/components/ml/ui";
import {
  HandoffCard,
  OnboardingProvider,
  ReadinessCard,
  useOnboarding,
} from "@/components/ml/onboarding";
import { completionPercent, readiness } from "@/data/onboarding";

export const Route = createFileRoute("/onboarding/complete")({
  head: () => ({
    meta: [
      { title: "Your profile is live — MusicLinkd" },
      {
        name: "description",
        content:
          "Your MusicLinkd profile is published. See what's ready, what's missing and the next step that gets you hired.",
      },
      { property: "og:title", content: "Your profile is live — MusicLinkd" },
      { property: "og:description", content: "What's ready on your profile and what to do next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <Complete />
    </OnboardingProvider>
  ),
});

function Complete() {
  const { draft: d, hydrated } = useOnboarding();
  const { signedIn } = useAuth();
  const persist = useServerFn(saveMyProfile);
  const savedRef = useRef(false);
  const items = readiness(d);

  // Persist the finished profile once for signed-in users; drafts stay local.
  useEffect(() => {
    if (!hydrated || !signedIn || savedRef.current) return;
    savedRef.current = true;
    void persist({
      data: { ...draftToProfile(d), onboarding_complete: true, onboarding_step: null },
    }).catch(() => {
      savedRef.current = false;
    });
  }, [hydrated, signedIn, persist, d]);
  const pct = completionPercent(d);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <TopBar title="Profile published" back="/onboarding/preview" />

      <main className="px-5 pt-4">
        <section className="rounded-lg border border-border bg-card p-5">
          <PartyPopper size={26} className="text-primary" />
          <h1 className="mt-3 text-[24px] leading-tight">
            You're on MusicLinkd, {d.displayName.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your profile is live and discoverable. Everything below makes it work harder for you.
          </p>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold">Profile strength</span>
              <span className="tabular-nums text-muted-foreground">{pct}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-subtle"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile strength"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        <h2 className="mt-6 text-[17px]">What's ready</h2>
        <div className="mt-3 space-y-2">
          {items.map((r) => (
            <ReadinessCard
              key={r.key}
              label={r.label}
              hint={r.hint}
              done={r.done}
              {...(r.flow ? { flow: r.flow } : {})}
              {...(r.cta
                ? {
                    action: (
                      <BtnLink to="/me" variant="outline">
                        {r.cta}
                      </BtnLink>
                    ),
                  }
                : {})}
            />
          ))}
        </div>

        <h2 className="mt-6 text-[17px]">Next steps</h2>
        <div className="mt-3 space-y-3">
          <HandoffCard
            flow="FLOW 03"
            title="Add your portfolio"
            body="Tracks, videos and credits are what turn a profile view into an enquiry."
            action={
              <BtnLink to="/portfolio/new" className="w-full">
                Add work
              </BtnLink>
            }
          />
          {d.businessIntent ? (
            <HandoffCard
              flow="FLOW 12"
              title={`Set up your ${d.businessIntent.toLowerCase()} profile`}
              body="Add your team, services and location so clients can book the business, not just you."
              action={
                <BtnLink to="/categories" className="w-full">
                  Start business setup
                </BtnLink>
              }
            />
          ) : null}
          {d.bandIntent ? (
            <HandoffCard
              flow="FLOW 15"
              title="Create your band profile"
              body="A shared profile with members, shows and a joint calendar."
              action={
                <BtnLink to="/bands/new" className="w-full">
                  Create band
                </BtnLink>
              }
            />
          ) : null}
          <HandoffCard
            flow="FLOW 16"
            title="Verify your identity"
            body="Verified profiles rank higher in discovery and get more replies."
            action={
              <BtnLink to="/me" className="w-full">
                Start verification
              </BtnLink>
            }
          />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] space-y-2 border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <BtnLink to="/onboarding/done" className="w-full">
          Finish
        </BtnLink>
      </div>
    </div>
  );
}
