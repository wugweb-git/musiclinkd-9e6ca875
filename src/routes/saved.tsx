import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { Chip, Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import { Price } from "@/components/ml/kit";
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
                  <Price
                    price={s.rate}
                    align="end"
                    className="shrink-0"
                    amountClassName="text-1 font-semibold"
                    unitClassName="text-1"
                  />
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
                  <Price
                    price={t.rate}
                    align="end"
                    className="shrink-0"
                    amountClassName="text-1 font-semibold"
                    unitClassName="text-1"
                  />
                </div>
                <Actions />
              </article>
            ))}
      </div>
    </Screen>
  );
}

/*
 * Nothing is wired to these yet: there is no thread to open, no share target and no saved-talent
 * table to remove from. They are disabled with the reason in the accessible name rather than
 * taking the tap and doing nothing.
 */
function Actions() {
  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        disabled
        aria-label="Messaging isn't open yet"
        className="hit-area min-h-11 flex-1 rounded-full bg-ink text-1 font-semibold text-background disabled:opacity-40"
      >
        Message
      </button>
      <button
        type="button"
        disabled
        aria-label="Sharing isn't open yet"
        className="hit-area min-h-11 flex-1 rounded-full border border-border text-1 font-semibold disabled:opacity-40"
      >
        Share
      </button>
      <button
        type="button"
        disabled
        aria-label="Removing isn't open yet"
        className="hit-area flex min-h-11 w-11 items-center justify-center rounded-full border border-border disabled:opacity-40"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
