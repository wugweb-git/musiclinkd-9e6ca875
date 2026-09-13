import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, TopBar } from "@/components/ml/ui";
import { visibilityOptions } from "@/data/portfolio";

export const Route = createFileRoute("/portfolio/settings")({
  head: () => ({
    meta: [
      { title: "Portfolio settings — MusicLinkd" },
      {
        name: "description",
        content:
          "Control who can see your portfolio, how work is ordered and which media plays first.",
      },
      { property: "og:title", content: "Portfolio settings — MusicLinkd" },
      { property: "og:description", content: "Visibility, ordering and media preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioSettings,
});

function PortfolioSettings() {
  const [visibility, setVisibility] = useState("public");
  const [ordering, setOrdering] = useState("custom");
  const [autoplay, setAutoplay] = useState(false);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-24">
      <TopBar title="Portfolio settings" back="/portfolio" />
      <main className="px-5 pt-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Portfolio visibility
        </h2>
        <div className="mt-2 space-y-2">
          {visibilityOptions.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={visibility === v.value}
              onClick={() => setVisibility(v.value)}
              className={`w-full rounded-lg border p-4 text-left ${
                visibility === v.value ? "border-primary bg-card" : "border-border bg-card"
              }`}
            >
              <span className="block text-sm font-semibold">{v.label}</span>
              <span className="block text-xs text-muted-foreground">{v.blurb}</span>
            </button>
          ))}
        </div>

        <h2 className="mt-7 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Default ordering
        </h2>
        <div className="mt-2 space-y-2">
          {[
            { key: "custom", label: "My custom order", blurb: "Use the order you set in Reorder." },
            { key: "recent", label: "Most recent first", blurb: "Newest work at the top." },
            {
              key: "featured",
              label: "Featured first",
              blurb: "Featured work leads, then recent.",
            },
          ].map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={ordering === o.key}
              onClick={() => setOrdering(o.key)}
              className={`w-full rounded-lg border p-4 text-left ${
                ordering === o.key ? "border-primary bg-card" : "border-border bg-card"
              }`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.blurb}</span>
            </button>
          ))}
        </div>

        <h2 className="mt-7 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Media
        </h2>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="pr-4">
            <p className="text-sm font-semibold">Preview audio automatically</p>
            <p className="text-xs text-muted-foreground">Off by default to save mobile data.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoplay}
            aria-label="Preview audio automatically"
            onClick={() => setAutoplay((a) => !a)}
            className="h-7 w-12 shrink-0 rounded-full border border-border"
            style={{ background: autoplay ? "var(--primary)" : "var(--surface-subtle)" }}
          >
            <span
              className="block h-5 w-5 rounded-full bg-card transition-transform"
              style={{ transform: autoplay ? "translateX(24px)" : "translateX(3px)" }}
            />
          </button>
        </div>

        <div className="mt-8 flex gap-2">
          <Link to="/portfolio" className="flex-1">
            <Btn className="w-full">Done</Btn>
          </Link>
        </div>
      </main>
    </div>
  );
}
