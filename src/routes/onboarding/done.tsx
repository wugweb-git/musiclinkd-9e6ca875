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
        <section className={cn("rounded-lg bg-subtle p-6 text-center", rise)}>
          <Sparkles size={iconSize.xl} className="mx-auto animate-pop text-primary" style={beat(2)} />
          <h1 className="mt-3 text-3 leading-tight">
            {first ? `Welcome aboard, ${first}` : "Welcome aboard"}
          </h1>
          <p className="mx-auto mt-2 max-w-[300px] text-sm text-muted-foreground">
            Your profile is live and people can find you.
            {summary.length ? " Here's what it says right now." : null}
          </p>
        </section>

        {summary.length ? (
          <ul className="mt-4 space-y-2">
            {summary.map((line, i) => (
              <li
                key={line}
                className={cn("rounded-lg bg-subtle px-4 py-3 text-sm", rise)}
                style={beat(2 + i)}
              >
                {line}
              </li>
            ))}
          </ul>
        ) : null}

        <h2 className={cn("mt-7 text-2", rise)} style={beat(2 + summary.length)}>
          What next
        </h2>
        <div className="mt-3 space-y-3">
          <Link to="/discover" className={cn(nextCard, rise)} style={beat(3 + summary.length)}>
            <p className="text-sm font-semibold">Discover talent</p>
            <p className="mt-1 text-1 text-muted-foreground">
              Singers, producers, studios and bands near you.
            </p>
          </Link>
          <Link to="/profile" className={cn(nextCard, rise)} style={beat(4 + summary.length)}>
            <p className="text-sm font-semibold">View my profile</p>
            <p className="mt-1 text-1 text-muted-foreground">See exactly what others see.</p>
          </Link>
        </div>
      </main>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-app border-t bg-background/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-colors duration-200 ease-standard",
          edges.bottom ? "border-border" : "border-transparent",
        )}
      >
        <BtnLink to="/home" className="w-full">
          Go to My Home
        </BtnLink>
      </div>
    </Screen>
  );
}
