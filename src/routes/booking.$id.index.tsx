import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { Btn, IconBtn } from "@/components/ml/ui";
import {
  BookableHero,
  EntityMetaRow,
  PhotoSheet,
  PolicyCard,
  ProofPill,
  StickyBar,
} from "@/components/ml/booking";
import { useBookingDraft } from "@/components/ml/booking-context";
import { inr, lowestRate } from "@/data/booking";
import { rupeeParts } from "@/lib/price";
import { Price } from "@/components/ml/kit";
import { ReviewCard } from "@/components/ml/profile";
import { TextLink } from "@/components/ml/links";
import { shareLink } from "@/lib/booking-actions";
import { iconSize } from "@/lib/tokens";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { useMessagePerson } from "@/hooks/use-message-person";

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
  const message = useMessagePerson();
  // The facility or equipment item whose photos are open.
  const [viewing, setViewing] = useState<{ title: string; photos: string[] } | null>(null);
  const from = Math.min(...b.resources.flatMap((r) => r.tiers.map((t) => t.price)));
  const equipment = [
    ...new Set([...(b.equipment ?? []), ...b.resources.flatMap((r) => r.equipment)]),
  ];

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <BookableHero b={b} back="/discover" />

      <main className="px-5 pt-4">
        <h2 className="sr-only">About this space</h2>
        <EntityMetaRow b={b} />
        {b.about ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.about}</p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          {/* Message opens a conversation with the studio's business; Save is the saved list. */}
          <Btn
            variant="outline"
            className="flex-1 w-full"
            disabled={!b.ownerProfileId}
            loading={message.pending}
            onClick={() => b.ownerProfileId && void message.open(b.ownerProfileId)}
          >
            <MessageCircle size={iconSize.sm} className="mr-1.5" /> Message
          </Btn>
          {b.ownerProfileId ? (
            <SavedToggle targetType="business" targetId={b.ownerProfileId} size={48} />
          ) : null}
          <IconBtn
            label="Share space"
            className="h-12 w-12"
            onClick={() => void shareLink({ title: b.name, url: window.location.href })}
          >
            <Share2 size={iconSize.sm} aria-hidden />
          </IconBtn>
        </div>

        <section className="mt-6">
          <h3 className="text-2">Rooms &amp; services</h3>
          <div className="mt-3 space-y-2">
            {b.resources.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg bg-subtle p-3">
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
                  {r.description ? (
                    <p className="mt-0.5 line-clamp-2 text-1 text-muted-foreground">
                      {r.description}
                    </p>
                  ) : null}
                  {/* Package rates beside the hourly one ("Half day", "Full day"). */}
                  {r.tiers.some((t) => t.unit !== "hour") ? (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      {r.tiers
                        .filter((t) => t.unit !== "hour")
                        .map((t) => (
                          <Price
                            key={t.label}
                            price={rupeeParts(t.price, t.label)}
                            amountClassName="text-1 font-semibold"
                            unitClassName="text-1"
                          />
                        ))}
                    </div>
                  ) : null}
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
                <ProofPill
                  key={f}
                  label={f}
                  photos={b.facilityPhotos?.[f]}
                  onOpen={() => setViewing({ title: f, photos: b.facilityPhotos?.[f] ?? [] })}
                  className="rounded-full bg-background text-1 text-muted-foreground"
                />
              ))}
            </div>
          </section>
        ) : null}

        {equipment.length ? (
          <section className="mt-6">
            <h3 className="text-2">Equipment highlights</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {equipment.map((e) => (
                <ProofPill
                  key={e}
                  label={e}
                  photos={b.equipmentPhotos?.[e]}
                  onOpen={() => setViewing({ title: e, photos: b.equipmentPhotos?.[e] ?? [] })}
                  className="rounded-full border border-border text-1 text-muted-foreground"
                />
              ))}
            </div>
          </section>
        ) : null}

        {b.addOns.length ? (
          <section className="mt-6">
            <h3 className="text-2">Add-ons</h3>
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {b.addOns.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate text-1">{a.name}</span>
                  {a.unpriced ? null : (
                    <Price
                      price={rupeeParts(a.price, a.perHour ? "hour" : (a.unit ?? null))}
                      align="end"
                      className="shrink-0"
                      amountClassName="text-1 font-semibold"
                      unitClassName="text-1"
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {b.reviewItems?.length ? (
          <section className="mt-6">
            <h3 className="text-2">Reviews</h3>
            <div className="mt-3 space-y-3">
              {b.reviewItems.map((r) => (
                <ReviewCard key={r.id} r={r} />
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
              {b.gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setViewing({ title: b.name, photos: b.gallery })}
                  aria-label={`View photo ${i + 1} of ${b.gallery.length}`}
                  className="block shrink-0 overflow-hidden rounded-lg"
                >
                  <img
                    src={g}
                    alt={`${b.name} interior`}
                    className="h-32 w-48 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <PhotoSheet
        title={viewing?.title ?? ""}
        photos={viewing?.photos ?? []}
        onClose={() => setViewing(null)}
      />

      <StickyBar
        price={`From ${inr(from)}`}
        hint={[b.timezone, b.responseTime].filter(Boolean).join(" · ") || undefined}
        primaryLabel="Check availability"
        onPrimary={() => navigate({ to: "/booking/$id/service", params: { id: b.id } })}
      />
    </div>
  );
}
