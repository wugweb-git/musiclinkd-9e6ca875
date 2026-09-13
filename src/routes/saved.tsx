import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Chip, Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
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
      <TopBar title="Saved profiles" subtitle="18 shortlisted · 4 lists" back="/" />
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
                    <h3 className="truncate text-[14px]">{s.name}</h3>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {s.location} · {s.rate}
                    </p>
                  </div>
                </div>
                <Notes note="Hold 3 days in Sept for album tracking." tags={["Album", "Mumbai"]} />
                <Actions />
              </article>
            ))
          : talents.slice(0, 3).map((t) => (
              <article key={t.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <img src={t.photo} alt={t.name} className="h-14 w-14 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="truncate text-[14px]">{t.name}</h3>
                      {t.verified ? <VerifiedBadge size={13} /> : null}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.role} · {t.location.split(",").pop()}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-primary">{t.rate}</span>
                </div>
                <Notes
                  note="Shortlisted for the Sufi title track — great upper register."
                  tags={["Title track", "Hindi", "Priority"]}
                />
                <Actions />
              </article>
            ))}
      </div>
    </Screen>
  );
}

function Notes({ note, tags }: { note: string; tags: string[] }) {
  return (
    <div className="mt-3 rounded-lg bg-subtle p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Your note
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((tg) => (
          <span
            key={tg}
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: "var(--purple-container)", color: "var(--purple)" }}
          >
            #{tg}
          </span>
        ))}
      </div>
    </div>
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
