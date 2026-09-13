import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, Dialog } from "@/components/ml/kit";
import {
  serviceCategories,
  pricingModelLabel,
  bookingWindows,
  type PricingModel,
} from "@/data/services";

const steps = ["category", "basics", "pricing", "delivery", "review"] as const;
type Step = (typeof steps)[number];

export const Route = createFileRoute("/services/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: (steps.includes(search["step"] as Step) ? search["step"] : "category") as Step,
  }),
  head: () => ({
    meta: [
      { title: "Add a service | MusicLinkd" },
      {
        name: "description",
        content: "Describe what you offer, set a price and let people book it directly.",
      },
      { property: "og:title", content: "Add a service | MusicLinkd" },
      { property: "og:description", content: "Create a bookable service in five short steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewService,
});

function NewService() {
  const { step } = Route.useSearch();
  const navigate = useNavigate();
  const idx = steps.indexOf(step);
  const go = (s: Step) => navigate({ to: "/services/new", search: { step: s } });

  const [category, setCategory] = useState(serviceCategories[0]!.label);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState<PricingModel>("per_song");
  const [price, setPrice] = useState("8000");
  const [notice, setNotice] = useState(bookingWindows[1]!);
  const [turnaround, setTurnaround] = useState("3–4 days");
  const [published, setPublished] = useState(false);

  return (
    <Screen bottomNav={false}>
      <TopBar
        title="Add a service"
        subtitle={`Step ${idx + 1} of ${steps.length}`}
        back="/services"
      />

      <div className="px-5 pt-3">
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-subtle"}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 px-5 pt-5 pb-8">
        {step === "category" ? (
          <Card className="space-y-3">
            <h1 className="text-[16px] font-bold">What are you offering?</h1>
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((c) => (
                <Chip
                  key={c.key}
                  active={category === c.label}
                  onClick={() => setCategory(c.label)}
                >
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
          </Card>
        ) : null}

        {step === "basics" ? (
          <Card className="space-y-3">
            <h1 className="text-[16px] font-bold">Describe it plainly</h1>
            <Field
              label="Title"
              value={title}
              onChange={setTitle}
              placeholder="Session vocals — lead & harmonies"
            />
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What the client gets, how you work, what makes it yours."
                className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              Services with a clear deliverable list get roughly twice the enquiries.
            </p>
          </Card>
        ) : null}

        {step === "pricing" ? (
          <Card className="space-y-3">
            <h1 className="text-[16px] font-bold">How do you charge?</h1>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(pricingModelLabel) as PricingModel[]).map((m) => (
                <Chip key={m} active={model === m} onClick={() => setModel(m)}>
                  {pricingModelLabel[m]}
                </Chip>
              ))}
            </div>
            <Field
              label="Starting price (₹)"
              value={price}
              onChange={setPrice}
              placeholder="8000"
            />
            <p className="text-[11px] text-muted-foreground">
              You can still send a custom quote from a booking request.
            </p>
          </Card>
        ) : null}

        {step === "delivery" ? (
          <Card className="space-y-3">
            <h1 className="text-[16px] font-bold">Delivery & notice</h1>
            <Field
              label="Turnaround"
              value={turnaround}
              onChange={setTurnaround}
              placeholder="3–4 days"
            />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Notice needed
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {bookingWindows.map((w) => (
                  <Chip key={w} active={notice === w} onClick={() => setNotice(w)}>
                    {w}
                  </Chip>
                ))}
              </div>
            </div>
            <Link
              to="/services/availability"
              className="block text-[12px] font-semibold text-primary"
            >
              Set your weekly availability →
            </Link>
          </Card>
        ) : null}

        {step === "review" ? (
          <Card className="space-y-2">
            <h1 className="text-[16px] font-bold">Review</h1>
            {[
              ["Category", category],
              ["Title", title || "Untitled service"],
              ["Pricing", `${pricingModelLabel[model]} · ₹${price || "—"}`],
              ["Turnaround", turnaround],
              ["Notice", notice],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-border py-2 last:border-0"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {k}
                </span>
                <span className="max-w-[60%] text-right text-[13px] font-semibold">{v}</span>
              </div>
            ))}
            <p className="pt-1 text-[12px] text-muted-foreground">
              Publishing adds this to your profile and to Discover results for{" "}
              {category.toLowerCase()}.
            </p>
          </Card>
        ) : null}

        <div className="flex gap-2">
          {idx > 0 ? (
            <Btn variant="outline" className="flex-1" onClick={() => go(steps[idx - 1]!)}>
              Back
            </Btn>
          ) : null}
          {idx < steps.length - 1 ? (
            <Btn className="flex-1" onClick={() => go(steps[idx + 1]!)}>
              Continue
            </Btn>
          ) : (
            <Btn className="flex-1" onClick={() => setPublished(true)}>
              Publish service
            </Btn>
          )}
        </div>
      </div>

      <Dialog
        open={published}
        title="Service published"
        body="It is live on your profile and bookable straight away. You can pause it any time."
        onClose={() => setPublished(false)}
      >
        <Link to="/services">
          <Btn className="w-full">Back to services</Btn>
        </Link>
      </Dialog>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-primary"
      />
    </label>
  );
}
