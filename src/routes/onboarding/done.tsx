import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { OnboardingProvider, useOnboarding, useScrollEdges } from "@/components/ml/onboarding";
import { beat, useArrival } from "@/lib/flow-motion";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";

/** A next-step card is a link: it takes the button's state layer and press scale. */
const nextCard =
  "state-layer block rounded-lg bg-subtle p-4 transition-transform duration-125 ease-standard active:scale-97";

export const Route = createFileRoute("/onboarding/done")({
  head: () => ({
    meta: [
      { title: "You're all set — MusicLinkd" },
      {
        name: "description",
        content:
          "Your MusicLinkd profile is live. Add portfolio work, discover talent or head to your home feed.",
      },
      { property: "og:title", content: "You're all set — MusicLinkd" },
      {
        property: "og:description",
        content: "Your profile is live. Add work, discover talent, start collaborating.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <Done />
    </OnboardingProvider>
  ),
});

function Done() {
  const { draft: d } = useOnboarding();
  const tx = useTaxonomy().options;
  const first = d.displayName.split(" ")[0];
  const rise = useArrival("onboarding-done") ? "animate-rise" : "";
  const edges = useScrollEdges();
  const summary = [
    d.primaryRole ? `Role: ${labelFor(tx?.person_types, d.primaryRole)}` : null,
    d.city ? `Based in ${d.city}` : null,
    d.genres.length
      ? d.genres
          .slice(0, 3)
          .map((g) => labelFor(tx?.genres, g))
          .join(", ")
      : null,
    d.availability.length ? `Open for ${d.availability.slice(0, 2).join(", ")}` : null,
  ].filter(Boolean) as string[];

  return (
    <Screen bottomNav={false} className="pb-40">
      <TopBar title="Welcome to MusicLinkd" back="/onboarding/complete" />

      <main className="px-5 pt-4">
        <section
          className={cn(
            "rounded-lg bg-card p-6 text-center border border-border/80 shadow-xs relative overflow-hidden",
            rise,
          )}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
            <Sparkles size={26} className="animate-pop" style={beat(2)} />
          </div>
          <h1 className="mt-4 text-3 font-bold tracking-tight text-foreground leading-tight">
            {first ? `Welcome aboard, ${first}!` : "Welcome aboard!"}
          </h1>
          <p className="mx-auto mt-2 max-w-[320px] text-sm text-muted-foreground leading-relaxed">
            Your profile is published and visible to talent scouts, venues, and producers across the
            network.
          </p>

          {summary.length ? (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {summary.map((line, i) => (
                <span
                  key={line}
                  className={cn(
                    "inline-flex items-center rounded-full bg-subtle px-3 py-1.5 text-1 font-semibold text-foreground border border-border/60 shadow-2xs",
                    rise,
                  )}
                  style={beat(2 + i)}
                >
                  {line}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <h2
          className={cn("mt-7 text-2 font-bold text-foreground", rise)}
          style={beat(2 + summary.length)}
        >
          Explore MusicLinkd
        </h2>
        <div className="mt-3 space-y-3">
          <Link
            to="/discover"
            className={cn(
              nextCard,
              "bg-card border border-border/80 shadow-xs hover:border-foreground/40",
              rise,
            )}
            style={beat(3 + summary.length)}
          >
            <p className="text-sm font-bold text-foreground">Discover Creators & Studios</p>
            <p className="mt-1 text-1 text-muted-foreground">
              Connect with singers, session musicians, recording spaces, and gear rental in your
              area.
            </p>
          </Link>
          <Link
            to="/profile"
            className={cn(
              nextCard,
              "bg-card border border-border/80 shadow-xs hover:border-foreground/40",
              rise,
            )}
            style={beat(4 + summary.length)}
          >
            <p className="text-sm font-bold text-foreground">Preview Public Profile</p>
            <p className="mt-1 text-1 text-muted-foreground">
              See how your published profile appears to the community.
            </p>
          </Link>
        </div>
      </main>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-app border-t bg-background/90 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-colors duration-200 ease-standard",
          edges.bottom ? "border-border shadow-xs" : "border-transparent",
        )}
      >
        <BtnLink to="/home" className="w-full h-12 text-sm font-semibold shadow-xs">
          Go to Home Feed
        </BtnLink>
      </div>
    </Screen>
  );
}
