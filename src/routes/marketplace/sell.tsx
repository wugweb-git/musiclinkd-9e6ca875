import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import { ListingStepFooter } from "@/components/ml/market";
import {
  clearListingDraft,
  draftFromListing,
  ListingMediaStep,
  listingPayload,
  listingStepComplete,
  listingSteps,
  ListingWhatStep,
  ListingWhereStep,
  saveListingDraft,
  useListingDraft,
} from "@/components/ml/listing-form";
import { useGearTaxonomy } from "@/lib/listing-category";
import { createListing, listMyManagedListings, updateListing } from "@/lib/catalog.functions";
import { useAuth } from "@/hooks/use-auth";
import { StepProgress } from "@/components/ml/kit";

/*
 * The one listing flow: sell or rent out an instrument or a piece of equipment. My listings'
 * Add listing opens it on Sell or with ?type=rent (and /marketplace/rent/list forwards here);
 * ?edit=<id> opens one of the seller's listings to change it.
 */
export const Route = createFileRoute("/marketplace/sell")({
  validateSearch: (search: Record<string, unknown>): { type?: "rent"; edit?: string } => ({
    ...(search["type"] === "rent" ? { type: "rent" as const } : {}),
    ...(typeof search["edit"] === "string" ? { edit: search["edit"] } : {}),
  }),
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
  const { type, edit } = Route.useSearch();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const submit = useServerFn(createListing);
  const save = useServerFn(updateListing);
  const loadMine = useServerFn(listMyManagedListings);
  const [step, setStep] = useState(0);
  const [draft, patch] = useListingDraft(type === "rent" ? "Rent out" : "Sell", Boolean(edit));
  const [publishing, setPublishing] = useState(false);
  const taxonomy = useGearTaxonomy();
  const last = listingSteps.length - 1;
  const exit = "/marketplace/mine";

  // Editing: the listing comes from the seller's own list and fills the draft once.
  const mine = useQuery({
    queryKey: ["marketplace", "mine", "managed"],
    queryFn: () => loadMine(),
    enabled: signedIn && Boolean(edit),
  });
  const editing = edit ? mine.data?.find((l) => l.id === edit) : undefined;
  const filled = useRef(false);
  useEffect(() => {
    if (!editing || filled.current) return;
    filled.current = true;
    patch(draftFromListing(editing));
  }, [editing, patch]);

  async function saveChanges() {
    if (!edit) return;
    setPublishing(true);
    try {
      await save({ data: { id: edit, ...listingPayload(draft, taxonomy) } });
      await queryClient.invalidateQueries({ queryKey: ["marketplace", "mine"] });
      toast.success("Changes saved");
      void navigate({ to: "/marketplace/mine" });
    } catch {
      toast.error("Couldn't save that — try again");
      setPublishing(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const { slug } = await submit({ data: listingPayload(draft, taxonomy) });
      clearListingDraft();
      await queryClient.invalidateQueries({ queryKey: ["marketplace", "mine"] });
      void navigate({ to: "/marketplace/l/$id", params: { id: slug } });
    } catch {
      toast.error("Couldn't publish that — try again");
      setPublishing(false);
    }
  }

  return (
    <Screen>
      <TopBar
        title={edit ? "Edit listing" : "Create listing"}
        subtitle={`Step ${step + 1} of ${listingSteps.length} · ${listingSteps[step]}`}
        back={exit}
      />
      <div className="px-5 pt-4">
        <StepProgress total={listingSteps.length} current={step} />

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
          onNext={() =>
            step === last ? void (edit ? saveChanges() : publish()) : setStep(step + 1)
          }
          {...(edit
            ? {}
            : {
                onSaveDraft: () =>
                  saveListingDraft(draft)
                    ? toast.success("Draft saved on this device")
                    : toast.error("Couldn't save the draft here"),
              })}
          disabled={!listingStepComplete(draft, step) || (step === last && !signedIn)}
          busy={publishing}
          publishLabel={edit ? "Save changes" : "Publish"}
        />
      </div>
    </Screen>
  );
}
