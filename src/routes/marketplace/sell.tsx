import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { PriceBlock, TrustPill } from "@/components/ml/market";
import { sellers } from "@/data/market";

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
  { label: "Instrument", emoji: "🎸" },
  { label: "Audio equipment", emoji: "🎙" },
  { label: "Rental", emoji: "📦" },
  { label: "Service", emoji: "🎚" },
  { label: "Studio", emoji: "🏢" },
];

const conditions = ["New", "Like New", "Excellent", "Good", "Fair"];

function Sell() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState("Instrument");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const seller = sellers[0]!;
  const labels = ["What are you offering?", "Add photos", "Listing details", "Preview"];

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
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-sm text-2"
                  style={{ background: "var(--surface-subtle)" }}
                >
                  {t.emoji}
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
            {type !== "Service" && type !== "Studio" ? (
              <Field label="Condition">
                <div className="flex flex-wrap gap-2">
                  {conditions.map((c) => (
                    <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </Field>
            ) : null}
            <Field label="Description">
              <textarea
                rows={4}
                placeholder="Condition, history, what's included..."
                className="w-full rounded-lg bg-subtle p-4 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Location">
              <input
                defaultValue="Dadar, Mumbai"
                className="h-13 w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary"
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
              <PriceBlock price={{ amount: price ? `₹${price}` : "₹1,84,000" }} size="lg" />
              <h2 className="mt-1 text-2">{title || "Fender Stratocaster, 2022"}</h2>
              <p className="text-1 text-muted-foreground">
                {type} · {condition} · Dadar, Mumbai
              </p>
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-subtle p-3">
                <img src={seller.photo} alt="" className="h-10 w-10 rounded-sm object-cover" />
                <div>
                  <p className="text-1 font-semibold">{seller.name}</p>
                  <p className="text-1 text-muted-foreground">{seller.role}</p>
                </div>
              </div>
              <div className="mt-3">
                <TrustPill label="Verified identity" />
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
          <>
            <BtnLink to="/marketplace/mine" className="w-full">
              Publish Listing
            </BtnLink>
            <Btn variant="outline" className="mt-2 w-full">
              Save Draft
            </Btn>
          </>
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
