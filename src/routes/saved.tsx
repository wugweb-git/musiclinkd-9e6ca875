import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { Chip, Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import { Rate } from "@/components/ml/kit";
import { talents, studios } from "@/data/discover";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Profiles | MusicLinkd" },
      {
        name: "description",
        content:
          "Your shortlist of talent, bands, studios, businesses and events with notes and tags.",
      },
      { property: "og:title", content: "Saved Profiles | MusicLinkd" },
      {
        property: "og:description",
        content: "Shortlist talent and studios with private notes and tags.",
      },
    ],
  }),
  component: Saved,
});

const tabs = ["Talent", "Bands", "Studios", "Businesses", "Events"];

function Saved() {
  const [tab, setTab] = useState("Talent");
  return (
    <Screen>
      <TopBar title="Saved profiles" back="/discover" />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5">
        {tab === "Studios"
          ? studios.map((s) => (
              <article key={s.name} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <img src={s.photo} alt={s.name} className="h-14 w-14 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm">{s.name}</h3>
                    <p className="truncate text-1 text-muted-foreground">{s.location}</p>
                  </div>
                  <Rate {...s.rate} size="sm" />
                </div>
                <Actions />
              </article>
            ))
          : talents.slice(0, 3).map((t) => (
              <article key={t.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <img src={t.photo} alt={t.name} className="h-14 w-14 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="truncate text-sm">{t.name}</h3>
                      {t.verified ? <VerifiedBadge size={13} /> : null}
                    </div>
                    <p className="truncate text-1 text-muted-foreground">
                      {t.role} · {t.location.split(",").pop()}
                    </p>
                  </div>
                  <Rate {...t.rate} size="sm" />
                </div>
                <Actions />
              </article>
            ))}
      </div>
    </Screen>
  );
}

function Actions() {
  return (
    <div className="mt-3 flex gap-2">
      <button className="min-h-11 flex-1 rounded-full bg-ink text-xs font-semibold text-background">
        Message
      </button>
      <button className="min-h-11 flex-1 rounded-full border border-border text-xs font-semibold">
        Share
      </button>
      <button className="min-h-11 w-11 rounded-full border border-border text-xs">✕</button>
    </div>
  );
}
