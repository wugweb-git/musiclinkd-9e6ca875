import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, Loading, Price } from "@/components/ml/kit";
import { StateCard } from "@/components/ml/portfolio";
import {
  pricingModelUnit,
  bookingWindows,
  noticeDefault,
  type PricingModel,
} from "@/data/services";
import { useAuth } from "@/hooks/use-auth";
import {
  categoryEmoji,
  optionLabel,
  useRefreshServices,
  useService,
  useServiceOptions,
} from "@/hooks/use-services";
import { haptic } from "@/lib/haptics";
import { getMyProfile } from "@/lib/portfolio.functions";
import { priceParts, type PriceParts } from "@/lib/price";
import { saveService, type ServiceDetail } from "@/lib/services.functions";

const steps = ["category", "basics", "pricing", "delivery", "review"] as const;
type Step = (typeof steps)[number];

export const Route = createFileRoute("/services/new")({
  validateSearch: (search: Record<string, unknown>): { step: Step; id?: string } => {
    const step = (steps.includes(search["step"] as Step) ? search["step"] : "category") as Step;
    const id = search["id"];
    // `id` edits one of your services; without it the flow adds a new one.
    return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id) ? { step, id } : { step };
  },
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
  const { step, id } = Route.useSearch();
  const navigate = useNavigate();
  const idx = steps.indexOf(step);
  const go = (s: Step) =>
    navigate({ to: "/services/new", search: id ? { step: s, id } : { step: s } });

  const { user, signedIn } = useAuth();
  const { options, pending: optionsPending, error: optionsError } = useServiceOptions();
  const loadProfile = useServerFn(getMyProfile);
  const profile = useQuery({
    queryKey: ["profile", "me", user?.id ?? null],
    queryFn: () => loadProfile(),
    enabled: signedIn,
  });
  const editing = useService(id ?? "");
  const save = useServerFn(saveService);
  const refresh = useRefreshServices();

  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [requirements, setRequirements] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [minHours, setMinHours] = useState("");
  const [notice, setNotice] = useState(noticeDefault);
  const [turnaround, setTurnaround] = useState("");
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [busy, setBusy] = useState<"draft" | "active" | null>(null);
  const [published, setPublished] = useState(false);
  const [filled, setFilled] = useState<string | null>(null);

  // Editing: start from the stored service once it arrives.
  const source: ServiceDetail | null = id && editing.owner ? editing.service : null;
  useEffect(() => {
    if (!source || filled === source.id) return;
    setFilled(source.id);
    setCategory(source.category);
    setTitle(source.name);
    setDescription(source.description ?? "");
    setDeliverables(source.deliverables.join("\n"));
    setRequirements(source.requirements.join("\n"));
    setModel(source.pricing_model);
    setPrice(source.price_paise == null ? "" : String(source.price_paise / 100));
    setMinHours(source.min_hours == null ? "" : String(source.min_hours));
    setNotice(source.notice ?? "");
    setTurnaround(source.turnaround ?? "");
    setWorkModes(source.work_modes);
  }, [source, filled]);

  if (id && (editing.pending || !source)) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Edit details & pricing" back="/services" />
        <div className="px-5 pt-6">
          {editing.pending ? (
            <Loading />
          ) : editing.error ? (
            <StateCard
              tone="error"
              title="We couldn't load this service"
              body="Check your connection and try again."
              action={<Btn onClick={editing.retry}>Retry</Btn>}
            />
          ) : (
            <EmptyState title="Service not found" body="It may have been removed." />
          )}
        </div>
      </Screen>
    );
  }

  // Categories this person's roles offer; every category when they have no role, or when none of
  // their roles maps to a category. A stored category stays pickable.
  const roles = ((profile.data as { roles?: string[] | null } | null | undefined)?.roles ??
    []) as string[];
  const offered = new Set(roles.flatMap((r) => options?.categoriesByRole[r] ?? []));
  const categories = (options?.categories ?? []).filter(
    (c) => offered.size === 0 || offered.has(c.slug) || c.slug === source?.category,
  );

  const unit = model ? pricingModelUnit[model as PricingModel] : undefined;
  const modelLabel = optionLabel(options?.pricingModels, model);
  const rupees = price.replace(/[₹,\s]/g, "");
  const pricePaise =
    rupees && Number.isFinite(Number(rupees)) ? Math.round(Number(rupees) * 100) : null;
  const hours = /^\d+$/.test(minHours.trim()) ? Number(minHours.trim()) : null;
  const categoryLabel = optionLabel(options?.categories, category);
  const reviewPrice = priceParts(pricePaise, unit, unit ? null : modelLabel);
  const list = (text: string) =>
    text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

  async function submit(status: "draft" | "active") {
    if (!title.trim()) {
      haptic("error");
      toast.error("Give this service a title.");
      void go("basics");
      return;
    }
    if (rupees && pricePaise == null) {
      haptic("error");
      toast.error("Use a number for the starting price.");
      void go("pricing");
      return;
    }
    if (!signedIn) {
      void navigate({ to: "/welcome" });
      return;
    }
    setBusy(status);
    try {
      await save({
        data: {
          ...(source ? { id: source.id } : {}),
          name: title.trim(),
          description: description.trim() || null,
          category,
          pricing_model: model,
          price_paise: pricePaise,
          // A stored unit the pricing models do not name ("film") is kept while the model is unchanged.
          price_unit:
            pricePaise == null
              ? null
              : (unit ?? (model === source?.pricing_model ? source?.price_unit : null) ?? null),
          min_hours: model === "hourly" && hours ? hours : null,
          turnaround: turnaround.trim() || null,
          notice: notice || null,
          work_modes: workModes,
          deliverables: list(deliverables),
          requirements: list(requirements),
          status,
        },
      });
      haptic("confirm");
      await refresh();
      if (status === "active") {
        setPublished(true);
      } else {
        toast.success("Draft saved");
        void navigate({ to: "/services" });
      }
    } catch (err) {
      haptic("error");
      toast.error(err instanceof Error ? err.message : "Could not save this service");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen bottomNav={false}>
      <TopBar
        title={source ? "Edit details & pricing" : "Add a service"}
        subtitle={`Step ${idx + 1} of ${steps.length}`}
        back={source ? `/services/${source.id}` : "/services"}
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
        {optionsError && (step === "category" || step === "pricing" || step === "delivery") ? (
          <StateCard
            tone="error"
            title="We couldn't load the choices"
            body="Check your connection and try again."
          />
        ) : null}

        {step === "category" ? (
          <Card className="space-y-3">
            <h1 className="text-[16px] font-bold">What are you offering?</h1>
            {optionsPending ? (
              <Loading rows={2} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Chip
                    key={c.slug}
                    active={category === c.slug}
                    onClick={() => setCategory(c.slug)}
                  >
                    {joinEmoji(categoryEmoji(c.slug), c.label)}
                  </Chip>
                ))}
              </div>
            )}
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
            <Lines label="Deliverables" value={deliverables} onChange={setDeliverables} />
            <Lines label="Requirements" value={requirements} onChange={setRequirements} />
            <p className="text-[11px] text-muted-foreground">
              Services with a clear deliverable list get roughly twice the enquiries.
            </p>
          </Card>
        ) : null}

        {step === "pricing" ? (
          <Card className="space-y-3">
            <h1 className="text-[16px] font-bold">How do you charge?</h1>
            {optionsPending ? (
              <Loading rows={1} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(options?.pricingModels ?? []).map((m) => (
                  <Chip key={m.slug} active={model === m.slug} onClick={() => setModel(m.slug)}>
                    {m.label}
                  </Chip>
                ))}
              </div>
            )}
            <Field
              label="Starting price (₹)"
              value={price}
              onChange={setPrice}
              placeholder="8000"
              inputMode="decimal"
            />
            {model === "hourly" ? (
              <Field
                label="Minimum"
                value={minHours}
                onChange={setMinHours}
                placeholder="1"
                inputMode="numeric"
              />
            ) : null}
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
            {options?.workModes.length ? (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Mode
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.workModes.map((m) => {
                    const on = workModes.includes(m.slug);
                    return (
                      <Chip
                        key={m.slug}
                        active={on}
                        onClick={() =>
                          setWorkModes((cur) =>
                            on ? cur.filter((x) => x !== m.slug) : [...cur, m.slug],
                          )
                        }
                      >
                        {m.label}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <Link
              to="/services/availability"
              className="block text-[12px] font-semibold text-foreground"
            >
              Set your weekly availability →
            </Link>
          </Card>
        ) : null}

        {step === "review" ? (
          <Card className="space-y-2">
            <h1 className="text-[16px] font-bold">Review</h1>
            {(
              [
                ["Category", categoryLabel || "—"],
                ["Title", title || "Untitled service"],
                ["Pricing", reviewPrice ?? "—"],
                ["Turnaround", turnaround || "—"],
                ["Notice", notice || "—"],
              ] as [string, string | PriceParts][]
            ).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-border py-2 last:border-0"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {k}
                </span>
                {typeof v === "string" ? (
                  <span className="max-w-[60%] text-right text-[13px] font-semibold">{v}</span>
                ) : (
                  <Price
                    price={v}
                    align="end"
                    className="max-w-[60%]"
                    amountClassName="text-[13px] font-semibold"
                  />
                )}
              </div>
            ))}
            {categoryLabel ? (
              <p className="pt-1 text-[12px] text-muted-foreground">
                Publishing adds this to your profile and to Discover results for{" "}
                {categoryLabel.toLowerCase()}.
              </p>
            ) : null}
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
            <Btn
              className="flex-1"
              loading={busy === "active"}
              disabled={busy !== null}
              onClick={() => void submit("active")}
            >
              Publish service
            </Btn>
          )}
        </div>
        {step === "review" ? (
          <Btn
            variant="ghost"
            className="w-full"
            loading={busy === "draft"}
            disabled={busy !== null}
            onClick={() => void submit("draft")}
          >
            Save draft
          </Btn>
        ) : null}
      </div>

      <Dialog
        open={published}
        title="Service published"
        body="It is live on your profile and bookable straight away. You can pause it any time."
        onClose={() => setPublished(false)}
      >
        <BtnLink to="/services" className="w-full">
          Back to services
        </BtnLink>
      </Dialog>
    </Screen>
  );
}

const joinEmoji = (emoji: string, label: string) => (emoji ? `${emoji} ${label}` : label);

/** A list typed one item per line. */
function Lines({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="One per line"
        className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
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
        {...(inputMode ? { inputMode } : {})}
        className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-primary"
      />
    </label>
  );
}
