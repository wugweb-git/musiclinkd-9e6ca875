import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/ml/ui";
import { workTypes } from "@/data/portfolio";

export const Route = createFileRoute("/portfolio/new/")({
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
  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-24">
      <TopBar title="Add work" subtitle="Step 1 of 3 · Choose a type" back="/portfolio" />
      <main className="px-5 pt-4">
        <h2 className="text-[20px] leading-tight">What would you like to add?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll only ask for the fields this kind of work needs.
        </p>

        <div className="mt-5 space-y-2">
          {workTypes.map((t) => (
            <Link
              key={t.kind}
              to="/portfolio/new/$kind"
              params={{ kind: t.kind }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-xl"
                style={{ background: "var(--surface-subtle)" }}
                aria-hidden
              >
                {t.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.blurb}</span>
              </span>
              <span aria-hidden className="text-muted-foreground">
                ›
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
