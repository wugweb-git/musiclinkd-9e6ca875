import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Btn, IconBtn, Screen, Sheet, TopBar } from "@/components/ml/ui";
import {
  BusinessOnlyGate,
  EmptyState,
  LoadError,
  Loading,
  SegmentedField,
} from "@/components/ml/kit";
import { Field, SheetSelect, inputClass } from "@/components/ml/listing-form";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { StickyBar } from "@/components/ml/booking";
import { unitLabel } from "@/lib/price";
import { iconSize } from "@/lib/tokens";
import {
  getMyStudio,
  updateMyStudio,
  updateMyStudioAddOns,
  updateStudioRoomRate,
  updateStudioRoomTiers,
  type RoomTierRow,
  type StudioAddOnRow,
} from "@/lib/studio-owner.functions";

export const Route = createFileRoute("/business/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — MusicLinkd provider" },
      {
        name: "description",
        content:
          "Set hourly, half-day, full-day and session rates for each room and add-on prices.",
      },
      { property: "og:title", content: "Pricing — MusicLinkd provider" },
      { property: "og:description", content: "Rates and add-ons for your space." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <PricingContent />
    </BusinessOnlyGate>
  );
}

function rupees(paise: number | null | undefined) {
  return paise == null ? "" : String(Math.round(paise / 100));
}

/** Typed rupees as paise; empty is no price. */
const paise = (v: string) => (v.trim() ? Math.round(Number(v) * 100) : null);

/** A package tier as it is edited: the stored row plus the typed amount. */
type TierDraft = { row: RoomTierRow; price: string };
/** An add-on as it is edited: the stored row plus the typed amount. */
type AddOnDraft = { row: StudioAddOnRow; price: string };

const TIER_KINDS = [
  { value: "halfDay", label: "Half day" },
  { value: "fullDay", label: "Full day" },
  { value: "session", label: "Session" },
] as const;
type TierKind = (typeof TIER_KINDS)[number]["value"];

const isHourTier = (t: RoomTierRow) => t.unit === "hour";

function PricingContent() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyStudio);
  const saveStudio = useServerFn(updateMyStudio);
  const saveRoom = useServerFn(updateStudioRoomRate);
  const saveTiers = useServerFn(updateStudioRoomTiers);
  const saveAddOns = useServerFn(updateMyStudioAddOns);
  const q = useQuery({ queryKey: ["business", "studio", "mine"], queryFn: () => load() });

  const [baseRate, setBaseRate] = useState("");
  const [roomRates, setRoomRates] = useState<Record<string, string>>({});
  const [tiers, setTiers] = useState<Record<string, TierDraft[]>>({});
  const [addOns, setAddOns] = useState<AddOnDraft[]>([]);
  const [saving, setSaving] = useState(false);
  // The room a new tier is being added to, and whether the new add-on sheet is open.
  const [tierRoom, setTierRoom] = useState<string | null>(null);
  const [addingAddOn, setAddingAddOn] = useState(false);
  useEffect(() => {
    if (!q.data) return;
    setBaseRate(rupees(q.data.hourly_rate_paise));
    setRoomRates(Object.fromEntries(q.data.rooms.map((r) => [r.id, rupees(r.hourly_rate_paise)])));
    setTiers(
      Object.fromEntries(
        q.data.rooms.map((r) => [
          r.id,
          r.tiers.map((row) => ({ row, price: rupees(row.price_paise) })),
        ]),
      ),
    );
    setAddOns(q.data.add_ons.map((row) => ({ row, price: rupees(row.price_paise) })));
  }, [q.data]);

  async function save() {
    if (!q.data) return;
    setSaving(true);
    try {
      await saveStudio({ data: { hourly_rate_paise: paise(baseRate) } });
      await Promise.all(
        q.data.rooms.map(async (r) => {
          const v = roomRates[r.id];
          const rate = v === undefined ? r.hourly_rate_paise : (paise(v) ?? 0);
          if (v !== undefined && v !== rupees(r.hourly_rate_paise)) {
            await saveRoom({ data: { roomId: r.id, hourly_rate_paise: rate ?? 0 } });
          }
          // A stored "Hourly" tier follows the room's hourly rate, so the two never disagree.
          const next = (tiers[r.id] ?? []).map(({ row, price }) =>
            isHourTier(row) ? { ...row, price_paise: rate } : { ...row, price_paise: paise(price) },
          );
          if (JSON.stringify(next) !== JSON.stringify(r.tiers)) {
            await saveTiers({ data: { roomId: r.id, tiers: next } });
          }
        }),
      );
      const nextAddOns = addOns.map(({ row, price }) => ({ ...row, price_paise: paise(price) }));
      if (JSON.stringify(nextAddOns) !== JSON.stringify(q.data.add_ons)) {
        await saveAddOns({ data: { addOns: nextAddOns } });
      }
      await queryClient.invalidateQueries({ queryKey: ["business", "studio", "mine"] });
      toast.success("Pricing saved");
    } catch {
      toast.error("Couldn't save that — try again");
    } finally {
      setSaving(false);
    }
  }

  if (q.isLoading) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Pricing" back="/business/bookings" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }
  if (q.isError) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Pricing" back="/business/bookings" />
        <div className="px-5 pt-8">
          <LoadError what="your pricing" />
        </div>
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Pricing" back="/business/bookings" />
        <div className="px-5 pt-4">
          <EmptyState title="No studio yet" body="Set up your studio profile first." />
        </div>
      </Screen>
    );
  }

  const rooms = q.data.rooms;

  return (
    <Screen bottomNav={false}>
      <TopBar title="Pricing" subtitle={q.data.name} back="/business/bookings" />

      <main className="space-y-6 px-5 pb-40 pt-4">
        <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
          Rates shown here are what customers see on the booking screens. Changes apply to new
          bookings only.
        </p>

        <MoneyRow
          label="Base hourly rate"
          hint="Whole studio"
          value={baseRate}
          onChange={setBaseRate}
        />

        {rooms.length ? (
          <section className="min-w-0">
            <h2 className="text-2">Rooms</h2>
            <div className="mt-3 space-y-2">
              {rooms.map((r) => (
                <MoneyRow
                  key={r.id}
                  id={`rate-room-${r.id}`}
                  label={r.name}
                  hint="per hour"
                  value={roomRates[r.id] ?? ""}
                  onChange={(v) => setRoomRates((s) => ({ ...s, [r.id]: v }))}
                />
              ))}
            </div>
          </section>
        ) : null}

        {rooms.length ? (
          <section className="min-w-0">
            <h2 className="text-2">Price tiers</h2>
            <p className="mt-0.5 text-1 text-muted-foreground">
              Half-day, full-day and session rates beside each room's hourly rate.
            </p>
            {rooms.map((r) => {
              const shown = (tiers[r.id] ?? [])
                .map((t, i) => ({ t, i }))
                .filter(({ t }) => !isHourTier(t.row));
              return (
                <div key={r.id} className="mt-4 min-w-0">
                  <h3 className="truncate text-sm font-semibold">{r.name}</h3>
                  <div className="mt-2 space-y-2">
                    {shown.map(({ t, i }) => (
                      <div key={`${r.id}-${i}`} className="flex min-w-0 items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <MoneyRow
                            id={`tier-${r.id}-${i}`}
                            label={t.row.label}
                            hint={t.row.hours ? `${t.row.hours} hours` : ""}
                            value={t.price}
                            onChange={(v) =>
                              setTiers((s) => ({
                                ...s,
                                [r.id]: (s[r.id] ?? []).map((x, j) =>
                                  j === i ? { ...x, price: v } : x,
                                ),
                              }))
                            }
                          />
                        </div>
                        <IconBtn
                          label={`Remove ${t.row.label}`}
                          variant="ghost"
                          onClick={() =>
                            setTiers((s) => ({
                              ...s,
                              [r.id]: (s[r.id] ?? []).filter((_, j) => j !== i),
                            }))
                          }
                        >
                          <Trash2 size={iconSize.sm} aria-hidden />
                        </IconBtn>
                      </div>
                    ))}
                    <Btn variant="outline" className="w-full" onClick={() => setTierRoom(r.id)}>
                      Add Price Tier
                    </Btn>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        <section className="min-w-0">
          <h2 className="text-2">Add-ons</h2>
          <p className="mt-0.5 text-1 text-muted-foreground">
            Optional extras customers can add to a session.
          </p>
          <div className="mt-3 space-y-2">
            {addOns.map((a, i) => (
              <div key={`addon-${i}`} className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <MoneyRow
                    id={`addon-${i}`}
                    label={a.row.name}
                    hint={unitLabel(a.row.unit) || "per session"}
                    value={a.price}
                    onChange={(v) =>
                      setAddOns((s) => s.map((x, j) => (j === i ? { ...x, price: v } : x)))
                    }
                  />
                </div>
                <IconBtn
                  label={`Remove ${a.row.name}`}
                  variant="ghost"
                  onClick={() => setAddOns((s) => s.filter((_, j) => j !== i))}
                >
                  <Trash2 size={iconSize.sm} aria-hidden />
                </IconBtn>
              </div>
            ))}
            <Btn variant="outline" className="w-full" onClick={() => setAddingAddOn(true)}>
              Add an Add-on
            </Btn>
          </div>
        </section>
      </main>

      <StickyBar
        primaryLabel="Save pricing"
        hint="Applies to new requests only"
        disabled={saving}
        onPrimary={() => void save()}
      />

      <NewTierSheet
        open={tierRoom !== null}
        onClose={() => setTierRoom(null)}
        onAdd={(row) => {
          if (!tierRoom) return;
          setTiers((s) => ({
            ...s,
            [tierRoom]: [...(s[tierRoom] ?? []), { row, price: rupees(row.price_paise) }],
          }));
          setTierRoom(null);
        }}
      />
      <NewAddOnSheet
        open={addingAddOn}
        onClose={() => setAddingAddOn(false)}
        onAdd={(row) => {
          setAddOns((s) => [...s, { row, price: rupees(row.price_paise) }]);
          setAddingAddOn(false);
        }}
      />
    </Screen>
  );
}

/** A new package rate for one room: half day, full day, or a named session. */
function NewTierSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (row: RoomTierRow) => void;
}) {
  const [kind, setKind] = useState<TierKind>("halfDay");
  const [name, setName] = useState("");
  const [hours, setHours] = useState("4");
  const [price, setPrice] = useState("");
  const kindLabel = TIER_KINDS.find((k) => k.value === kind)?.label ?? "";
  const h = Number(hours);
  const ready =
    Number.isInteger(h) &&
    h >= 1 &&
    h <= 24 &&
    !!price.trim() &&
    (kind !== "session" || !!name.trim());

  function reset() {
    setKind("halfDay");
    setName("");
    setHours("4");
    setPrice("");
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add price tier"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          onAdd({
            // The booking page reads a package's kind from its label ("Half day", "Full day").
            label: kind === "session" ? name.trim() : `${kindLabel} · ${h} hrs`,
            hours: h,
            price_paise: paise(price),
            unit: kind,
          });
          reset();
        }}
      >
        <Field label="Kind" id="tier-kind">
          <SheetSelect
            title="Kind"
            value={kind}
            options={TIER_KINDS}
            onChange={(v) => {
              setKind(v as TierKind);
              if (v === "halfDay") setHours("4");
              if (v === "fullDay") setHours("8");
            }}
            placeholder="Pick a kind"
          />
        </Field>
        {kind === "session" ? (
          <Field label="Name" id="tier-name">
            <input
              aria-labelledby="tier-name"
              value={name}
              maxLength={60}
              placeholder="e.g. Episode package"
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
        ) : null}
        <Field label="Hours" id="tier-hours">
          <input
            aria-labelledby="tier-hours"
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Price (₹)" id="tier-price">
          <input
            aria-labelledby="tier-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Btn type="submit" className="w-full" disabled={!ready}>
          Add Tier
        </Btn>
      </form>
    </Sheet>
  );
}

const CHARGED = ["Per session", "Per hour"] as const;

/** A new add-on: its name, price, and whether it is charged per hour or once per session. */
function NewAddOnSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (row: StudioAddOnRow) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [charged, setCharged] = useState<(typeof CHARGED)[number]>("Per session");
  const ready = !!name.trim() && !!price.trim();

  function reset() {
    setName("");
    setPrice("");
    setCharged("Per session");
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add an add-on"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          onAdd({
            name: name.trim(),
            description: "",
            price_paise: paise(price),
            // A per-session add-on has no unit, the way the stored ones do.
            unit: charged === "Per hour" ? "hour" : null,
            available: true,
            quantity: false,
          });
          reset();
        }}
      >
        <Field label="Name" id="addon-name">
          <input
            aria-labelledby="addon-name"
            value={name}
            maxLength={120}
            placeholder="e.g. Additional engineer"
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Price (₹)" id="addon-price">
          <input
            aria-labelledby="addon-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Charged" id="addon-charged">
          <SegmentedField label="Charged" value={charged} options={CHARGED} onChange={setCharged} />
        </Field>
        <Btn type="submit" className="w-full" disabled={!ready}>
          Add Add-on
        </Btn>
      </form>
    </Sheet>
  );
}

function MoneyRow({
  id: givenId,
  label,
  hint,
  value,
  onChange,
}: {
  /** Needed where two rows can share a label (tiers of different rooms). */
  id?: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = givenId ?? `rate-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg bg-subtle p-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block truncate text-1 font-semibold">
          {label}
        </label>
        {hint ? <p className="truncate text-1 text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-background px-3 py-2">
        <span className="text-1 font-semibold text-muted-foreground">₹</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-transparent text-right text-1 font-bold outline-none"
        />
      </div>
    </div>
  );
}
