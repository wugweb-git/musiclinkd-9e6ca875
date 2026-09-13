import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, Chip, Screen, SearchBar, Sheet, VerifiedBadge } from "@/components/ml/ui";
import { TalentRow } from "@/components/ml/cards";
import { StatusPill } from "@/components/ml/kit";
import { availabilityTone, talents, type Talent } from "@/data/discover";
import { FilterSheet } from "@/components/ml/filter-sheet";
import { HireModal } from "@/components/ml/hire-modal";

export const Route = createFileRoute("/search/")({
  head: () => ({
    meta: [
      { title: "Search Results | MusicLinkd" },
      {
        name: "description",
        content:
          "Filter India's music industry by role, language, genre, city, availability and verification.",
      },
      { property: "og:title", content: "Search Results | MusicLinkd" },
      {
        property: "og:description",
        content: "Powerful filtering across talent, bands, studios and venues.",
      },
    ],
  }),
  component: SearchResults,
});

function SearchResults() {
  const [q, setQ] = useState("vocalist mumbai");
  const [filters, setFilters] = useState(false);
  const [preview, setPreview] = useState<Talent | null>(null);
  const [hire, setHire] = useState<Talent | null>(null);

  return (
    <Screen>
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-3">
          <Link
            to="/discover"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            ←
          </Link>
          <h1 className="text-[20px]">Search results</h1>
        </div>
        <SearchBar value={q} onChange={setQ} />
        <div className="rail mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          <Chip active>Verified</Chip>
          <Chip>Available now</Chip>
          <Chip>Mumbai</Chip>
          <Chip>Hindi</Chip>
          <Chip>Remote</Chip>
        </div>
      </div>

      <p className="px-5 pt-4 text-xs text-muted-foreground">
        <strong className="text-foreground">248 results</strong> · sorted by most relevant
      </p>

      <div className="space-y-3 px-5 py-4">
        {talents.map((t) => (
          <TalentRow key={t.id} t={t} onPreview={setPreview} />
        ))}
      </div>

      <button
        onClick={() => setFilters(true)}
        className="fixed bottom-24 left-1/2 z-40 inline-flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-background"
      >
        ⚙ Filters <span className="rounded-full bg-primary px-2 py-0.5 text-[10px]">3</span>
      </button>

      <FilterSheet open={filters} onClose={() => setFilters(false)} />

      <Sheet open={!!preview} onClose={() => setPreview(null)}>
        {preview ? (
          <ProfilePreview
            t={preview}
            onHire={() => {
              setHire(preview);
              setPreview(null);
            }}
          />
        ) : null}
      </Sheet>

      <HireModal
        open={hire !== null}
        onClose={() => setHire(null)}
        subject={hire ? { name: hire.name, detail: `${hire.role} · ${hire.location}` } : undefined}
      />
    </Screen>
  );
}

function ProfilePreview({ t, onHire }: { t: Talent; onHire: () => void }) {
  return (
    <div>
      <div className="relative h-56 overflow-hidden rounded-lg">
        <img src={t.photo} alt={t.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-background">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[22px] text-background">{t.name}</h2>
            {t.verified ? <VerifiedBadge /> : null}
          </div>
          <p className="text-xs opacity-85">
            {t.role} · {t.location}
          </p>
        </div>
        <div className="absolute right-4 top-4">
          <StatusPill label={t.availability} tone={availabilityTone(t.availability)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card py-3 text-center">
        <div>
          <p className="text-[15px] font-bold">{t.followers}</p>
          <p className="text-[10px] uppercase text-muted-foreground">Followers</p>
        </div>
        <div>
          <p className="text-[15px] font-bold">{t.credits}</p>
          <p className="text-[10px] uppercase text-muted-foreground">Credits</p>
        </div>
        <div>
          <p className="text-[15px] font-bold text-warn">{t.rating} ★</p>
          <p className="text-[10px] uppercase text-muted-foreground">Rating</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[...t.genres, ...t.languages].map((x) => (
          <span
            key={x}
            className="rounded-full bg-subtle px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"
          >
            {x}
          </span>
        ))}
      </div>

      <h3 className="mb-2 mt-5 text-[15px]">Top projects</h3>
      <div className="space-y-2">
        {["Rangreza — T-Series (2025)", "Neon Monsoon — Indie EP", "Kabir Sessions Vol. 2"].map(
          (p) => (
            <div
              key={p}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-subtle">
                ▶
              </span>
              <p className="flex-1 text-xs font-semibold">{p}</p>
              <span className="text-[10px] text-muted-foreground">Spotify</span>
            </div>
          ),
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          to="/profile/$username"
          params={{ username: t.id }}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-background"
        >
          View full profile
        </Link>
        <Btn variant="outline">Message</Btn>
        <Btn variant="ghost">♡ Save</Btn>
        <Btn onClick={onHire}>Hire</Btn>
      </div>
    </div>
  );
}
