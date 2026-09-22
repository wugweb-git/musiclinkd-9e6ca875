import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PartyPopper } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listMyPortfolio, saveMyProfile } from "@/lib/portfolio.functions";
import { draftToProfile } from "@/lib/profile-map";
import { useAuth } from "@/hooks/use-auth";
import { BtnLink, Screen, TopBar } from "@/components/ml/ui";
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
import { iconSize } from "@/lib/tokens";

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
    <Screen bottomNav={false} className="pb-32">
      <TopBar title="Profile published" back="/onboarding/preview" />

      <main className="px-5 pt-4">
        <section
          className={cn(
            "rounded-lg bg-card p-6 border border-border/80 shadow-xs relative overflow-hidden",
            rise,
          )}
        >
          {/* Subtle sonic celebration glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-container/40 blur-xl"
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-container text-pink-strong shadow-xs">
                <PartyPopper size={24} className="animate-pop" style={beat(2)} />
              </span>
              <span className="rounded-full bg-subtle px-3 py-1 text-1 font-bold text-foreground">
                Profile Live
              </span>
            </div>

            <h1 className="mt-4 text-3 font-bold tracking-tight text-foreground leading-tight">
              {first
                ? `You're officially on MusicLinkd, ${first}!`
                : "You're officially on MusicLinkd!"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Your profile is live and searchable across India. Complete the steps below to maximize
              your visibility.
            </p>

            <div className="mt-5 rounded-md bg-subtle p-3.5 border border-border/60">
              <div className="flex items-baseline justify-between text-1">
                <span className="font-semibold text-foreground">Profile Strength</span>
                <span className="tabular-nums font-bold text-foreground">{pct}%</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-background"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile strength"
              >
                <div
                  className="h-full origin-left animate-fill rounded-full bg-foreground transition-all duration-500"
                  style={{ width: `${pct}%`, ...beat(3) }}
                />
              </div>
            </div>
          </div>
        </section>

        <h2 className={cn("mt-7 text-2 font-bold text-foreground", rise)} style={beat(3)}>
          What's ready on your profile
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
                      <BtnLink to={r.to} variant="outline" className="text-xs h-8 px-3">
                        {r.cta}
                      </BtnLink>
                    ),
                  }
                : {})}
            />
          ))}
        </div>

        <h2 className="mt-7 text-2 font-bold text-foreground">Next recommended steps</h2>
        <div className="mt-3 space-y-3">
          {d.businessIntent ? (
            <HandoffCard
              title={`Set up your ${labelFor(tx?.person_types, d.businessIntent).toLowerCase()} profile`}
              body="Your business gets its own page, team roster, and bookings. Switch seamlessly between personal and business from the top menu."
              action={
                <BtnLink
                  to="/business/new"
                  search={{ step: "type" }}
                  className="w-full h-11 text-sm font-semibold"
                >
                  Start Business Setup
                </BtnLink>
              }
            />
          ) : null}
          <HandoffCard
            title="Verify your music identity"
            body="Verified creators get the verified checkmark, priority search ranking, and higher response rates."
            action={
              <BtnLink to="/verification" className="w-full h-11 text-sm font-semibold">
                Start Identity Verification
              </BtnLink>
            }
          />
        </div>
      </main>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-app space-y-2 border-t bg-background/90 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-colors duration-200 ease-standard",
          edges.bottom ? "border-border shadow-xs" : "border-transparent",
        )}
      >
        <BtnLink to="/onboarding/done" className="w-full h-12 text-sm font-semibold shadow-xs">
          Finish & View Dashboard
        </BtnLink>
      </div>
    </Screen>
  );
}
