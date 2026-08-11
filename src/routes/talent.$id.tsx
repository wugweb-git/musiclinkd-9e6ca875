import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AvailabilityBadge, Btn, Screen, VerifiedBadge } from "@/components/ml/ui";
import { HireModal } from "@/components/ml/hire-modal";
import { singers, talents } from "@/data/discover";

const all = [...talents, ...singers];

export const Route = createFileRoute("/talent/$id")({
  head: () => ({
    meta: [
      { title: "Talent Profile | MusicLinkd" },
      {
        name: "description",
        content:
          "Premium artist profile with projects, industry credits, reviews and direct hiring on MusicLinkd.",
      },
      { property: "og:title", content: "Talent Profile | MusicLinkd" },
      {
        property: "og:description",
        content: "Projects, credits, reviews and availability for India's music professionals.",
      },
    ],
  }),
  component: Profile,
});

const tabs = ["Projects", "Credits", "About", "Reviews"] as const;

function Profile() {
  const { id } = Route.useParams();
  const t = all.find((x) => x.id === id) ?? all[0]!;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Projects");
  const [hire, setHire] = useState(false);

  return (
    <Screen>
      <div className="relative h-72">
        <img src={t.photo} alt={t.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-navy/20" />
        <Link
          to="/search"
          className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90"
        >
          ←
        </Link>
        <button className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90">
          ⤴
        </button>
        <div className="absolute bottom-5 left-5 right-5 text-background">
          <AvailabilityBadge status={t.availability} />
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-[26px] text-background">{t.name}</h1>
            {t.verified ? <VerifiedBadge size={18} /> : null}
          </div>
          <p className="text-xs opacity-85">
            {t.role} · {t.location}
          </p>
          <div className="mt-3 flex gap-5 text-xs">
            <span>
              <strong>{t.followers}</strong> followers
            </span>
            <span>
              <strong>{t.credits}</strong> credits
            </span>
            <span>
              <strong>{t.rating}★</strong> rating
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-5 py-4">
        <Btn variant="navy" className="col-span-1 px-0 text-xs">
          Message
        </Btn>
        <Btn className="col-span-1 px-0 text-xs" onClick={() => setHire(true)}>
          Hire
        </Btn>
        <Btn variant="outline" className="col-span-1 px-0 text-xs">
          Follow
        </Btn>
        <Btn variant="ghost" className="col-span-1 px-0 text-xs">
          Share
        </Btn>
      </div>

      <div className="sticky top-0 z-20 flex gap-2 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
        {tabs.map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={`flex-1 rounded-full py-2 text-xs font-semibold ${
              tab === x ? "bg-navy text-background" : "bg-subtle text-text2"
            }`}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {tab === "Projects" ? <Projects /> : null}
        {tab === "Credits" ? <Credits /> : null}
        {tab === "About" ? <About t={t} /> : null}
        {tab === "Reviews" ? <Reviews rating={t.rating} /> : null}
      </div>

      <HireModal open={hire} onClose={() => setHire(false)} />
    </Screen>
  );
}

const projects = [
  { title: "Rangreza (Title Track)", label: "T-Series · 2025", platform: "Spotify", plays: "4.2M" },
  { title: "Neon Monsoon — EP", label: "Independent · 2024", platform: "Apple Music", plays: "812k" },
  { title: "Kabir Sessions Vol. 2", label: "Live · YouTube", platform: "YouTube", plays: "1.6M" },
];

function Projects() {
  return (
    <div className="space-y-3">
      {projects.map((p) => (
        <article
          key={p.title}
          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg"
            style={{ background: "var(--pink-container)" }}
          >
            ▶
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px]">{p.title}</h3>
            <p className="truncate text-[11px] text-muted-foreground">{p.label}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-text2">
                {p.platform}
              </span>
              <span className="text-[10px] text-muted-foreground">{p.plays} plays</span>
            </div>
          </div>
        </article>
      ))}
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Waveform preview · Rangreza
        </p>
        <div className="flex h-14 items-end gap-1">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: `${20 + Math.abs(Math.sin(i * 0.7)) * 80}%`,
                background: i < 14 ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Credits() {
  const credits = [
    { role: "Lead vocals", project: "Rangreza", with: "Amit Trivedi", year: "2025" },
    { role: "Backing vocals", project: "Dil Ki Baazi", with: "Sony Music India", year: "2024" },
    { role: "Featured artist", project: "Monsoon Sessions", with: "Kohra", year: "2024" },
    { role: "Vocal arranger", project: "Saanjh", with: "Yash Raj Sound", year: "2023" },
  ];
  return (
    <div className="divide-y divide-border rounded-3xl border border-border bg-card">
      {credits.map((c) => (
        <div key={c.project} className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-subtle text-xs font-bold">
            {c.year.slice(2)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px]">{c.project}</h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {c.role} · with {c.with}
            </p>
          </div>
          <span className="text-[11px] text-primary">↗</span>
        </div>
      ))}
    </div>
  );
}

function About({ t }: { t: { languages: string[]; genres: string[]; rate: string } }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="text-sm leading-relaxed text-text2">
          Trained in Hindustani classical for 12 years, now working across film playback and
          independent releases. Comfortable tracking remotely from a treated home booth
          (Neumann TLM 103 · Apollo Twin X) with 48-hour turnaround.
        </p>
      </div>
      <InfoRow label="Languages" value={t.languages.join(", ")} />
      <InfoRow label="Genres" value={t.genres.join(", ")} />
      <InfoRow label="Starting rate" value={t.rate} />
      <InfoRow label="Remote sessions" value="Available · stems delivered in 48h" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-border bg-card p-4">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-xs font-semibold">{value}</span>
    </div>
  );
}

function Reviews({ rating }: { rating: number }) {
  const reviews = [
    {
      by: "Ritesh Nair",
      org: "Sony Music India",
      text: "Nailed the hook in three takes and sent clean, labelled stems the same night.",
      stars: 5,
    },
    {
      by: "Krimson Avenue",
      org: "Studio, Bengaluru",
      text: "Professional in the booth, great pitch control, zero editing needed.",
      stars: 5,
    },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
        <p className="text-[34px] font-bold leading-none">{rating}</p>
        <div>
          <p className="text-sm text-warn">★★★★★</p>
          <p className="text-[11px] text-muted-foreground">Based on 38 verified projects</p>
        </div>
      </div>
      {reviews.map((r) => (
        <article key={r.by} className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px]">{r.by}</h3>
              <p className="text-[11px] text-muted-foreground">{r.org}</p>
            </div>
            <span className="text-xs text-warn">{"★".repeat(r.stars)}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-text2">{r.text}</p>
        </article>
      ))}
    </div>
  );
}
