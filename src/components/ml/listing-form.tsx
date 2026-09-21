import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Chip } from "./ui";
import { Price, SegmentedField } from "./kit";
import { ConditionBadge } from "./market";
import { kindOfSubCategory, listingSubCategories } from "@/lib/listing-category";

/*
 * The details step and the preview shared by selling and renting out. Both list the same thing —
 * an instrument or a piece of equipment, new or used — so the fields are the same; only the price
 * reads differently: one amount for a sale, an amount per day, week or month for a rental.
 */

export const listingConditions = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like_new" },
  { label: "Used", value: "used" },
] as const;

export const rateUnits = [
  { label: "Per day", value: "day" },
  { label: "Per week", value: "week" },
  { label: "Per month", value: "month" },
] as const;

const fulfilmentOptions = ["Pickup", "Delivery"] as const;

export type ListingDraft = {
  name: string;
  brand: string;
  model: string;
  sub: string | null;
  condition: (typeof listingConditions)[number]["value"];
  description: string;
  price: string;
  unit: (typeof rateUnits)[number]["value"];
  fulfilment: string[];
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
  fulfilment: ["Pickup"],
};

const rupees = (v: string) => Number(v.replace(/[^0-9]/g, ""));

/** The createListing fields every listing carries, sale or rental. */
export function listingPayload(d: ListingDraft, rental: boolean) {
  return {
    title: d.name.trim() || "Untitled listing",
    ...(d.sub ? { itemCategoryKind: kindOfSubCategory(d.sub), itemCategory: d.sub } : {}),
    ...(d.brand.trim() ? { brand: d.brand.trim() } : {}),
    ...(d.model.trim() ? { model: d.model.trim() } : {}),
    ...(d.description.trim() ? { description: d.description.trim() } : {}),
    condition: d.condition,
    pricePaise: rupees(d.price) * 100,
    ...(rental ? { priceUnit: d.unit } : {}),
    pickupAvailable: d.fulfilment.includes("Pickup"),
    deliveryAvailable: d.fulfilment.includes("Delivery"),
  };
}

const inputClass =
  "h-13 w-full rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-primary";

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id}>
      <span id={id} className="mb-1.5 block text-1 font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * Type to search the product types (Guitar, Drums, Mixers…) and pick one, so every listing maps
 * onto a known type rather than free text.
 */
function ProductTypeInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (sub: string | null) => void;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = (
    q ? listingSubCategories.filter((s) => s.toLowerCase().includes(q)) : listingSubCategories
  ).slice(0, 6);

  return (
    <div className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="listing-type-options"
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Guitar, drums, mixer…"
        className={`${inputClass} pl-12`}
      />
      {open && !value && matches.length > 0 ? (
        <ul
          id="listing-type-options"
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {matches.map((m) => (
            <li key={m} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(m);
                  setQuery(m);
                  setOpen(false);
                }}
                className="state-layer block w-full px-5 py-3 text-left text-sm"
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && !value && q && matches.length === 0 ? (
        <p className="mt-1.5 px-1 text-1 text-muted-foreground">
          No type matches — try a broader word.
        </p>
      ) : null}
    </div>
  );
}

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
        <ProductTypeInput value={value.sub} onChange={(sub) => onChange({ sub })} />
      </Field>
      <Field label="Condition" id="listing-condition">
        <div className="flex flex-wrap gap-2">
          {listingConditions.map((c) => (
            <Chip
              key={c.value}
              active={value.condition === c.value}
              onClick={() => onChange({ condition: c.value })}
            >
              {c.label}
            </Chip>
          ))}
        </div>
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
        {rental ? (
          <div className="mb-2">
            <SegmentedField
              label="Rate"
              value={rateUnits.find((u) => u.value === value.unit)!.label}
              options={rateUnits.map((u) => u.label)}
              onChange={(l) => onChange({ unit: rateUnits.find((u) => u.label === l)!.value })}
            />
          </div>
        ) : null}
        <input
          value={value.price}
          onChange={(e) => onChange({ price: e.target.value })}
          inputMode="numeric"
          placeholder={rental ? "1,500" : "1,84,000"}
          className={inputClass}
        />
      </Field>
      <Field label="Fulfilment" id="listing-fulfilment">
        <div className="flex flex-wrap gap-2">
          {fulfilmentOptions.map((f) => (
            <Chip
              key={f}
              active={value.fulfilment.includes(f)}
              onClick={() =>
                onChange({
                  fulfilment: value.fulfilment.includes(f)
                    ? value.fulfilment.filter((x) => x !== f)
                    : [...value.fulfilment, f],
                })
              }
            >
              {f}
            </Chip>
          ))}
        </div>
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
      <div className="flex h-44 items-center justify-center bg-background text-1 text-muted-foreground">
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
        <p className="text-1 text-muted-foreground">
          {[value.brand, value.model, value.sub].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <ConditionBadge
            value={listingConditions.find((c) => c.value === value.condition)!.label}
          />
        </div>
        <p className="mt-2 text-1 text-muted-foreground">
          {[value.fulfilment.join(" or ") || null, extra ?? null].filter(Boolean).join(" · ")}
        </p>
      </div>
    </article>
  );
}
