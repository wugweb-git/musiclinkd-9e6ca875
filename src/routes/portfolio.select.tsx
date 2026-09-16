import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Btn, BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { PortfolioSkeleton, StateCard } from "@/components/ml/portfolio";
import { demoPortfolio, workType, type PortfolioItem } from "@/data/portfolio";
import { listMyPortfolio } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio/select")({
  head: () => ({
    meta: [
      { title: "Choose work to share — MusicLinkd" },
      {
        name: "description",
        content:
          "Pick tracks, projects or performances from your portfolio to attach to a message or an application.",
      },
      { property: "og:title", content: "Choose work to share — MusicLinkd" },
      {
        property: "og:description",
        content: "Attach portfolio work to a conversation or an opportunity application.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioSelect,
});

function PortfolioSelect() {
  const { signedIn } = useAuth();
  const fetchItems = useServerFn(listMyPortfolio);
  const q = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => fetchItems() as Promise<PortfolioItem[]>,
    enabled: signedIn,
  });
  const items: PortfolioItem[] = signedIn ? (q.data ?? []) : demoPortfolio;
  const [picked, setPicked] = useState<string[]>([]);
  const selected = items.filter((i) => picked.includes(i.id));

  return (
    <Screen bottomNav={false} className="pb-40">
      <TopBar title="Share work" subtitle="Pick what to attach" back="/messages" />
      <main className="px-5 pt-4">
        {signedIn && q.isLoading ? <PortfolioSkeleton /> : null}

        {!q.isLoading && items.length === 0 ? (
          <StateCard
            title="No work to share yet"
            body="Add a track, project or performance and you can attach it to any conversation."
            action={<BtnLink to="/portfolio/new">Add Work</BtnLink>}
          />
        ) : null}

        <div className="space-y-3">
          {items.map((item) => {
            const on = picked.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setPicked((p) =>
                    p.includes(item.id) ? p.filter((x) => x !== item.id) : [...p, item.id],
                  )
                }
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left ${
                  on ? "border-primary" : "border-border"
                } bg-card`}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-xl"
                  style={{ background: "var(--surface-subtle)" }}
                  aria-hidden
                >
                  {workType(item.kind).emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {workType(item.kind).label}
                    {item.release_year ? ` · ${item.release_year}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm">{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>

        {selected.length ? (
          <section className="mt-6 rounded-lg border border-border bg-card p-4">
            <h2 className="text-[15px]">Preview</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {selected.map((s) => s.title).join(" · ")}
            </p>
          </section>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Btn
          className="w-full"
          onClick={() => {
            if (!selected.length) {
              toast.error("Pick at least one work");
              return;
            }
            toast.success(`${selected.length} work attached`);
          }}
        >
          Attach {selected.length ? `${selected.length} work` : "work"}
        </Btn>
      </div>
    </Screen>
  );
}
