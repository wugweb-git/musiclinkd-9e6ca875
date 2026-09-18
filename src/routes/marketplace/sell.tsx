import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AudioWaveform, Guitar, Package, type LucideIcon } from "lucide-react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { PriceBlock, TrustPill } from "@/components/ml/market";
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

const types = [
  { label: "Instrument", icon: Guitar, category: "gear_sale", itemCategoryKind: "instrument" },
  {
    label: "Audio equipment",
    icon: AudioWaveform,
    category: "gear_sale",
    itemCategoryKind: "equipment",
  },
  { label: "Rental", icon: Package, category: "gear_rental", itemCategoryKind: "equipment" },
] as const satisfies {
  label: string;
  icon: LucideIcon;
  category: string;
  itemCategoryKind?: string;
}[];

// Only the conditions the real schema stores; a service or rental has no condition.
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
  const [type, setType] = useState<(typeof types)[number]["label"]>("Instrument");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<(typeof conditions)[number]["value"]>("used");
  const [publishing, setPublishing] = useState(false);
  const labels = ["What are you offering?", "Add photos", "Listing details", "Preview"];
  const selectedType = types.find((t) => t.label === type)!;

  async function publish() {
    const rupees = Number(price.replace(/[^0-9]/g, ""));
    setPublishing(true);
    try {
      const { slug } = await submit({
        data: {
          category: selectedType.category,
          ...("itemCategoryKind" in selectedType
            ? { itemCategoryKind: selectedType.itemCategoryKind }
            : {}),
          title: title.trim() || "Untitled listing",
          pricePaise: rupees * 100,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(selectedType.category === "gear_sale" ? { condition } : {}),
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
        subtitle={`Step ${step + 1} of 4 · ${labels[step]}`}
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
          <div className="space-y-2">
            {types.map((t) => (
              <button
                key={t.label}
                onClick={() => setType(t.label)}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left ${type === t.label ? "border-foreground" : "border-transparent"} bg-subtle`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-icon-chip">
                  <t.icon size={20} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-sm font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        ) : null}

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

        {step === 2 ? (
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
            {selectedType.category === "gear_sale" ? (
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
            ) : null}
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

        {step === 3 ? (
          <div className="overflow-hidden rounded-lg bg-subtle">
            <div className="flex h-40 items-center justify-center bg-background text-1 text-muted-foreground">
              Cover photo
            </div>
            <div className="p-4">
              <PriceBlock price={{ amount: price ? `₹${price}` : "₹0" }} size="lg" />
              <h2 className="mt-1 text-2">{title || "Untitled listing"}</h2>
              <p className="text-1 text-muted-foreground">
                {type}
                {selectedType.category === "gear_sale"
                  ? ` · ${conditions.find((c) => c.value === condition)!.label}`
                  : ""}
              </p>
              <div className="mt-3">
                <TrustPill label="Posted as you" />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-5 py-6">
        {step < 3 ? (
          <Btn className="w-full" onClick={() => setStep(step + 1)}>
            Continue
          </Btn>
        ) : (
          <Btn
            className="w-full"
            disabled={!title.trim() || !price || publishing || !signedIn}
            onClick={() => void publish()}
          >
            {publishing ? "Publishing…" : "Publish Listing"}
          </Btn>
        )}
        {step > 0 ? (
          <Btn variant="ghost" className="mt-2 w-full" onClick={() => setStep(step - 1)}>
            Back
          </Btn>
        ) : null}
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
