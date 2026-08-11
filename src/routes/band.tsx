import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, Screen, VerifiedBadge } from "@/components/ml/ui";
import { HireModal } from "@/components/ml/hire-modal";

export const Route = createFileRoute("/band")({
  head: () => ({
    meta: [
      { title: "The Local Train — Band Profile | MusicLinkd" },
      {
        name: "description",
        content:
          "Indie rock band profile with members, live videos, technical rider, stage plot and booking on MusicLinkd.",
      },
      { property: "og:title", content: "The Local Train — Band Profile | MusicLinkd" },
      {
        property: "og:description",
        content: "Members, live performance videos, tech rider and direct booking.",
      },
    ],
  }),
  component: Band,
});

const members = [
  { name: "Raman Negi", role: "Vocals", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80" },
  { name: "Paras Thakur", role: "Guitar", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" },
  { name: "Ramit Mehra", role: "Bass", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" },
  { name: "Sahil Sarin", role: "Drums", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80" },
];

function Band() {
  const [hire, setHire] = useState(false);
  return (
    <Screen>
      <div className="relative h-60">
        <img
          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80"
          alt="The Local Train performing live"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
        <Link
          to="/"
          className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90"
        >
          ←
        </Link>
      </div>

      <div className="-mt-10 px-5">
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-background">
              TLT
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[20px]">The Local Train</h1>
                <VerifiedBadge />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Indie Rock · Hindi, English · Delhi NCR
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Indie Rock", "Alt Hindi", "Live Act", "Festival Ready"].map((g) => (
              <span
                key={g}
                className="rounded-full bg-subtle px-2.5 py-1 text-[10px] font-semibold text-text2"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Section title="Members">
        <div className="grid grid-cols-4 gap-2">
          {members.map((m) => (
            <Link
              key={m.name}
              to="/talent/$id"
              params={{ id: "meher-kaur" }}
              className="rounded-2xl border border-border bg-card p-2 text-center"
            >
              <img
                src={m.photo}
                alt={m.name}
                className="mx-auto h-12 w-12 rounded-full object-cover"
              />
              <p className="mt-1.5 truncate text-[10px] font-semibold">{m.name.split(" ")[0]}</p>
              <p className="truncate text-[9px] text-muted-foreground">{m.role}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Live performance videos">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {[
            { t: "Choo Lo — NH7 Weekender", v: "2.1M" },
            { t: "Aaoge Tum Kabhi — Live", v: "5.4M" },
          ].map((v) => (
            <div
              key={v.t}
              className="relative h-32 w-[240px] shrink-0 overflow-hidden rounded-2xl border border-border"
            >
              <img
                src="https://images.unsplash.com/photo-1470229722913-7ea0d0d1a68f?auto=format&fit=crop&w=600&q=80"
                alt={v.t}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-navy/40" />
              <div className="absolute bottom-3 left-3 text-background">
                <p className="text-[12px] font-semibold">{v.t}</p>
                <p className="text-[10px] opacity-80">{v.v} views</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Technical rider">
        <div className="divide-y divide-border rounded-3xl border border-border bg-card">
          {[
            ["Stage size", "24ft × 18ft minimum"],
            ["Monitors", "5 wedges + 1 drum fill"],
            ["FOH console", "Midas M32 or better"],
            ["Power", "3 × 15A independent lines"],
            ["Set duration", "75 minutes"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="text-xs font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Stage plot">
        <div className="relative h-44 rounded-3xl border border-border bg-subtle p-3">
          {[
            { l: "Drums", x: "42%", y: "12%" },
            { l: "Bass", x: "12%", y: "48%" },
            { l: "Gtr 1", x: "72%", y: "48%" },
            { l: "Vox", x: "42%", y: "72%" },
          ].map((p) => (
            <span
              key={p.l}
              className="absolute rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-bold"
              style={{ left: p.x, top: p.y }}
            >
              {p.l}
            </span>
          ))}
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-muted-foreground">
            Audience
          </span>
        </div>
      </Section>

      <Section title="Booking contact">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[13px] font-semibold">Nikhil Bookings · Third Culture Live</p>
          <p className="text-[11px] text-muted-foreground">
            bookings@thelocaltrain.in · Fee band ₹6L – ₹12L
          </p>
        </div>
      </Section>

      <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-5">
        <Btn className="w-full" onClick={() => setHire(true)}>
          Book band
        </Btn>
      </div>

      <HireModal open={hire} onClose={() => setHire(false)} />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 pt-6">
      <h2 className="mb-3 text-[15px]">{title}</h2>
      {children}
    </section>
  );
}
