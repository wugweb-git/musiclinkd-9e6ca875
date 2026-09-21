import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import { ListingStepFooter, TrustPill } from "@/components/ml/market";
import {
  emptyListingDraft,
  ListingDetailsForm,
  listingPayload,
  ListingPreview,
  type ListingDraft,
} from "@/components/ml/listing-form";
import { createListing } from "@/lib/catalog.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/marketplace/sell")({
  head: () => ({
    meta: [
      { title: "Create a Listing | MusicLinkd Market" },
      {
        name: "description",
        content:
          "List instruments, gear, rentals, services or studio time to India's music industry.",
      },
      { property: "og:title", content: "Create a Listing | MusicLinkd Market" },
      {
        property: "og:description",
        content: "Publish a listing to 72,000+ verified music professionals.",
      },
    ],
  }),
  component: Sell,
});

function Sell() {
  const navigate = useNavigate();
  const { signedIn } = useAuth();
  const submit = useServerFn(createListing);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>(emptyListingDraft);
  const patch = (p: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...p }));
  const [publishing, setPublishing] = useState(false);
  const labels = ["Listing details", "Add photos", "Preview"];
  const last = labels.length - 1;

  async function publish() {
    setPublishing(true);
    try {
      const { slug } = await submit({
        data: { category: "gear_sale", ...listingPayload(draft, false) },
      });
      void navigate({ to: "/marketplace/l/$id", params: { id: slug } });
    } catch {
      toast.error("Couldn't publish that — try again");
      setPublishing(false);
    }
  }

  return (
    <Screen>
      <TopBar
        title="Create listing"
        subtitle={`Step ${step + 1} of ${labels.length} · ${labels[step]}`}
        back="/marketplace"
      />
      <div className="px-5 pt-4">
        <div className="mb-5 flex gap-1.5">
          {labels.map((l, i) => (
            <span
              key={l}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--primary)" : "var(--border)" }}
            />
          ))}
        </div>

        {step === 1 ? (
          <div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-card text-center text-1 text-muted-foreground">
                Cover photo
                <br />
                Tap to add
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-card text-2 text-muted-foreground"
                >
                  +
                </div>
              ))}
            </div>
            <p className="mt-3 text-1 text-muted-foreground">
              Drag to reorder. First photo becomes the cover. Video and audio previews are supported
              for services.
            </p>
          </div>
        ) : null}

        {step === 0 ? <ListingDetailsForm value={draft} onChange={patch} rental={false} /> : null}

        {step === last ? (
          <>
            <ListingPreview value={draft} rental={false} />
            <div className="mt-3">
              <TrustPill label="Posted as you" />
            </div>
          </>
        ) : null}
      </div>

      <div className="px-5 py-6">
        <ListingStepFooter
          step={step}
          last={step === last}
          onBack={() => setStep(step - 1)}
          onNext={() => (step === last ? void publish() : setStep(step + 1))}
          disabled={step === last && (!draft.name.trim() || !draft.price || !signedIn)}
          busy={publishing}
          publishLabel="Publish Listing"
        />
      </div>
    </Screen>
  );
}
