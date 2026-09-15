import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PartyPopper } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listMyPortfolio, saveMyProfile } from "@/lib/portfolio.functions";
import { draftToProfile } from "@/lib/profile-map";
import { useAuth } from "@/hooks/use-auth";
import { BtnLink, TopBar } from "@/components/ml/ui";
import {
  HandoffCard,
  OnboardingProvider,
  ReadinessCard,
  useOnboarding,
  useScrollEdges,
} from "@/components/ml/onboarding";
import { completionPercent, readiness } from "@/data/onboarding";
import { beat, useArrival } from "@/lib/flow-motion";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

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
  const listPortfolio = useServerFn(listMyPortfolio);
  const [hasWork, setHasWork] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    void (listPortfolio() as Promise<{ published: boolean }[]>)
      .then((w) => setHasWork(w.some((x) => x.published)))
      .catch(() => {});
  }, [signedIn, listPortfolio]);
  // The first work is published before this screen, so its row reads from the real portfolio.
  const items = readiness(d).map((r) => (r.key === "portfolio" ? { ...r, done: hasWork } : r));
  const tx = useTaxonomy().options;

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
  const first = d.displayName.split(" ")[0];
  const rise = useArrival("onboarding-complete") ? "animate-rise" : "";
  const edges = useScrollEdges();

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <TopBar title="Profile published" back="/onboarding/preview" />

      <main className="px-5 pt-4">
        <section className={cn("rounded-lg border border-border bg-card p-5", rise)}>
          <PartyPopper size={26} className="animate-pop text-primary" style={beat(2)} />
          <h1 className="mt-3 text-3 leading-tight">
            {first ? `You're on MusicLinkd, ${first}` : "You're on MusicLinkd"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your profile is live and discoverable. Everything below makes it work harder for you.
          </p>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-1">
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
              <div
                className="h-full origin-left animate-fill rounded-full bg-primary"
                style={{ width: `${pct}%`, ...beat(3) }}
              />
            </div>
          </div>
        </section>

        <h2 className={cn("mt-6 text-2", rise)} style={beat(3)}>
          What's ready
        </h2>
        <div className="mt-3 space-y-2">
          {items.map((r, i) => (
            <ReadinessCard
              key={r.key}
              className={rise}
              style={beat(4 + i)}
              label={r.label}
              hint={r.hint}
              done={r.done}
              {...(r.cta && r.to
                ? {
                    action: (
                      <BtnLink to={r.to} variant="outline">
                        {r.cta}
                      </BtnLink>
                    ),
                  }
                : {})}
            />
          ))}
        </div>

        <h2 className="mt-6 text-2">Next steps</h2>
        <div className="mt-3 space-y-3">
          {d.businessIntent ? (
            <HandoffCard
              title={`Set up your ${labelFor(tx?.person_types, d.businessIntent).toLowerCase()} profile`}
              body="Add your team, services and location so clients can book the business, not just you."
              action={
                <BtnLink to="/business/new" search={{ step: "type" }} className="w-full">
                  Start business setup
                </BtnLink>
              }
            />
          ) : null}
          <HandoffCard
            title="Verify your identity"
            body="Verified profiles rank higher in discovery and get more replies."
            action={
              <BtnLink to="/verification" className="w-full">
                Start verification
              </BtnLink>
            }
          />
        </div>
      </main>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app space-y-2 border-t bg-background/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-colors duration-200 ease-standard",
          edges.bottom ? "border-border" : "border-transparent",
        )}
      >
        <BtnLink to="/onboarding/done" className="w-full">
          Finish
        </BtnLink>
      </div>
    </div>
  );
}
