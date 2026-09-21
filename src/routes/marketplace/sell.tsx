import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import { ListingStepFooter } from "@/components/ml/market";
import {
  clearListingDraft,
  ListingMediaStep,
  listingPayload,
  listingStepComplete,
  listingSteps,
  ListingWhatStep,
  ListingWhereStep,
  saveListingDraft,
  useListingDraft,
} from "@/components/ml/listing-form";
import { createListing } from "@/lib/catalog.functions";
import { useAuth } from "@/hooks/use-auth";

/*
 * The one listing flow: sell or rent out an instrument or a piece of equipment. Market's Sell
 * opens it on Sell; Rentals' Rent out opens it with ?type=rent (and /marketplace/rent/list
 * forwards here).
 */
export const Route = createFileRoute("/marketplace/sell")({
  validateSearch: (search: Record<string, unknown>): { type?: "rent" } =>
    search["type"] === "rent" ? { type: "rent" } : {},
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
  const { type } = Route.useSearch();
  const { signedIn } = useAuth();
  const submit = useServerFn(createListing);
  const [step, setStep] = useState(0);
  const [draft, patch] = useListingDraft(type === "rent" ? "Rent out" : "Sell");
  const [publishing, setPublishing] = useState(false);
  const last = listingSteps.length - 1;
  const exit = draft.mode === "Rent out" ? "/marketplace/rent" : "/marketplace";

  async function publish() {
    setPublishing(true);
    try {
      const { slug } = await submit({ data: listingPayload(draft) });
      clearListingDraft();
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
        subtitle={`Step ${step + 1} of ${listingSteps.length} · ${listingSteps[step]}`}
        back={exit}
      />
      <div className="px-5 pt-4">
        <div className="mb-5 flex gap-1.5">
          {listingSteps.map((l, i) => (
            <span
              key={l}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--primary)" : "var(--border)" }}
            />
          ))}
        </div>

        {step === 0 ? <ListingWhatStep value={draft} onChange={patch} /> : null}
        {step === 1 ? <ListingMediaStep value={draft} onChange={patch} /> : null}
        {step === last ? <ListingWhereStep value={draft} onChange={patch} /> : null}
      </div>

      <div className="px-5 py-6">
        <ListingStepFooter
          step={step}
          last={step === last}
          onCancel={() => void navigate({ to: exit })}
          onBack={() => setStep(step - 1)}
          onNext={() => (step === last ? void publish() : setStep(step + 1))}
          onSaveDraft={() =>
            saveListingDraft(draft)
              ? toast.success("Draft saved on this device")
              : toast.error("Couldn't save the draft here")
          }
          disabled={!listingStepComplete(draft, step) || (step === last && !signedIn)}
          busy={publishing}
          publishLabel="Publish"
        />
      </div>
    </Screen>
  );
}
