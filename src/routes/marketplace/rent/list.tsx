import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Screen, TopBar, BtnLink, Chip } from "@/components/ml/ui";
import { ListingStepFooter } from "@/components/ml/market";
import {
  emptyListingDraft,
  ListingDetailsForm,
  listingPayload,
  ListingPreview,
  type ListingDraft,
} from "@/components/ml/listing-form";
import { createListing } from "@/lib/catalog.functions";
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

const steps = ["Details", "Media", "Availability", "Review"];
function ListForRent() {
  const submit = useServerFn(createListing);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>(emptyListingDraft);
  const patch = (p: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...p }));
  const [minDays, setMinDays] = useState("1 day");
  const [maxDays, setMaxDays] = useState("30 days");
  const [noticePeriod, setNoticePeriod] = useState("Same day");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const daysFrom = (label: string) => parseInt(label, 10) || 1;

  async function publish() {
    setPublishing(true);
    try {
      await submit({
        data: {
          category: "gear_rental",
          ...listingPayload(draft, true),
          minDays: daysFrom(minDays),
          maxDays: daysFrom(maxDays),
          noticePeriod,
        },
      });
      setPublished(true);
    } catch {
      toast.error("Couldn't publish that — try again");
    } finally {
      setPublishing(false);
    }
  }

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

        {!published && step === 1 ? (
          <>
            <h2 className="text-2">Add photos</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              Show the actual equipment you are renting — not stock images. First photo becomes the
              cover.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-1 font-semibold text-muted-foreground">
                <Camera size={iconSize.sm} /> Add
              </button>
            </div>
            <button className="mt-3 w-full rounded-lg border border-dashed border-border py-5 text-1 font-semibold text-muted-foreground">
              + Add a short video (optional)
            </button>
          </>
        ) : null}

        {!published && step === 0 ? (
          <ListingDetailsForm value={draft} onChange={patch} rental />
        ) : null}

        {!published && step === 2 ? (
          <>
            <h2 className="text-2">Availability</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              Blocking specific dates comes after publishing, from your listing's own page.
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: "Minimum rental duration",
                  options: ["1 day", "2 days", "1 week"],
                  value: minDays,
                  set: setMinDays,
                },
                {
                  label: "Maximum rental duration",
                  options: ["14 days", "30 days", "90 days"],
                  value: maxDays,
                  set: setMaxDays,
                },
                {
                  label: "Notice period",
                  options: ["Same day", "24 hours", "48 hours"],
                  value: noticePeriod,
                  set: setNoticePeriod,
                },
              ].map((f) => (
                <div key={f.label}>
                  <label className="mb-1.5 block text-1 font-medium text-muted-foreground">
                    {f.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {f.options.map((o) => (
                      <Chip key={o} active={f.value === o} onClick={() => f.set(o)}>
                        {o}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {!published && step === 3 ? (
          <>
            <h2 className="text-2">Preview your listing</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              This is exactly what renters will see.
            </p>
            <div className="mt-4">
              <ListingPreview value={draft} rental extra={`min ${minDays}`} />
            </div>
          </>
        ) : null}

        {!published ? (
          <div className="mt-6">
            <ListingStepFooter
              step={step}
              last={step === steps.length - 1}
              onBack={() => setStep((s) => s - 1)}
              onNext={() => (step === steps.length - 1 ? void publish() : setStep((s) => s + 1))}
              disabled={step === steps.length - 1 && (!draft.name.trim() || !draft.price)}
              busy={publishing}
              publishLabel="Publish rental"
            />
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
