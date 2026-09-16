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
    <Screen bottomNav={false} className="pb-32">
      <TopBar
        title={`New ${t.label.toLowerCase()}`}
        subtitle="Step 2 of 3 · Details"
        back="/portfolio/new"
      />
      <main className="px-5 pt-4">
        <WorkForm kind={kind} signedIn={signedIn} fromOnboarding={from === "onboarding"} />
      </main>
    </Screen>
  );
}
