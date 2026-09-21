import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import type { ProfileRow } from "@/lib/profile-map";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  History,
  MapPin,
  Search,
  Truck,
  ArrowLeftRight,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Sheet } from "./ui";
import { Price } from "./kit";
import { ConditionBadge, MarketCategoryIcon } from "./market";
import {
  categoryOfSubCategory,
  subCategorySlug,
  kindOfSubCategory,
  listingSubCategories,
} from "@/lib/listing-category";
import { instrumentIcon } from "@/lib/instrument-icons";
import { iconSize } from "@/lib/tokens";
import { placeLine } from "@/lib/place";
import { pinProblem } from "@/lib/validation";

/*
 * The details step and the preview shared by selling and renting out. Both list the same thing —
 * an instrument or a piece of equipment, new or used — so the fields are the same; only the price
 * reads differently: one amount for a sale, an amount per day, week or month for a rental.
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

export type ListingDraft = {
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
};

export const emptyListingDraft: ListingDraft = {
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
};

/**
 * The draft both flows edit. City and PIN code start from the seller's profile (the shared
 * ["profile","me"] query) and stay editable; they're filled once, and never over what was typed.
 */
export function useListingDraft() {
  const [draft, setDraft] = useState<ListingDraft>(emptyListingDraft);
  const { signedIn } = useAuth();
  const load = useServerFn(getMyProfile);
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const row = profile.data as ProfileRow | null | undefined;
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

/** Every details field is required (owner, 21 Sep 2026); Continue waits until they're all in. */
export function listingDetailsComplete(d: ListingDraft) {
  return Boolean(
    d.name.trim() &&
    d.brand.trim() &&
    d.model.trim() &&
    d.sub &&
    d.description.trim() &&
    rupees(d.price) > 0 &&
    d.city.trim() &&
    d.pin.trim() &&
    !pinProblem(d.pin),
  );
}

/** A short video is a link (YouTube, Instagram, Drive…): any https URL. */
export function videoProblem(value: string) {
  const v = value.trim();
  if (!v) return null;
  return /^https:\/\/\S+\.\S+/.test(v) ? null : "Paste a full link, starting with https://";
}

/**
 * Photos and a short video: the second step of both flows. The video is optional and a link.
 */
export function ListingMediaStep({
  value,
  onChange,
}: {
  value: ListingDraft;
  onChange: (patch: Partial<ListingDraft>) => void;
}) {
  const problem = videoProblem(value.videoUrl);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 row-span-2 flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-card text-center text-1 text-foreground">
          Cover photo
          <br />
          Tap to add
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-card text-2 text-foreground"
          >
            +
          </div>
        ))}
      </div>
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
    </div>
  );
}

const rupees = (v: string) => Number(v.replace(/[^0-9]/g, ""));

/** The createListing fields every listing carries, sale or rental. */
export function listingPayload(d: ListingDraft, rental: boolean) {
  return {
    title: d.name.trim() || "Untitled listing",
    ...(d.sub
      ? { itemCategoryKind: kindOfSubCategory(d.sub), itemCategory: subCategorySlug(d.sub) }
      : {}),
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
  };
}

const inputClass =
  "h-13 w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary";

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id}>
      <span id={id} className="mb-1.5 block text-1 font-medium text-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * A field that looks like an input and opens a bottom drawer of options; picking one closes it.
 * `searchable` adds a search box at the top of the drawer for long lists (product types).
 */
function SheetSelect({
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
  options: readonly { value: string; label: string; icon?: LucideIcon; iconNode?: ReactNode }[];
  onChange: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const current = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`flex h-13 w-full items-center justify-between gap-2 rounded-full border border-border bg-card px-5 text-left text-sm ${className}`}
      >
        <span className="truncate text-foreground">{current?.label ?? placeholder}</span>
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
        {searchable ? (
          <div className="relative mb-3">
            <Search
              size={18}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={`Search ${title.toLowerCase()}`}
              className={`${inputClass} pl-12`}
            />
          </div>
        ) : null}
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto" role="listbox" aria-label={title}>
          {shown.map((o) => {
            const on = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`state-layer flex w-full items-center gap-3 rounded-lg border-2 bg-subtle px-4 py-3 text-left ${on ? "border-foreground" : "border-transparent"}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-icon-chip">
                    {o.iconNode ??
                      (o.icon ? (
                        <o.icon size={iconSize.md} strokeWidth={1.75} aria-hidden />
                      ) : null)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{o.label}</span>
                  {on ? <Check size={iconSize.md} className="shrink-0" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
        {shown.length === 0 ? (
          <p className="px-4 py-3 text-1 text-foreground">No type matches — try a broader word.</p>
        ) : null}
      </Sheet>
    </>
  );
}

const productTypeOptions = listingSubCategories.map((s) => {
  const category = categoryOfSubCategory(s);
  return {
    value: s,
    label: s,
    ...(category === "instruments"
      ? { icon: instrumentIcon(s.toLowerCase().replace(/\s+/g, "_")) }
      : { iconNode: <MarketCategoryIcon slug={category} size={iconSize.md} /> }),
  };
});

export function ListingDetailsForm({
  value,
  onChange,
  rental,
}: {
  value: ListingDraft;
  onChange: (patch: Partial<ListingDraft>) => void;
  rental: boolean;
}) {
  return (
    <div className="space-y-4">
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
      <Field label="Product type" id="listing-type">
        <SheetSelect
          title="Product type"
          value={value.sub}
          options={productTypeOptions}
          onChange={(sub) => onChange({ sub })}
          placeholder="Guitar, drums, mixer…"
          searchable
        />
      </Field>
      <Field label="Condition" id="listing-condition">
        <SheetSelect
          title="Condition"
          value={value.condition}
          options={listingConditions}
          onChange={(v) => onChange({ condition: v as ListingDraft["condition"] })}
          placeholder="Condition"
        />
      </Field>
      <Field label="Description" id="listing-description">
        <textarea
          rows={4}
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Condition, history, what's included..."
          className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
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
              aria-invalid={Boolean(pinProblem(value.pin))}
              className={inputClass}
            />
          </Field>
        </div>
      </div>
      {pinProblem(value.pin) ? (
        <p className="-mt-2 px-1 text-1 text-destructive">{pinProblem(value.pin)}</p>
      ) : null}
      <Field label="Fulfilment" id="listing-fulfilment">
        <SheetSelect
          title="Fulfilment"
          value={value.fulfilment}
          options={fulfilmentOptions}
          onChange={(v) => onChange({ fulfilment: v as ListingDraft["fulfilment"] })}
          placeholder="Pickup"
        />
      </Field>
    </div>
  );
}

/** What buyers or renters will see, from the draft. `extra` adds a rental's terms line. */
export function ListingPreview({
  value,
  rental,
  extra,
}: {
  value: ListingDraft;
  rental: boolean;
  extra?: string;
}) {
  return (
    <article className="overflow-hidden rounded-lg bg-subtle">
      <div className="flex h-44 items-center justify-center bg-background text-1 text-foreground">
        Cover photo
      </div>
      <div className="p-4">
        <Price
          price={{
            amount: value.price ? `₹${value.price}` : "₹0",
            ...(rental ? { unit: value.unit } : {}),
          }}
          amountClassName="text-sm font-bold"
          unitClassName="text-1"
        />
        <h3 className="mt-1 text-sm leading-snug">{value.name || "Untitled listing"}</h3>
        <p className="text-1 text-foreground">
          {[value.brand, value.model, value.sub].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <ConditionBadge
            value={listingConditions.find((c) => c.value === value.condition)!.label}
          />
        </div>
        <p className="mt-2 text-1 text-foreground">
          {[fulfilmentOptions.find((f) => f.value === value.fulfilment)!.label, extra ?? null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </article>
  );
}
