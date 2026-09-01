import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, MessageCircle, Share2 } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import {
  BookableHero,
  EntityMetaRow,
  PolicyCard,
  StickyBar,
} from "@/components/ml/booking";
import { useBookingDraft } from "@/components/ml/booking-context";
import { inr } from "@/data/booking";

export const Route = createFileRoute("/booking/$id/")({
  head: () => ({
    meta: [
      { title: "Book a studio session — MusicLinkd" },
      {
        name: "description",
        content:
          "See rooms, rates, facilities and live availability, then check dates and request your session.",
      },
      { property: "og:title", content: "Book a studio session — MusicLinkd" },
      {
        property: "og:description",
        content: "Rooms, rates, facilities and live availability for MusicLinkd bookable spaces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingEntry,
});

function BookingEntry() {
  const { bookable: b } = useBookingDraft();
  const navigate = useNavigate();
  const from = Math.min(...b.resources.flatMap((r) => r.tiers.map((t) => t.price)));

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <div className="relative">
        <Link
          to="/"
          aria-label="Back"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-lg backdrop-blur"
        >
          ←
        </Link>
        <BookableHero b={b} />
      </div>

      <main className="px-5 pt-4">
        <h2 className="sr-only">About this space</h2>
        <EntityMetaRow b={b} />
        <p className="mt-3 text-sm leading-relaxed text-text2">{b.about}</p>

        <div className="mt-4 flex gap-2">
          <Link to="/messages" className="flex-1">
            <Btn variant="outline" className="w-full">
              <MessageCircle size={15} className="mr-1.5" /> Message
            </Btn>
          </Link>
          <Btn variant="outline" className="px-4" onClick={() => undefined}>
            <Bookmark size={16} />
          </Btn>
          <Btn variant="outline" className="px-4" onClick={() => undefined}>
            <Share2 size={16} />
          </Btn>
        </div>

        <section className="mt-6">
          <h3 className="text-[17px]">Rooms &amp; services</h3>
          <div className="mt-3 space-y-2">
            {b.resources.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3">
                <img src={r.photo} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Up to {r.capacity} · {r.availabilityNote}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {inr(Math.min(...r.tiers.map((t) => t.price)))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-[17px]">Facilities</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {b.facilities.map((f) => (
              <span key={f} className="rounded-full bg-subtle px-3 py-1.5 text-xs text-text2">
                {f}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-[17px]">Equipment highlights</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...new Set(b.resources.flatMap((r) => r.equipment))].map((e) => (
              <span key={e} className="rounded-full border border-border px-3 py-1.5 text-xs text-text2">
                {e}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-[17px]">Booking policies</h3>
          <div className="mt-3 space-y-2">
            {b.policies.slice(0, 3).map((p) => (
              <PolicyCard key={p.title} title={p.title} body={p.body} critical={p.critical ?? false} />
            ))}
          </div>
          <Link
            to="/booking/$id/review"
            params={{ id: b.id }}
            className="mt-2 inline-block text-xs font-bold text-primary"
          >
            See all terms at review
          </Link>
        </section>

        <section className="mt-6">
          <h3 className="text-[17px]">Gallery</h3>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {b.gallery.map((g) => (
              <img
                key={g}
                src={g}
                alt={`${b.name} interior`}
                className="h-32 w-48 shrink-0 rounded-2xl object-cover"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      </main>

      <StickyBar
        price={`From ${inr(from)}`}
        hint={`${b.timezone} · ${b.responseTime}`}
        primaryLabel="Check availability"
        onPrimary={() => navigate({ to: "/booking/$id/service", params: { id: b.id } })}
      />
    </div>
  );
}
