import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { WorkForm } from "@/components/ml/work-form";
import { workType } from "@/data/portfolio";
import { useAuth } from "@/hooks/use-auth";

type FlowSearch = { from?: "onboarding" };

export const Route = createFileRoute("/portfolio/new/$kind")({
  // `from=onboarding`: the new user's first work, between the last question and Review profile.
  validateSearch: (search: Record<string, unknown>): FlowSearch =>
    search["from"] === "onboarding" ? { from: "onboarding" } : {},
  head: () => ({
    meta: [
      { title: "Describe your work — MusicLinkd portfolio" },
      {
        name: "description",
        content:
          "Add the title, role, credits, media and visibility for this piece of portfolio work.",
      },
      { property: "og:title", content: "Describe your work — MusicLinkd portfolio" },
      { property: "og:description", content: "Title, role, credits, media and visibility." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewWork,
});

function NewWork() {
  const { kind } = Route.useParams();
  const { from } = Route.useSearch();
  const { signedIn } = useAuth();
  const t = workType(kind);

  return (
    <Screen bottomNav={false} className="bg-background pb-32">
      <TopBar
        title={from === "onboarding" ? "Add your first work" : `New ${t.label.toLowerCase()}`}
        subtitle="Step 1 of 2 · Details"
        back="/portfolio"
      />
      <main className="px-4 pt-3">
        <div className="mb-5 border-b border-border pb-4">
          <p className="text-1 font-semibold tracking-[0.14em] text-primary">SHOW YOUR WORK</p>
          <h1 className="mt-1 text-3 font-semibold tracking-tight text-foreground">
            Add something you&apos;re proud of.
          </h1>
          <p className="mt-1 max-w-[30rem] text-sm leading-5 text-muted-foreground">
            Share a link and we&apos;ll build the presentation around it.
          </p>
        </div>
        <WorkForm kind={kind} signedIn={signedIn} fromOnboarding={from === "onboarding"} />
      </main>
    </Screen>
  );
}
