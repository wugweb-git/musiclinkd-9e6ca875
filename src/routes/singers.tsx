import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Chip, Screen, TopBar, SearchBar } from "@/components/ml/ui";
import { TalentGridCard, TalentRow } from "@/components/ml/cards";
import { singers } from "@/data/discover";
import { FilterSheet } from "@/components/ml/filter-sheet";

export const Route = createFileRoute("/singers")({
  head: () => ({
    meta: [
      { title: "Singers Directory | MusicLinkd" },
      {
        name: "description",
        content:
          "Browse playback, classical, folk, rap and indie singers across India by language, vocal range and city.",
      },
      { property: "og:title", content: "Singers Directory | MusicLinkd" },
      {
        property: "og:description",
        content: "18,420 verified singers — filter by genre, vocal range, language and city.",
      },
    ],
  }),
  component: Singers,
});

const chips = ["Male", "Female", "Playback", "Classical", "Folk", "Rap", "Indie"];

function Singers() {
  const [active, setActive] = useState<string[]>(["Playback"]);
  const [grid, setGrid] = useState(false);
  const [filters, setFilters] = useState(false);

  const toggle = (c: string) =>
    setActive((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  return (
    <Screen>
      <TopBar
        title="Singers"
        subtitle="18,420 profiles"
        back="/categories"
        right={
          <div className="flex overflow-hidden rounded-full border border-border">
            <button
              onClick={() => setGrid(false)}
              className={`h-10 w-10 text-sm ${!grid ? "bg-navy text-background" : "bg-card"}`}
            >
              ☰
            </button>
            <button
              onClick={() => setGrid(true)}
              className={`h-10 w-10 text-sm ${grid ? "bg-navy text-background" : "bg-card"}`}
            >
              ▦
            </button>
          </div>
        }
      />

      <div className="px-5 pt-4">
        <Link to="/search">
          <SearchBar placeholder="Search singers by name or song..." />
        </Link>
      </div>

      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {chips.map((c) => (
          <Chip key={c} active={active.includes(c)} onClick={() => toggle(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="rail flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
        {["Vocal range", "Language", "City", "Availability"].map((f) => (
          <button
            key={f}
            onClick={() => setFilters(true)}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"
          >
            {f} ▾
          </button>
        ))}
      </div>

      {grid ? (
        <div className="grid grid-cols-2 gap-3 px-5 py-2">
          {singers.map((t) => (
            <TalentGridCard key={t.id} t={t} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 px-5 py-2">
          {singers.map((t) => (
            <TalentRow key={t.id} t={t} />
          ))}
        </div>
      )}

      <FilterSheet open={filters} onClose={() => setFilters(false)} />
    </Screen>
  );
}
