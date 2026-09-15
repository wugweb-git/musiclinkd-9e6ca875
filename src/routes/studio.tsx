import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, Screen, VerifiedBadge } from "@/components/ml/ui";
import { HireModal } from "@/components/ml/hire-modal";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Yash Raj Sound Studios | MusicLinkd" },
      {
        name: "description",
        content:
          "Dolby Atmos recording studio in Andheri West, Mumbai — equipment, rates, photos and live availability.",
      },
      { property: "og:title", content: "Yash Raj Sound Studios | MusicLinkd" },
      {
        property: "og:description",
        content: "Book a Dolby Atmos 7.1.4 room in Mumbai with instant availability.",
      },
    ],
  }),
  component: Studio,
});

const photos = [
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519508234439-4f23643125c1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80",
];

function Studio() {
  const [hire, setHire] = useState(false);
  return (
    <Screen>
      <div className="relative h-64">
        <img src={photos[0]} alt="Studio control room" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
        <Link
          to="/discover"
          className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90"
        >
          ←
        </Link>
        <span className="pill absolute bottom-5 left-5 pill-glass">Dolby Atmos 7.1.4</span>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-[22px]">Yash Raj Sound Studios</h1>
              <VerifiedBadge />
            </div>
            <p className="text-xs text-muted-foreground">Andheri West, Mumbai · 3 live rooms</p>
          </div>
          <span className="rounded-full bg-subtle px-3 py-1.5 text-xs font-bold text-warn">
            4.9 ★
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card py-3 text-center">
          <div>
            <p className="text-[15px] font-bold text-price">₹1,800</p>
            <p className="text-[10px] uppercase text-muted-foreground">Per hour</p>
          </div>
          <div>
            <p className="text-[15px] font-bold text-price">₹12,000</p>
            <p className="text-[10px] uppercase text-muted-foreground">Day rate</p>
          </div>
          <div>
            <p className="text-[15px] font-bold">312</p>
            <p className="text-[10px] uppercase text-muted-foreground">Sessions</p>
          </div>
        </div>
      </div>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-[15px]">Equipment overview</h2>
        <div className="flex flex-wrap gap-2">
          {[
            "SSL Duality δelta",
            "Neumann U87 ×4",
            "Genelec 8351B",
            "Pro Tools Ultimate",
            "Steinway Model B",
            "Universal Audio Apollo",
          ].map((g) => (
            <span
              key={g}
              className="rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold"
            >
              {g}
            </span>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <h2 className="mb-3 px-5 text-[15px]">Studio photos</h2>
        <div className="rail flex gap-3 overflow-x-auto px-5 no-scrollbar">
          {photos.map((p) => (
            <img
              key={p}
              src={p}
              alt="Studio room"
              className="h-32 w-[220px] shrink-0 rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      </section>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-[15px]">Availability · August 2026</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-muted-foreground">
                {d}
              </span>
            ))}
            {Array.from({ length: 28 }).map((_, i) => {
              const busy = [3, 4, 9, 15, 16, 17, 22].includes(i);
              const sel = i === 11;
              return (
                <span
                  key={i}
                  className={`flex h-9 items-center justify-center rounded-md text-[11px] font-semibold ${
                    sel
                      ? "bg-primary text-primary-foreground"
                      : busy
                        ? "bg-subtle text-muted-foreground line-through"
                        : "border border-border"
                  }`}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            12 Aug · North Room · 10:00–18:00 available
          </p>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2 px-5 py-6">
        <Btn className="col-span-2" onClick={() => setHire(true)}>
          Book studio
        </Btn>
        <Btn variant="outline" className="col-span-1 px-0 text-xs">
          Message
        </Btn>
        <Btn variant="ghost" className="col-span-1 px-0 text-xs">
          Share
        </Btn>
      </div>

      <HireModal
        open={hire}
        onClose={() => setHire(false)}
        subject={{ name: "Yash Raj Sound Studios", detail: "Andheri West, Mumbai" }}
      />
    </Screen>
  );
}
