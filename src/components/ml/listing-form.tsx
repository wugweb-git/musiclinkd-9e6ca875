import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import type { ProfileRow } from "@/lib/profile-map";
import type { MyListing } from "@/lib/catalog.functions";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Camera,
  Check,
  LoaderCircle,
  Plus,
  X,
  ChevronDown,
  History,
  MapPin,
  Search,
  Truck,
  ArrowLeftRight,
  CalendarClock,
  CircleAlert,
  Tag,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Btn, IconBtn, Sheet } from "./ui";
import {
  DrawerList,
  DrawerOptionRow,
  DrawerSearch,
  matching,
  type DrawerOption,
} from "./drawer-list";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-images";
import { MAX_LISTING_PHOTOS, uploadListingPhoto } from "@/lib/listing-photos";
import { SegmentedField } from "./kit";
import { MarketCategoryIcon, ProductCard } from "./market";
import {
  gearCategoryOf,
  gearTypeOf,
  useGearTaxonomy,
  type GearTaxonomy,
} from "@/lib/listing-category";
import { instrumentIcon } from "@/lib/instrument-icons";
import { iconSize } from "@/lib/tokens";
import { parsePlace, placeLine } from "@/lib/place";
import { pinProblem } from "@/lib/validation";

/*
 * The one listing flow (/marketplace/sell): sell or rent out an instrument or a piece of
 * equipment. Both carry the same fields; renting out only gives the price a unit (per day, week
 * or month). Three steps — what & price, photos & description, where & publish — and the preview
 * is the Market product card itself.
 */

export const listingConditions = [
  { label: "New", value: "new", icon: Sparkles },
  { label: "Like New", value: "like_new", icon: Star },
  { label: "Used", value: "used", icon: History },
] as const;

export const rateUnits = [
  { label: "Per day", value: "day", icon: CalendarDays },
  { label: "Per week", value: "week", icon: CalendarRange },
  { label: "Per month", value: "month", icon: Calendar },
] as const;

export const fulfilmentOptions = [
  { label: "Pickup", value: "pickup", icon: MapPin },
  { label: "Delivery", value: "delivery", icon: Truck },
  { label: "Pickup or delivery", value: "both", icon: ArrowLeftRight },
] as const;

export const listingModes = ["Sell", "Rent out"] as const;
export type ListingMode = (typeof listingModes)[number];

export type ListingDraft = {
  mode: ListingMode;
  name: string;
  brand: string;
  model: string;
  sub: string | null;
  condition: (typeof listingConditions)[number]["value"];
  description: string;
  price: string;
  unit: (typeof rateUnits)[number]["value"];
  fulfilment: (typeof fulfilmentOptions)[number]["value"];
  city: string;
  pin: string;
  videoUrl: string;
  /** Uploaded photo URLs, in order; the first is the cover. */
  photos: string[];
  /** What comes with it ("Flight case", "Cables"). Optional. */
  included: string[];
  /** Extra specifications as label and value ("Weight", "18.5 kg"). Optional. */
  specs: { label: string; value: string }[];
};

export const emptyListingDraft: ListingDraft = {
  mode: "Sell",
  name: "",
  brand: "",
  model: "",
  sub: null,
  condition: "used",
  description: "",
  price: "",
  unit: "day",
  fulfilment: "pickup",
  city: "",
  pin: "",
  videoUrl: "",
  photos: [],
  included: [],
  specs: [],
};

export const listingSteps = ["What & price", "Photos & description", "Where & publish"] as const;

/*
 * A saved draft lives on this device (the listings table has no draft status, and the schema
 * stays as it is). Guarded: a private window or blocked storage just means no draft.
 */
const DRAFT_KEY = "ml.listing-draft";

export function readListingDraft(): Partial<ListingDraft> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<ListingDraft>) : null;
  } catch {
    return null;
  }
}

export function saveListingDraft(d: ListingDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function clearListingDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * The draft the flow edits. It opens on a saved draft if there is one, in the mode the link asked
 * for; City and PIN code start from the seller's profile (the shared ["profile","me"] query), are
 * filled once, and never over what was typed.
 */
export function useListingDraft(mode: ListingMode, editing = false) {
  const [draft, setDraft] = useState<ListingDraft>({ ...emptyListingDraft, mode });
  const { signedIn } = useAuth();
  const load = useServerFn(getMyProfile);
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const row = profile.data as ProfileRow | null | undefined;
  // Storage is read after mount, so the server render and the first client render agree.
  useEffect(() => {
    if (editing) return;
    const saved = readListingDraft();
    if (saved) setDraft((d) => ({ ...d, ...saved }));
  }, [editing]);
  useEffect(() => {
    if (!row) return;
    setDraft((d) => ({
      ...d,
      city: d.city || row.city || "",
      pin: d.pin || row.pin_code || "",
    }));
  }, [row]);
  const patch = (p: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...p }));
  return [draft, patch] as const;
}

/** A saved listing read back into the draft, for editing. */
export function draftFromListing(row: MyListing): ListingDraft {
  const place = parsePlace(row.pickup_location);
  const unit = rateUnits.find((u) => u.value === row.price_unit)?.value ?? "day";
  return {
    mode: row.category === "gear_rental" ? "Rent out" : "Sell",
    name: row.title,
    brand: row.brand ?? "",
    model: row.model ?? "",
    sub: row.item_category,
    condition: row.condition ?? "used",
    description: row.listing_description ?? "",
    price: row.price_paise != null ? String(Math.round(row.price_paise / 100)) : "",
    unit,
    fulfilment:
      row.pickup_available && row.delivery_available
        ? "both"
        : row.delivery_available
          ? "delivery"
          : "pickup",
    city: place.city,
    pin: place.pin,
    videoUrl: row.video_url ?? "",
    photos: row.photos?.length ? row.photos : row.image_url ? [row.image_url] : [],
    included: row.included ?? [],
    specs: row.specs ?? [],
  };
}

const rupees = (v: string) => Number(v.replace(/[^0-9]/g, ""));

/** Every field is required (owner, 21 Sep 2026) except the video; each step waits for its own. */
export function listingStepComplete(d: ListingDraft, step: number) {
  if (step === 0)
    return Boolean(
      d.sub && d.name.trim() && d.brand.trim() && d.model.trim() && rupees(d.price) > 0,
    );
  if (step === 1) return Boolean(d.description.trim()) && !videoProblem(d.videoUrl);
  return Boolean(d.city.trim() && d.pin.trim() && !pinProblem(d.pin));
}

/** A short video is a link (YouTube, Instagram, Drive…): any https URL. */
export function videoProblem(value: string) {
  const v = value.trim();
  if (!v) return null;
  return /^https:\/\/\S+\.\S+/.test(v) ? null : "Paste a full link, starting with https://";
}

/** What createListing gets from the draft. */
export function listingPayload(d: ListingDraft, taxonomy: GearTaxonomy) {
  const type = gearTypeOf(d.sub, taxonomy);
  const rental = d.mode === "Rent out";
  return {
    category: rental ? ("gear_rental" as const) : ("gear_sale" as const),
    title: d.name.trim() || "Untitled listing",
    ...(type ? { itemCategoryKind: type.kind, itemCategory: type.slug } : {}),
    ...(d.brand.trim() ? { brand: d.brand.trim() } : {}),
    ...(d.model.trim() ? { model: d.model.trim() } : {}),
    ...(d.description.trim() ? { description: d.description.trim() } : {}),
    condition: d.condition,
    pricePaise: rupees(d.price) * 100,
    ...(rental ? { priceUnit: d.unit } : {}),
    pickupAvailable: d.fulfilment !== "delivery",
    deliveryAvailable: d.fulfilment !== "pickup",
    ...(d.city.trim() || d.pin.trim()
      ? { pickupLocation: placeLine(d.city, pinProblem(d.pin) ? "" : d.pin) }
      : {}),
    ...(d.videoUrl.trim() && !videoProblem(d.videoUrl) ? { videoUrl: d.videoUrl.trim() } : {}),
    ...(d.photos.length ? { photos: d.photos } : {}),
    included: d.included.map((x) => x.trim()).filter(Boolean),
    specs: d.specs
      .map((sp) => ({ label: sp.label.trim(), value: sp.value.trim() }))
      .filter((sp) => sp.label && sp.value),
  };
}

export const inputClass =
  "h-13 w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary";

/** A form field: a plain label over its control (not a pill). Shared by every create flow. */
export function Field({
  label,
  id,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  /** One line under the label that says what the field is for. */
  hint?: string;
  /** What is wrong and how to fix it, under the control; nothing when the field is fine. */
  error?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id}>
      <span id={id} className="block text-1 font-medium text-foreground">
        {label}
      </span>
      {hint ? <span className="mt-0.5 block text-1 text-muted-foreground">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p
          role="alert"
          className="mt-1.5 flex animate-message items-start gap-1.5 text-1 text-destructive"
        >
          <CircleAlert size={iconSize.sm} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** One row in a SheetSelect or SheetMultiSelect drawer. */
export type { DrawerOption } from "./drawer-list";

/** Lists longer than this get a search box at the top of the drawer. */
const SEARCH_FROM = 8;

/**
 * Like SheetSelect, for picking several (up to `max`): rows toggle, Done closes. The field reads
 * the picked labels joined. The drawer is the shared option list (drawer-list.tsx).
 */
export function SheetMultiSelect({
  title,
  value,
  options,
  onChange,
  placeholder,
  max,
}: {
  title: string;
  value: string[];
  options: readonly DrawerOption[];
  onChange: (value: string[]) => void;
  placeholder: string;
  max: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const picked = options.filter((o) => value.includes(o.value));
  const full = value.length >= max;
  const shown = matching(options, query);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full items-center justify-between gap-2 rounded-full border border-border bg-card px-5 py-3 text-left text-sm"
      >
        <span className="min-w-0 truncate text-foreground">
          {picked.length ? picked.map((o) => o.label).join(", ") : placeholder}
        </span>
        <ChevronDown size={18} className="shrink-0 text-foreground" aria-hidden />
      </button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        title={title}
      >
        {options.length > SEARCH_FROM ? (
          <DrawerSearch value={query} onChange={setQuery} label={`Search ${title.toLowerCase()}`} />
        ) : null}
        <p className="mb-3 text-1 text-foreground">
          {value.length} of {max} picked
        </p>
        <DrawerList label={title} multiple empty="Nothing matches — try a broader word.">
          {shown.map((o) => {
            const on = value.includes(o.value);
            return (
              <DrawerOptionRow
                key={o.value}
                option={o}
                selected={on}
                disabled={!on && full}
                onClick={() =>
                  onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])
                }
              />
            );
          })}
        </DrawerList>
        <Btn className="mt-4 w-full" onClick={() => setOpen(false)}>
          Done
        </Btn>
      </Sheet>
    </>
  );
}

/**
 * A field that looks like an input and opens a bottom drawer of options; picking one closes it.
 * Long lists (and any with `searchable`) get a search box. The drawer is the shared option list.
 */
export function SheetSelect({
  title,
  value,
  options,
  onChange,
  placeholder,
  searchable = false,
  className = "",
}: {
  title: string;
  value: string | null;
  options: readonly DrawerOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const shown = matching(options, query);
  const current = options.find((o) => o.value === value);
  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`flex h-13 w-full items-center justify-between gap-2 rounded-full border border-border bg-card px-5 text-left text-sm ${className}`}
      >
        {/*
         * A stored value the options don't contain — a city typed before this was a picker, one
         * Google wrote, or one whose state no longer matches — shows as itself. Falling straight
         * through to the placeholder made the field read "Choose" while it was set, and it still
         * submitted the old value.
         */}
        <span className="truncate text-foreground">
          {current?.label ?? (value || placeholder)}
        </span>
        <ChevronDown size={18} className="shrink-0 text-foreground" aria-hidden />
      </button>
      <Sheet open={open} onClose={close} title={title}>
        {searchable || options.length > SEARCH_FROM ? (
          <DrawerSearch
            value={query}
            onChange={setQuery}
            placeholder={placeholder}
            label={`Search ${title.toLowerCase()}`}
          />
        ) : null}
        <DrawerList label={title} empty="Nothing matches — try a broader word.">
          {shown.map((o) => (
            <DrawerOptionRow
              key={o.value}
              option={o}
              selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                close();
              }}
            />
          ))}
        </DrawerList>
      </Sheet>
    </>
  );
}

/** Product types from the taxonomy, each with its icon. */
function productTypeOptions(taxonomy: GearTaxonomy) {
  return taxonomy.types.map((t) => ({
    value: t.slug,
    label: t.label,
    ...(t.kind === "instrument"
      ? { icon: instrumentIcon(t.slug) }
      : {
          iconNode: (
            <MarketCategoryIcon slug={t.slug} size={iconSize.md} className="text-primary-foreground" />
          ),
        }),
  }));
}

type StepProps = { value: ListingDraft; onChange: (patch: Partial<ListingDraft>) => void };

/** Step 1 — what it is and what it costs. */
export function ListingWhatStep({ value, onChange }: StepProps) {
  const taxonomy = useGearTaxonomy();
  const rental = value.mode === "Rent out";
  return (
    <div className="space-y-4">
      <SegmentedField
        label="Listing for"
        value={value.mode}
        options={listingModes}
        icons={{ Sell: Tag, "Rent out": CalendarClock }}
        onChange={(mode) => onChange({ mode })}
      />
      <Field label="Product type" id="listing-type">
        <SheetSelect
          title="Product type"
          value={value.sub}
          options={productTypeOptions(taxonomy)}
          onChange={(sub) => onChange({ sub })}
          placeholder="Guitar, drums, mixer…"
          searchable
        />
      </Field>
      {(
        [
          { key: "name", label: "Name", ph: "Shure SM7B" },
          { key: "brand", label: "Brand", ph: "Shure" },
          { key: "model", label: "Model", ph: "SM7B" },
        ] as const
      ).map((f) => (
        <Field key={f.key} label={f.label} id={`listing-${f.key}`}>
          <input
            value={value[f.key]}
            onChange={(e) => onChange({ [f.key]: e.target.value })}
            placeholder={f.ph}
            className={inputClass}
          />
        </Field>
      ))}
      <Field label="Condition" id="listing-condition">
        <SheetSelect
          title="Condition"
          value={value.condition}
          options={listingConditions}
          onChange={(v) => onChange({ condition: v as ListingDraft["condition"] })}
          placeholder="Condition"
        />
      </Field>
      <Field label="Price (₹)" id="listing-price">
        <div className={rental ? "grid grid-cols-5 gap-2" : ""}>
          <input
            value={value.price}
            onChange={(e) => onChange({ price: e.target.value })}
            inputMode="numeric"
            placeholder={rental ? "1,500" : "1,84,000"}
            className={`${inputClass} col-span-3`}
          />
          {rental ? (
            <SheetSelect
              title="Rate"
              value={value.unit}
              options={rateUnits}
              onChange={(v) => onChange({ unit: v as ListingDraft["unit"] })}
              placeholder="Per day"
              className="col-span-2"
            />
          ) : null}
        </div>
      </Field>
    </div>
  );
}

/**
 * Five photo slots — the cover large, four small. An empty slot opens the file picker and uploads
 * straight away; a filled one shows the photo with a remove button.
 */
function PhotoSlots({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  async function add(files: FileList | null) {
    const room = MAX_LISTING_PHOTOS - photos.length;
    const picked = Array.from(files ?? []).slice(0, room);
    if (!picked.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of picked) urls.push(await uploadListingPhoto(f));
      onChange([...photos, ...urls]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload that photo");
    } finally {
      setUploading(false);
    }
  }
  // The file stays in storage: an edit can still be cancelled, and the saved listing may use it.
  function remove(url: string) {
    onChange(photos.filter((p) => p !== url));
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: MAX_LISTING_PHOTOS }, (_, i) => {
        const url = photos[i];
        const cover = i === 0;
        const box = `relative flex aspect-square items-center justify-center overflow-hidden rounded-lg ${cover ? "col-span-2 row-span-2" : ""}`;
        if (url)
          return (
            <div key={url} className={box}>
              <img
                src={url}
                alt={cover ? "Cover photo" : `Photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => remove(url)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white"
              >
                <X size={iconSize.sm} aria-hidden />
              </button>
            </div>
          );
        const next = i === photos.length;
        return (
          <label
            key={`slot-${i}`}
            className={`${box} border border-dashed border-border bg-card text-center text-1 text-foreground ${next ? "cursor-pointer" : "opacity-60"}`}
          >
            {next && uploading ? (
              <LoaderCircle size={iconSize.md} className="animate-spin" aria-hidden />
            ) : cover ? (
              <span className="flex flex-col items-center gap-1">
                <Camera size={iconSize.md} aria-hidden />
                Add cover photo
              </span>
            ) : (
              <Plus size={iconSize.md} aria-hidden />
            )}
            {next ? (
              <input
                type="file"
                accept={PROFILE_IMAGE_ACCEPT}
                multiple
                disabled={uploading}
                className="sr-only"
                aria-label={cover ? "Add cover photo" : "Add photo"}
                onChange={(e) => {
                  void add(e.target.files);
                  e.target.value = "";
                }}
              />
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

/** Step 2 — photos, a short video link (optional) and the description. */
export function ListingMediaStep({ value, onChange }: StepProps) {
  const problem = videoProblem(value.videoUrl);
  return (
    <div className="space-y-4">
      <PhotoSlots photos={value.photos} onChange={(photos) => onChange({ photos })} />
      <p className="text-1 text-foreground">First photo becomes the cover.</p>
      <Field label="Short video link (optional)" id="listing-video">
        <input
          value={value.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          inputMode="url"
          placeholder="https://youtu.be/…"
          aria-invalid={Boolean(problem)}
          className={inputClass}
        />
      </Field>
      {problem ? <p className="-mt-2 px-1 text-1 text-destructive">{problem}</p> : null}
      <Field label="Description" id="listing-description">
        <textarea
          rows={4}
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Condition, history, what's included..."
          className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        />
      </Field>
      <TagListField
        label="What's included (optional)"
        id="listing-included"
        placeholder="Flight case"
        value={value.included}
        onChange={(included) => onChange({ included })}
      />
      <SpecsField value={value.specs} onChange={(specs) => onChange({ specs })} />
    </div>
  );
}

/** A list typed one item at a time: type it, tap +; each shows as a tag with a remove button. */
export function TagListField({
  label,
  id,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  id: string;
  placeholder: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v) && value.length < 20) onChange([...value, v]);
    setDraft("");
  };
  return (
    <Field label={label} id={id}>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <IconBtn label="Add item" className="h-13 w-13" onClick={add} disabled={!draft.trim()}>
          <Plus size={iconSize.md} aria-hidden />
        </IconBtn>
      </div>
      {value.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {value.map((x) => (
            <li
              key={x}
              className="inline-flex items-center gap-1.5 rounded-sm bg-card py-1.5 pl-2.5 pr-1.5 text-1 font-medium text-foreground"
            >
              {x}
              <button
                type="button"
                aria-label={`Remove ${x}`}
                onClick={() => onChange(value.filter((y) => y !== x))}
                className="flex h-5 w-5 items-center justify-center"
              >
                <X size={iconSize.xs} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  );
}

/** Specifications: rows of label and value, added one at a time. */
function SpecsField({
  value,
  onChange,
}: {
  value: { label: string; value: string }[];
  onChange: (v: { label: string; value: string }[]) => void;
}) {
  const set = (i: number, patch: Partial<{ label: string; value: string }>) =>
    onChange(value.map((sp, j) => (j === i ? { ...sp, ...patch } : sp)));
  return (
    <Field label="Specifications (optional)" id="listing-specs">
      <div className="space-y-2">
        {value.map((sp, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={sp.label}
              onChange={(e) => set(i, { label: e.target.value })}
              placeholder="Weight"
              aria-label="Specification"
              className={`${inputClass} flex-[2]`}
            />
            <input
              value={sp.value}
              onChange={(e) => set(i, { value: e.target.value })}
              placeholder="18.5 kg"
              aria-label="Value"
              className={`${inputClass} flex-[3]`}
            />
            <IconBtn
              label="Remove specification"
              className="h-13 w-13"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <X size={iconSize.sm} aria-hidden />
            </IconBtn>
          </div>
        ))}
        {value.length < 12 ? (
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => onChange([...value, { label: "", value: "" }])}
          >
            <Plus size={iconSize.sm} aria-hidden />
            Add a specification
          </Btn>
        ) : null}
      </div>
    </Field>
  );
}

/** Step 3 — where it is and how it changes hands, then the card as it will show in Market. */
export function ListingWhereStep({ value, onChange }: StepProps) {
  const pin = pinProblem(value.pin);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-3">
          <Field label="City" id="listing-city">
            <input
              value={value.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Mumbai"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="PIN code" id="listing-pin">
            <input
              value={value.pin}
              onChange={(e) => onChange({ pin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              inputMode="numeric"
              placeholder="400053"
              aria-invalid={Boolean(pin)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>
      {pin ? <p className="-mt-2 px-1 text-1 text-destructive">{pin}</p> : null}
      <Field label="Fulfilment" id="listing-fulfilment">
        <SheetSelect
          title="Fulfilment"
          value={value.fulfilment}
          options={fulfilmentOptions}
          onChange={(v) => onChange({ fulfilment: v as ListingDraft["fulfilment"] })}
          placeholder="Pickup"
        />
      </Field>
      <Field label="Preview" id="listing-preview">
        <div className="flex justify-center">
          <ListingCardPreview value={value} />
        </div>
      </Field>
    </div>
  );
}

/** The draft drawn as the Market product card, at rail width, not linked anywhere. */
export function ListingCardPreview({ value }: { value: ListingDraft }) {
  const taxonomy = useGearTaxonomy();
  const rental = value.mode === "Rent out";
  return (
    <ProductCard
      preview
      rail
      item={{
        opens: "listing",
        id: "preview",
        title: value.name.trim() || "Untitled listing",
        photos: value.photos,
        category: gearCategoryOf(value.sub, taxonomy) ?? "other",
        badge: listingConditions.find((c) => c.value === value.condition)!.label,
        price: {
          amount: `₹${value.price || "0"}`,
          ...(rental ? { unit: value.unit } : {}),
        },
      }}
    />
  );
}
