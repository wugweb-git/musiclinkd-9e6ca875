import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/ml/ui";
import { WorkForm } from "@/components/ml/work-form";
import { SignedOutCard } from "@/components/ml/portfolio";
import { workType } from "@/data/portfolio";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio/new/$kind")({
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
  const { signedIn, loading } = useAuth();
  const t = workType(kind);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-8">
      <TopBar title={`New ${t.label.toLowerCase()}`} subtitle="Step 2 of 3 · Details" back="/portfolio/new" />
      <main className="px-5 pt-4">
        {!signedIn && !loading ? (
          <div className="mb-5">
            <SignedOutCard what="new work" />
          </div>
        ) : null}
        <WorkForm kind={kind} signedIn={signedIn} />
      </main>
    </div>
  );
}
