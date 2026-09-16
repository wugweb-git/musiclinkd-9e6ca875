import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, MessageCircle, Share2 } from "lucide-react";
import { Btn, BtnLink, IconBtn } from "@/components/ml/ui";
import { BookableHero, EntityMetaRow, PolicyCard, StickyBar } from "@/components/ml/booking";
import { useBookingDraft } from "@/components/ml/booking-context";
import { inr, lowestRate } from "@/data/booking";
import { Price } from "@/components/ml/kit";
import { TextLink } from "@/components/ml/links";
import { shareLink } from "@/lib/booking-actions";

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
  // Saved on this visit only: there is no saved-spaces store yet.
  const [saved, setSaved] = useState(false);
  const from = Math.min(...b.resources.flatMap((r) => r.tiers.map((t) => t.price)));
  const equipment = [
    ...new Set([...(b.equipment ?? []), ...b.resources.flatMap((r) => r.equipment)]),
  ];

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <div className="relative">
        <Link
          to="/discover"
          aria-label="Back"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-2 backdrop-blur"
        >
          ←
        </Link>
        <BookableHero b={b} />
      </div>

      <main className="px-5 pt-4">
        <h2 className="sr-only">About this space</h2>
        <EntityMetaRow b={b} />
        {b.about ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.about}</p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <BtnLink to="/messages" variant="outline" className="flex-1 w-full">
            <MessageCircle size={16} className="mr-1.5" /> Message
          </BtnLink>
          <IconBtn
            label={saved ? "Remove from saved" : "Save space"}
            className="h-12 w-12"
            onClick={() => {
              setSaved((s) => !s);
              toast.success(saved ? "Removed from saved" : "Saved");
            }}
          >
            <Bookmark size={16} fill={saved ? "currentColor" : "none"} aria-hidden />
          </IconBtn>
          <IconBtn
            label="Share space"
            className="h-12 w-12"
            onClick={() => void shareLink({ title: b.name, url: window.location.href })}
          >
            <Share2 size={16} aria-hidden />
          </IconBtn>
        </div>

        <section className="mt-6">
          <h3 className="text-2">Rooms &amp; services</h3>
          <div className="mt-3 space-y-2">
            {b.resources.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                {r.photo ? (
                  <img
                    src={r.photo}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-sm object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-1 text-muted-foreground">
                    {[r.capacity ? `Up to ${r.capacity}` : "", r.availabilityNote]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Price
                  price={lowestRate(r.tiers)}
                  align="end"
                  className="shrink-0"
                  amountClassName="text-sm font-semibold"
                />
              </div>
            ))}
          </div>
        </section>

        {b.facilities.length ? (
          <section className="mt-6">
            <h3 className="text-2">Facilities</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {b.facilities.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-subtle px-3 py-1.5 text-1 text-muted-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {equipment.length ? (
          <section className="mt-6">
            <h3 className="text-2">Equipment highlights</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {equipment.map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-border px-3 py-1.5 text-1 text-muted-foreground"
                >
                  {e}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {b.policies.length ? (
          <section className="mt-6">
            <h3 className="text-2">Booking policies</h3>
            <div className="mt-3 space-y-2">
              {b.policies.slice(0, 3).map((p) => (
                <PolicyCard
                  key={p.title}
                  title={p.title}
                  body={p.body}
                  critical={p.critical ?? false}
                />
              ))}
            </div>
            {/* Review needs a date and time, which studios without a calendar cannot give. */}
            {b.hasCalendar === false ? null : (
              <TextLink
                to="/booking/$id/review"
                params={{ id: b.id }}
                className="mt-2 inline-block text-1 font-bold"
              >
                See All Terms at Review
              </TextLink>
            )}
          </section>
        ) : null}

        {b.gallery.length ? (
          <section className="mt-6">
            <h3 className="text-2">Gallery</h3>
            <div className="rail mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {b.gallery.map((g) => (
                <img
                  key={g}
                  src={g}
                  alt={`${b.name} interior`}
                  className="h-32 w-48 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <StickyBar
        price={`From ${inr(from)}`}
        hint={[b.timezone, b.responseTime].filter(Boolean).join(" · ") || undefined}
        primaryLabel="Check availability"
        onPrimary={() => navigate({ to: "/booking/$id/service", params: { id: b.id } })}
      />
    </div>
  );
}
