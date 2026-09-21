import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { ListingStepFooter, PriceBlock, TrustPill } from "@/components/ml/market";
import { kindOfSubCategory, listingSubCategories } from "@/lib/listing-category";
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

// Only the conditions the real schema stores.
const conditions = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like_new" },
  { label: "Used", value: "used" },
] as const;

function Sell() {
  const navigate = useNavigate();
  const { signedIn } = useAuth();
  const submit = useServerFn(createListing);
  const [step, setStep] = useState(0);
  const [sub, setSub] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<(typeof conditions)[number]["value"]>("used");
  const [publishing, setPublishing] = useState(false);
  const labels = ["Add photos", "Listing details", "Preview"];
  const last = labels.length - 1;

  async function publish() {
    const rupees = Number(price.replace(/[^0-9]/g, ""));
    setPublishing(true);
    try {
      const { slug } = await submit({
        data: {
          category: "gear_sale",
          ...(sub ? { itemCategoryKind: kindOfSubCategory(sub), itemCategory: sub } : {}),
          title: title.trim() || "Untitled listing",
          pricePaise: rupees * 100,
          ...(description.trim() ? { description: description.trim() } : {}),
          condition,
        },
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

        {step === 0 ? (
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

        {step === 1 ? (
          <div className="space-y-4">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Fender Stratocaster, 2022"
                className="h-13 w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Price (₹)">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="1,84,000"
                className="h-13 w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {listingSubCategories.map((s) => (
                  <Chip key={s} active={sub === s} onClick={() => setSub(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Condition">
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Chip
                    key={c.value}
                    active={condition === c.value}
                    onClick={() => setCondition(c.value)}
                  >
                    {c.label}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Description">
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Condition, history, what's included..."
                className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
              />
            </Field>
          </div>
        ) : null}

        {step === last ? (
          <div className="overflow-hidden rounded-lg bg-subtle">
            <div className="flex h-40 items-center justify-center bg-background text-1 text-muted-foreground">
              Cover photo
            </div>
            <div className="p-4">
              <PriceBlock price={{ amount: price ? `₹${price}` : "₹0" }} size="lg" />
              <h2 className="mt-1 text-2">{title || "Untitled listing"}</h2>
              <p className="text-1 text-muted-foreground">
                {[sub, conditions.find((c) => c.value === condition)!.label]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-3">
                <TrustPill label="Posted as you" />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-5 py-6">
        <ListingStepFooter
          step={step}
          last={step === last}
          onBack={() => setStep(step - 1)}
          onNext={() => (step === last ? void publish() : setStep(step + 1))}
          disabled={step === last && (!title.trim() || !price || !signedIn)}
          busy={publishing}
          publishLabel="Publish Listing"
        />
      </div>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="pill mb-1.5 bg-background text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
