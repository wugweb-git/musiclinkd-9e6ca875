import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { ListingStepFooter } from "@/components/ml/market";
import {
  ListingDetailsForm,
  listingDetailsComplete,
  ListingMediaStep,
  listingPayload,
  ListingPreview,
  useListingDraft,
} from "@/components/ml/listing-form";
import { createListing } from "@/lib/catalog.functions";

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

const steps = ["Listing details", "Add photos", "Preview"];
function ListForRent() {
  const navigate = useNavigate();
  const submit = useServerFn(createListing);
  const [step, setStep] = useState(0);
  const [draft, patch] = useListingDraft();
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  async function publish() {
    setPublishing(true);
    try {
      await submit({
        data: {
          category: "gear_rental",
          ...listingPayload(draft, true),
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

        {!published && step === 1 ? <ListingMediaStep value={draft} onChange={patch} /> : null}

        {!published && step === 0 ? (
          <ListingDetailsForm value={draft} onChange={patch} rental />
        ) : null}

        {!published && step === 2 ? (
          <>
            <h2 className="text-2">Preview your listing</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              This is exactly what renters will see.
            </p>
            <div className="mt-4">
              <ListingPreview value={draft} rental />
            </div>
          </>
        ) : null}

        {!published ? (
          <div className="mt-6">
            <ListingStepFooter
              step={step}
              last={step === steps.length - 1}
              onCancel={() => void navigate({ to: "/marketplace/rent" })}
              onBack={() => setStep((s) => s - 1)}
              onNext={() => (step === steps.length - 1 ? void publish() : setStep((s) => s + 1))}
              disabled={!listingDetailsComplete(draft)}
              busy={publishing}
              publishLabel="Publish rental"
            />
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
