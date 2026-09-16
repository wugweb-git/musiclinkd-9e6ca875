import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { WorkTypeIcon } from "@/components/ml/portfolio";
import { workTypes } from "@/data/portfolio";
import { beat, useArrival } from "@/lib/flow-motion";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";

type FlowSearch = { from?: "onboarding" };

export const Route = createFileRoute("/portfolio/new/")({
  // `from=onboarding`: the new user's first work, between the last question and Review profile.
  validateSearch: (search: Record<string, unknown>): FlowSearch =>
    search["from"] === "onboarding" ? { from: "onboarding" } : {},
  head: () => ({
    meta: [
      { title: "Add work — MusicLinkd portfolio" },
      {
        name: "description",
        content:
          "Add a track, album, video, performance, project, client work or credit to your MusicLinkd portfolio.",
      },
      { property: "og:title", content: "Add work — MusicLinkd portfolio" },
      { property: "og:description", content: "Choose the kind of work you want to showcase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddWork,
});

function AddWork() {
  const { from } = Route.useSearch();
  const onboarding = from === "onboarding";
  const rise = useArrival("add-work") ? "animate-rise" : "";
  return (
    <Screen bottomNav={false} className="pb-24">
      <TopBar
        title={onboarding ? "Your first work" : "Add work"}
        subtitle="Step 1 of 3 · Choose a type"
        back={onboarding ? "/onboarding/step/contact" : "/portfolio"}
      />
      <main className="px-5 pt-4">
        <h2 className="text-3 leading-tight">What would you like to add?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll only ask for the fields this kind of work needs.
        </p>

        <div className="mt-5 space-y-2">
          {workTypes.map((t, i) => (
            <Link
              key={t.kind}
              to="/portfolio/new/$kind"
              params={{ kind: t.kind }}
              search={onboarding ? { from: "onboarding" } : {}}
              className={cn(
                "state-layer flex items-center gap-3 rounded-lg bg-subtle p-4 transition-transform duration-125 ease-standard active:scale-97",
                rise,
              )}
              style={beat(i / 2)}
            >
              <WorkTypeIcon kind={t.kind} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block truncate text-1 text-muted-foreground">{t.blurb}</span>
              </span>
              <ChevronRight size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      </main>
    </Screen>
  );
}
