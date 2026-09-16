import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Row } from "@/components/ml/kit";
import { recPreferences } from "@/data/recommendations";

export const Route = createFileRoute("/recommendations/settings")({
  head: () => ({
    meta: [
      { title: "Recommendation Settings | MusicLinkd" },
      {
        name: "description",
        content: "Choose what MusicLinkd uses to recommend people, spaces, gear and work to you.",
      },
      { property: "og:title", content: "Recommendation Settings | MusicLinkd" },
      { property: "og:description", content: "Control what powers your recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecSettings,
});

function RecSettings() {
  const [prefs, setPrefs] = useState(recPreferences);

  return (
    <Screen bottomNav={false}>
      <TopBar title="Recommendation settings" back="/recommendations" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card className="space-y-3">
          <h2 className="text-[15px]">What we use</h2>
          {prefs.map((p) => (
            <button
              key={p.key}
              type="button"
              role="switch"
              aria-checked={p.on}
              onClick={() =>
                setPrefs((list) => list.map((x) => (x.key === p.key ? { ...x, on: !x.on } : x)))
              }
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{p.label}</span>
                <span className="block truncate text-[12px] text-muted-foreground">{p.hint}</span>
              </span>
              <span
                className={`flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ${p.on ? "bg-primary" : "bg-subtle"}`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-background transition-transform ${p.on ? "translate-x-5" : ""}`}
                />
              </span>
            </button>
          ))}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-[15px]">Reset</h2>
          <p className="text-[12px] text-muted-foreground">
            Clearing feedback brings back everything you hid and rebuilds your suggestions from your
            profile.
          </p>
          <Btn variant="outline" className="w-full">
            Clear Recommendation Feedback
          </Btn>
        </Card>

        <div className="space-y-2">
          <Row title="Saved items" subtitle="Saved profiles, listings and spaces" to="/saved" />
          <Row
            title="Discover"
            subtitle="Browse everything without personalisation"
            to="/discover"
          />
          <BtnLink
            to="/help/$slug"
            params={{ slug: "profile-that-gets-booked" }}
            variant="ghost"
            className="w-full"
          >
            How Recommendations Are Built
          </BtnLink>
        </div>
      </div>
    </Screen>
  );
}
