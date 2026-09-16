import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Star } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Price } from "@/components/ml/kit";
import { ConditionBadge, LocationRow, MarketCategoryIcon } from "@/components/ml/market";
import { RentalAvailabilityBadge, RentalCalendar } from "@/components/ml/rental";
import { equipment, rentalCategories } from "@/data/rentals";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/marketplace/rent/list")({
  head: () => ({
    meta: [
      { title: "Rent Out Equipment | MusicLinkd" },
      {
        name: "description",
        content:
          "List your instruments, audio, studio, DJ or live equipment for rent to verified music professionals in India.",
      },
      { property: "og:title", content: "Rent Out Equipment | MusicLinkd" },
      {
        property: "og:description",
        content: "Set your dates, pricing, deposit and terms in a few steps.",
      },
    ],
  }),
  component: ListForRent,
});

const steps = ["Category", "Media", "Details", "Availability", "Review"];
const sample = equipment[0]!;

function ListForRent() {
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState("audio");
  const [cover, setCover] = useState(0);
  const [condition, setCondition] = useState("Excellent");
  const [fulfilment, setFulfilment] = useState<string[]>(["Pickup"]);
  const [start, setStart] = useState<number | null>(16);
  const [end, setEnd] = useState<number | null>(30);
  const [published, setPublished] = useState(false);

  const category = rentalCategories.find((c) => c.slug === cat);

  return (
    <Screen>
      <TopBar
        title={published ? "Listing published" : "Rent out equipment"}
        subtitle={
          published
            ? "Live on MusicLinkd Market"
            : `Step ${step + 1} of ${steps.length} · ${steps[step]}`
        }
        back="/marketplace/rent"
      />

      <div className="px-5 py-4">
        {!published ? (
          <div className="mb-5 flex gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s}
                className="h-1 flex-1 rounded-full"
                style={{ background: i <= step ? "var(--primary)" : "var(--border)" }}
              />
            ))}
          </div>
        ) : null}

        {published ? (
          <div className="py-6 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3"
              style={{ background: "var(--success-container)" }}
            >
              ✓
            </div>
            <h2 className="text-3">Your rental is live</h2>
            <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground">
              Renters near you can now check availability and send requests. You'll be notified for
              every enquiry.
            </p>
            <BtnLink to="/marketplace/rent/listings" className="mt-6 w-full">
              Go to My Listings
            </BtnLink>
            <BtnLink to="/marketplace/rent" variant="outline" className="mt-2 w-full">
              Back to Rentals
            </BtnLink>
          </div>
        ) : null}

        {!published && step === 0 ? (
          <>
            <h2 className="text-2">What are you renting out?</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              We adapt the form to the kind of equipment you list.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {rentalCategories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCat(c.slug)}
                  className="rounded-lg border p-4 text-left"
                  style={{
                    borderColor: cat === c.slug ? "var(--primary)" : "var(--border)",
                    background: cat === c.slug ? "var(--surface-subtle)" : "var(--card)",
                  }}
                >
                  <MarketCategoryIcon slug={c.slug} />
                  <p className="mt-2 text-1 font-semibold text-foreground">{c.label}</p>
                  <p className="text-1 text-foreground">{c.count}</p>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {!published && step === 1 ? (
          <>
            <h2 className="text-2">Add photos</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              Show the actual equipment you are renting — not stock images. First photo becomes the
              cover.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {sample.photos.map((src, i) => (
                <button key={src} onClick={() => setCover(i)} className="relative">
                  <img
                    src={src}
                    alt=""
                    className="h-24 w-full rounded-lg object-cover"
                    style={{ outline: cover === i ? "2px solid var(--primary)" : "none" }}
                  />
                  {cover === i ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary p-1 text-primary-foreground">
                      <Star size={iconSize.xs} fill="currentColor" />
                    </span>
                  ) : null}
                </button>
              ))}
              <button className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-1 font-semibold text-muted-foreground">
                <Camera size={iconSize.sm} /> Add
              </button>
            </div>
            <button className="mt-3 w-full rounded-lg border border-dashed border-border py-5 text-1 font-semibold text-muted-foreground">
              + Add a short video (optional)
            </button>
          </>
        ) : null}

        {!published && step === 2 ? (
          <>
            <h2 className="text-2">Equipment details</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Equipment name", ph: "Shure SM7B" },
                { label: "Brand", ph: "Shure" },
                { label: "Model", ph: "SM7B" },
                { label: "Location", ph: "Andheri West, Mumbai" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="mb-1.5 block text-1 font-medium text-muted-foreground">
                    {f.label}
                  </label>
                  <input
                    placeholder={f.ph}
                    className="h-13 w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
              <div>
                <span
                  id="grp-subcategory"
                  className="mb-1.5 block text-1 font-medium text-muted-foreground"
                >
                  Sub-category
                </span>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-labelledby="grp-subcategory"
                >
                  {(category?.subs ?? []).slice(0, 8).map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <span
                  id="grp-condition"
                  className="mb-1.5 block text-1 font-medium text-muted-foreground"
                >
                  Condition
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="grp-condition">
                  {["New", "Like New", "Excellent", "Good", "Fair"].map((c) => (
                    <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="description-included-accessories"
                  className="mb-1.5 block text-1 font-medium text-muted-foreground"
                >
                  Description & included accessories
                </label>
                <textarea
                  id="description-included-accessories"
                  rows={4}
                  placeholder="Serviced between rentals. Includes windscreen, yoke mount, XLR cable and padded case."
                  className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Daily ₹", "Weekly ₹", "Monthly ₹"].map((f) => (
                  <div key={f}>
                    <label className="mb-1.5 block text-1 font-medium text-muted-foreground">
                      {f}
                    </label>
                    <input
                      inputMode="numeric"
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label
                  htmlFor="security-deposit"
                  className="mb-1.5 block text-1 font-medium text-muted-foreground"
                >
                  Security deposit
                </label>
                <input
                  id="security-deposit"
                  inputMode="numeric"
                  placeholder="₹15,000"
                  className="w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <span
                  id="grp-fulfilment"
                  className="mb-1.5 block text-1 font-medium text-muted-foreground"
                >
                  Fulfilment
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="grp-fulfilment">
                  {["Pickup", "Provider delivery", "Courier"].map((f) => (
                    <Chip
                      key={f}
                      active={fulfilment.includes(f)}
                      onClick={() =>
                        setFulfilment((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]))
                      }
                    >
                      {f}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {!published && step === 3 ? (
          <>
            <h2 className="text-2">Availability</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              Tap dates to mark when the equipment is available. Blocked dates stay hidden from
              renters.
            </p>
            <div className="mt-4">
              <RentalCalendar
                e={sample}
                start={start}
                end={end}
                onSelect={(d) =>
                  start === null || end !== null ? (setStart(d), setEnd(null)) : setEnd(d)
                }
              />
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Minimum rental duration", options: ["1 day", "2 days", "1 week"] },
                { label: "Maximum rental duration", options: ["14 days", "30 days", "90 days"] },
                { label: "Notice period", options: ["Same day", "24 hours", "48 hours"] },
              ].map((f) => (
                <div key={f.label}>
                  <label className="mb-1.5 block text-1 font-medium text-muted-foreground">
                    {f.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {f.options.map((o, i) => (
                      <Chip key={o} active={i === 0}>
                        {o}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {!published && step === 4 ? (
          <>
            <h2 className="text-2">Preview your listing</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              This is exactly what renters will see.
            </p>
            <article className="mt-4 overflow-hidden rounded-lg bg-subtle">
              <img src={sample.photos[cover]} alt="" className="h-44 w-full object-cover" />
              <div className="p-4">
                <Price
                  price={{ amount: "₹900", unit: "day" }}
                  amountClassName="text-sm font-bold"
                  unitClassName="text-1"
                />
                <h3 className="mt-1 text-sm leading-snug">Shure SM7B</h3>
                <p className="text-1 text-muted-foreground">Shure · SM7B</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <RentalAvailabilityBadge text="Available Aug 16–30" />
                  <ConditionBadge value={condition} />
                </div>
                <div className="mt-2.5">
                  <LocationRow text="Andheri West, Mumbai · 6.8 km away" />
                </div>
                <p className="mt-2 text-1 text-muted-foreground">
                  Deposit ₹15,000 · {fulfilment.join(" or ") || "Pickup"} · min 1 day
                </p>
              </div>
            </article>
          </>
        ) : null}

        {!published ? (
          <div className="mt-6 space-y-2">
            <Btn
              className="w-full"
              onClick={() =>
                step === steps.length - 1 ? setPublished(true) : setStep((s) => s + 1)
              }
            >
              {step === steps.length - 1 ? "Publish rental" : "Continue"}
            </Btn>
            <div className="flex gap-2">
              {step > 0 ? (
                <Btn variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Btn>
              ) : null}
              <Btn variant="ghost" className="flex-1">
                Save Draft
              </Btn>
            </div>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
