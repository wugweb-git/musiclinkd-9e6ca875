import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Building2,
  Gauge,
  GraduationCap,
  Guitar,
  FolderKanban,
  Headphones,
  Hourglass,
  Laptop,
  MapPin,
  MicVocal,
  Music,
  PenLine,
  Radio,
  Plane,
  SlidersVertical,
  Sparkles,
  Speaker,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Dialog, EmptyState, Loading, StepProgress, StateCard } from "@/components/ml/kit";

import { ListingStepFooter } from "@/components/ml/market";
import {
  Field,
  inputClass,
  SheetMultiSelect,
  SheetSelect,
  TagListField,
} from "@/components/ml/listing-form";
import { iconSize } from "@/lib/tokens";
import { amenityIcon } from "@/lib/amenity-icons";
import type { PortfolioItem } from "@/data/portfolio";
import { ServiceCard } from "@/components/ml/profile";
import type { ServiceItem } from "@/data/profile";
import { useAuth } from "@/hooks/use-auth";
import { useRefreshServices, useService, useServiceOptions } from "@/hooks/use-services";
import { haptic } from "@/lib/haptics";
import { getMyProfile, listMyPortfolio } from "@/lib/portfolio.functions";
import { priceParts } from "@/lib/price";
import { saveService, type ServiceDetail } from "@/lib/services.functions";
import { getMyStudioEquipment } from "@/lib/bookable-owner.functions";
import { useMyStudioPhotos } from "@/components/ml/studio-setup";
import { sized } from "@/lib/image-url";

/*
 * Add or edit a service in two steps, on the listing flow's pieces (plain labels with a hint line,
 * drawer pickers with icons, the icon footer, a preview of the card as it shows on your profile):
 * what you offer, then price and publish.
 */
/*
 * Step slugs are nouns, like every other flow's (`/business/new` uses type, details, policies).
 * The first was `what`, which is a sentence fragment, not a name — `?step=what` read as a bug in
 * the address bar (owner, 29 Sep 2026). The first step is also no longer written into the URL at
 * all: `/services/new` *is* step one, so there is nothing for a parameter to say.
 */
const steps = ["details", "price"] as const;
type Step = (typeof steps)[number];
const stepLabels: Record<Step, string> = {
  details: "What you offer",
  price: "Price & publish",
};
/** Older links name the steps this flow used to have, including the `what` this replaced. */
const legacySteps: Record<string, Step> = {
  what: "details",
  category: "details",
  basics: "details",
  pricing: "price",
  delivery: "price",
  review: "price",
};

/** Delivery times offered in the drawer; a stored value outside the list stays pickable. */
const deliveryTimes = ["1–2 days", "3–5 days", "1 week", "2 weeks"];
const modeIcons: Record<string, LucideIcon> = {
  in_person: MapPin,
  remote: Laptop,
  hybrid: ArrowLeftRight,
  touring: Plane,
};

export const Route = createFileRoute("/services/new")({
  validateSearch: (search: Record<string, unknown>): { step?: Step; id?: string } => {
    const raw = typeof search["step"] === "string" ? search["step"] : "";
    const step = (steps as readonly string[]).includes(raw) ? (raw as Step) : legacySteps[raw];
    const id = search["id"];
    // `id` edits one of your services; without it the flow adds a new one.
    return {
      ...(step ? { step } : {}),
      ...(typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id) ? { id } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Add a service | MusicLinkd" },
      {
        name: "description",
        content: "Describe what you offer, set a price and let people book it directly.",
      },
      { property: "og:title", content: "Add a service | MusicLinkd" },
      { property: "og:description", content: "Create a bookable service in three short steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewService,
});

/** A line icon per service category, for the drawer. */
const categoryIcons: Record<string, LucideIcon> = {
  vocals: MicVocal,
  mixing: SlidersVertical,
  mastering: Gauge,
  production: Music,
  instrument: Guitar,
  songwriting: PenLine,
  live: Speaker,
  studio: Building2,
  teaching: GraduationCap,
  hosting: Radio,
};

function NewService() {
  const search = Route.useSearch();
  const id = search.id;
  const step: Step = search.step ?? "details";
  const navigate = useNavigate();
  const idx = steps.indexOf(step);
  // The first step is the bare address; only later steps name themselves.
  const go = (s: Step) =>
    navigate({
      to: "/services/new",
      search: {
        ...(s === steps[0] ? {} : { step: s }),
        ...(id ? { id } : {}),
      },
    });

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

  const loadPortfolio = useServerFn(listMyPortfolio);
  const portfolio = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => loadPortfolio(),
    enabled: signedIn,
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [exampleIds, setExampleIds] = useState<string[]>([]);
  // A studio's service shows what it uses (amenities, equipment) where a talent's shows portfolio
  // examples (owner, 22 Sep 2026). The studio's own lists, with their photos.
  const [amenitySlugs, setAmenitySlugs] = useState<string[]>([]);
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);
  const loadEquipment = useServerFn(getMyStudioEquipment);
  const studioEquipment = useQuery({
    queryKey: ["studio-equipment", "mine"],
    queryFn: () => loadEquipment(),
    enabled: signedIn,
    retry: false,
  });
  const studioPhotos = useMyStudioPhotos();
  const isStudio = studioEquipment.isSuccess;
  const [price, setPrice] = useState("");
  const [turnaround, setTurnaround] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "active" | null>(null);
  const [published, setPublished] = useState(false);
  const [filled, setFilled] = useState<string | null>(null);

  // Editing: start from the stored service once it arrives.
  const source: ServiceDetail | null = id && editing.owner ? editing.service : null;
  useEffect(() => {
    if (!source || filled === source.id) return;
    setFilled(source.id);
    setCategories(source.categories);
    setTitle(source.name);
    setDescription(source.description ?? "");
    setDeliverables(source.deliverables);
    setRequirements(source.requirements);
    setExampleIds(source.example_ids);
    setAmenitySlugs(source.amenity_slugs);
    setEquipmentIds(source.equipment_ids);
    setPrice(source.price_paise == null ? "" : String(source.price_paise / 100));
    setTurnaround(source.turnaround);
    setMode(source.work_modes[0] ?? null);
  }, [source, filled]);

  if (id && (editing.pending || !source)) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Edit service" back="/services" />
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
  // their roles maps to a category. Stored categories stay pickable.
  const roles = ((profile.data as { roles?: string[] | null } | null | undefined)?.roles ??
    []) as string[];
  const offered = new Set(roles.flatMap((r) => options?.categoriesByRole[r] ?? []));
  // The specific categories (Playback singing, Club nights…); a broad one (Vocals, Live) shows only
  // when nothing specific sits under it, or when this service already uses it.
  const allCategories = options?.categories ?? [];
  const broadWithChildren = new Set(allCategories.map((c) => c.parent).filter(Boolean));
  const categoryOptions = allCategories
    .filter(
      (c) =>
        source?.categories.includes(c.slug) ||
        ((offered.size === 0 || offered.has(c.slug)) && !broadWithChildren.has(c.slug)),
    )
    .map((c) => ({
      value: c.slug,
      label: c.label,
      icon: categoryIcons[c.slug] ?? categoryIcons[c.parent ?? ""] ?? Sparkles,
    }));

  const deliveryOptions = [
    ...deliveryTimes,
    ...(turnaround && !deliveryTimes.includes(turnaround) ? [turnaround] : []),
  ].map((d) => ({ value: d, label: d, icon: Hourglass }));
  const modeOptions = (options?.workModes ?? []).map((m) => ({
    value: m.slug,
    label: m.label,
    icon: modeIcons[m.slug] ?? MapPin,
  }));
  // Examples come from the owner's own published portfolio.
  const works = ((portfolio.data ?? []) as PortfolioItem[]).filter((w) => w.published);
  const exampleOptions = works.map((w) => ({
    value: w.id,
    label: w.title,
    iconNode: w.cover_url ? (
      <img src={sized(w.cover_url, { width: 412 })} alt="" className="h-full w-full object-cover" />
    ) : (
      <FolderKanban size={iconSize.md} strokeWidth={1.75} aria-hidden />
    ),
  }));

  // A studio's amenities and equipment, each row showing its first photo when it has one.
  const photoOf = (type: "facility" | "equipment", id: string) =>
    studioPhotos.data?.photos.find((p) => p.subject_type === type && p.subject_id === id)?.url;
  const thumb = (url: string | undefined, fallback: ReactNode) =>
    url ? (
      <img src={sized(url, { width: 412 })} alt="" className="h-full w-full object-cover" />
    ) : (
      fallback
    );
  const amenityOptions = (studioPhotos.data?.facilities ?? []).map((f) => {
    const FacilityIcon = amenityIcon(f.slug);
    return {
      value: f.slug,
      label: f.label,
      iconNode: thumb(photoOf("facility", f.slug), <FacilityIcon size={iconSize.md} aria-hidden />),
    };
  });
  const equipmentOptions = (studioEquipment.data?.items ?? []).map((e) => ({
    value: e.id,
    label: e.name,
    iconNode: thumb(photoOf("equipment", e.id), <Headphones size={iconSize.md} aria-hidden />),
  }));

  const rupees = price.replace(/[₹,\s]/g, "");
  const pricePaise =
    rupees && Number.isFinite(Number(rupees)) ? Math.round(Number(rupees) * 100) : null;
  const previewPrice = priceParts(pricePaise, null);

  // Each step's Continue waits for that step's own fields.
  const ready =
    step === "details"
      ? Boolean(
          categories.length &&
          title.trim() &&
          description.trim() &&
          deliverables.length &&
          (isStudio ? amenitySlugs.length || equipmentIds.length : exampleIds.length),
        )
      : Boolean((pricePaise ?? 0) > 0 && turnaround && mode);

  async function submit(status: "draft" | "active") {
    if (!signedIn) {
      void navigate({ to: "/welcome" });
      return;
    }
    setBusy(status);
    try {
      await save({
        data: {
          ...(source ? { id: source.id } : {}),
          name: title.trim() || "Untitled service",
          description: description.trim() || null,
          category: categories[0] ?? null,
          categories,
          example_ids: exampleIds,
          ...(isStudio ? { amenity_slugs: amenitySlugs, equipment_ids: equipmentIds } : {}),
          // One universal price: a starting price, with no unit or pricing model.
          pricing_model: null,
          price_paise: pricePaise,
          price_unit: null,
          min_hours: null,
          turnaround: turnaround ?? null,
          // Not asked any more; a stored value is kept as it was.
          notice: source?.notice ?? null,
          work_modes: mode ? [mode] : [],
          deliverables,
          requirements,
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

  const modeText = (
    mode === "remote"
      ? "Remote"
      : mode === "hybrid"
        ? "Remote · In person"
        : mode
          ? "In person"
          : undefined
  ) as ServiceItem["mode"];

  return (
    <Screen bottomNav={false} className="pb-8">
      <TopBar
        title={source ? "Edit service" : "Add a service"}
        subtitle={`Step ${idx + 1} of ${steps.length} · ${stepLabels[step]}`}
        back={source ? `/services/${source.id}` : "/services"}
      />

      <div className="px-5 pt-4">
        <StepProgress total={steps.length} current={idx} />

        {optionsError ? (
          <StateCard
            tone="error"
            title="We couldn't load the choices"
            body="Check your connection and try again."
          />
        ) : null}

        {step === "details" ? (
          optionsPending ? (
            <Loading rows={3} />
          ) : (
            <div className="space-y-4">
              <Field
                label="Categories"
                id="service-categories"
                hint="Select up to 3 categories to help clients find your service"
              >
                <SheetMultiSelect
                  title="Categories"
                  value={categories}
                  options={categoryOptions}
                  onChange={setCategories}
                  placeholder="What are you offering?"
                  max={3}
                />
              </Field>
              <Field label="Title" id="service-title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Session vocals — lead & harmonies"
                  className={inputClass}
                />
              </Field>
              <Field label="Description" id="service-description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What the client gets, how you work, what makes it yours."
                  className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
                />
              </Field>
              <TagListField
                label="Deliverables"
                id="service-deliverables"
                placeholder="Dry WAV stems"
                value={deliverables}
                onChange={setDeliverables}
              />
              {isStudio ? (
                <>
                  <Field
                    label="Amenities it uses"
                    id="service-amenities"
                    hint="Shown on the service with their photos. Pick amenities, equipment or both."
                  >
                    {amenityOptions.length ? (
                      <SheetMultiSelect
                        title="Amenities it uses"
                        value={amenitySlugs}
                        options={amenityOptions}
                        onChange={setAmenitySlugs}
                        placeholder="Pick from your amenities"
                        max={amenityOptions.length}
                      />
                    ) : (
                      <StudioSetupNote what="amenities" />
                    )}
                  </Field>
                  <Field label="Equipment it uses" id="service-equipment">
                    {equipmentOptions.length ? (
                      <SheetMultiSelect
                        title="Equipment it uses"
                        value={equipmentIds}
                        options={equipmentOptions}
                        onChange={setEquipmentIds}
                        placeholder="Pick from your equipment"
                        max={equipmentOptions.length}
                      />
                    ) : (
                      <StudioSetupNote what="equipment" />
                    )}
                  </Field>
                </>
              ) : null}
              {isStudio ? null : (
                <Field
                  label="Examples from your portfolio"
                  id="service-examples"
                  hint="Shown on the service, so clients hear or see the work"
                >
                  {works.length ? (
                    <SheetMultiSelect
                      title="Examples"
                      value={exampleIds}
                      options={exampleOptions}
                      onChange={setExampleIds}
                      placeholder="Pick from your portfolio"
                      max={6}
                    />
                  ) : (
                    <div className="rounded-lg bg-card p-4">
                      <p className="text-1 text-foreground">
                        Nothing in your portfolio yet. Add a piece of work first, then pick it here.
                      </p>
                      <BtnLink
                        to="/portfolio"
                        search={{ add: "1" }}
                        variant="outline"
                        className="mt-3 w-full"
                      >
                        Add to portfolio
                      </BtnLink>
                    </div>
                  )}
                </Field>
              )}
              <TagListField
                label="What you need (optional)"
                id="service-requirements"
                placeholder="Guide track"
                value={requirements}
                onChange={setRequirements}
              />
            </div>
          )
        ) : null}

        {step === "price" ? (
          <div className="space-y-4">
            <Field label="Starting price (₹)" id="service-price">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="8,000"
                className={inputClass}
              />
            </Field>
            <Field label="Delivery time" id="service-delivery">
              <SheetSelect
                title="Delivery time"
                value={turnaround}
                options={deliveryOptions}
                onChange={setTurnaround}
                placeholder="How long it takes"
              />
            </Field>
            <Field label="Where you work" id="service-mode">
              <SheetSelect
                title="Where you work"
                value={mode}
                options={modeOptions}
                onChange={setMode}
                placeholder="In person, remote…"
              />
            </Field>
            <Field label="Preview" id="service-preview">
              <ServiceCard
                s={{
                  id: "preview",
                  name: title.trim() || "Untitled service",
                  description: description.trim(),
                  from: previewPrice ?? undefined,
                  turnaround: turnaround ?? undefined,
                  mode: modeText,
                }}
                onEnquire={() => undefined}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="px-5 py-6">
        <ListingStepFooter
          step={idx}
          last={step === "price"}
          onCancel={() => void navigate({ to: source ? `/services/${source.id}` : "/services" })}
          onBack={() => void go(steps[idx - 1]!)}
          onNext={() => (step === "price" ? void submit("active") : void go(steps[idx + 1]!))}
          onSaveDraft={() => void submit("draft")}
          disabled={!ready}
          busy={busy !== null}
          publishLabel={source ? "Save changes" : "Publish"}
        />
      </div>

      <Dialog
        open={published}
        title="Service published"
        body="It is live on your profile and bookable straight away. You can pause it any time."
        onClose={() => setPublished(false)}
      >
        <BtnLink to="/services" className="w-full">
          Back to Services
        </BtnLink>
      </Dialog>
    </Screen>
  );
}

/** A studio with no amenities or equipment yet: add them first, then pick them here. */
function StudioSetupNote({ what }: { what: "amenities" | "equipment" }) {
  return (
    <div className="rounded-lg bg-card p-4">
      <p className="text-1 text-foreground">
        No {what} on your studio yet. Add them with photos, then pick them here.
      </p>
      <BtnLink
        to="/business/availability"
        hash={what === "amenities" ? "facilities" : "equipment"}
        variant="outline"
        className="mt-3 w-full"
      >
        Add {what === "amenities" ? "Amenities" : "Equipment"}
      </BtnLink>
    </div>
  );
}
