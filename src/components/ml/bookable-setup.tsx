import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, IconBtn, Sheet, useConfirm } from "@/components/ml/ui";
import { Card, LoadError, Loading, SegmentedField } from "@/components/ml/kit";
import { PhotoSheet } from "@/components/ml/booking";
import { ImagePickButton } from "@/components/ml/profile";
import { ChipPicker, DrawerField } from "@/components/ml/onboarding";
import { SheetSelect, TagListField } from "@/components/ml/listing-form";
import {
  type MyBookableEquipment,
  type BookableEquipment,
  getMyBookableEquipment,
  removeMyBookableEquipment,
  saveMyBookableEquipment,
  updateMyAmenities,
} from "@/lib/bookable-owner.functions";
import {
  MAX_BOOKABLE_PHOTOS,
  type BookablePhotoSubject,
  addMyBookablePhoto,
  listMyBookablePhotos,
  removeMyBookablePhoto,
} from "@/lib/bookable-photos.functions";
import { uploadBookablePhoto } from "@/lib/bookable-photos";
import { useGearTaxonomy } from "@/lib/listing-category";
import { choicesFor, useTaxonomy } from "@/lib/taxonomy";
import { amenityIcon } from "@/lib/amenity-icons";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

/*
 * A business's amenities, equipment and policies, each with photos where it has them (owner, 22 Sep
 * 2026). One set of editors for Create business and its edit steps (/business/new?from=edit).
 * Amenities and equipment belong to the business, for every business type (owner, 10 Oct 2026):
 *   amenities — what it has (profile_business.amenities): taxonomy amenities, or its own labels;
 *   equipment — gear with a Production tools type (equipment_categories hardware or daw_tools
 *     software), quantity and included-or-extra (bookable_equipment, by profile_id);
 *   policies — the business's rules (profile_business.policies), with suggestions from the
 *     business_policies taxonomy.
 */

export const PHOTOS_KEY = ["studio-photos", "mine"];
export const EQUIPMENT_KEY = ["studio-equipment", "mine"];

const inputCls =
  "min-h-control w-full rounded-lg border border-input bg-card px-4 text-sm outline-none field-focus";

/** The business's amenities and photos. Off for accounts that aren't a business. */
export function useMyBookablePhotos(enabled = true) {
  const load = useServerFn(listMyBookablePhotos);
  return useQuery({ queryKey: PHOTOS_KEY, queryFn: () => load(), enabled, retry: false });
}

/** The business's equipment list. Off for accounts that aren't a business. */
export function useMyBookableEquipment(enabled = true) {
  const load = useServerFn(getMyBookableEquipment);
  return useQuery({ queryKey: EQUIPMENT_KEY, queryFn: () => load(), enabled, retry: false });
}

/* ------------------------------------------------------------------ */
/* Amenities                                                            */
/* ------------------------------------------------------------------ */

/** Pick the business's amenities, or add its own, then add a photo of each. */
export function AmenitiesEditor() {
  const queryClient = useQueryClient();
  const q = useMyBookablePhotos();
  const tx = useTaxonomy().options;
  const save = useServerFn(updateMyAmenities);

  const saved = (q.data?.amenities ?? []).map((f) => f.slug);
  const update = useMutation({
    mutationFn: (amenities: string[]) => save({ data: { amenities } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PHOTOS_KEY }),
    onError: () => toast.error("Couldn't save the amenities. Try again."),
  });

  if (q.isLoading) return <Loading rows={2} />;
  if (q.isError)
    return (
      <LoadError
        what="your amenities"
        action={<Btn onClick={() => void q.refetch()}>Try Again</Btn>}
      />
    );
  if (!q.data?.ready) return null;
  const picked = update.isPending && update.variables ? update.variables : saved;
  const offered = tx?.amenities ?? [];
  // Anything picked that isn't a taxonomy slug is the business's own label (owner, 10 Oct 2026).
  // Until the taxonomy loads, nothing is known to be custom.
  const own = tx ? picked.filter((v) => !offered.some((o) => o.slug === v)) : [];
  const setOwn = (labels: string[]) => {
    const next = labels
      .map((l) => l.trim().slice(0, 60))
      .filter((l) => l.length >= 2)
      // A typed label that is already offered is that option, not a second copy of it.
      .map((l) => offered.find((o) => o.label.toLowerCase() === l.toLowerCase())?.slug ?? l);
    update.mutate([...new Set([...picked.filter((v) => !own.includes(v)), ...next])]);
  };
  return (
    <section id="amenities" className="space-y-3">
      {/*
        Chips, like every other "pick several of these" question in onboarding — instruments,
        genres, languages (owner, 29 Sep 2026). This was a drawer, which made the same question
        look like a different one depending on which side of the fork you came in from.
      */}
      <DrawerField label="Amenities" hint="What your business has. Add a photo of each.">
        <ChipPicker
          options={choicesFor(
            // The options still offered, and any the business already has so it can remove them.
            offered.filter((o) => o.metadata?.picker !== false || picked.includes(o.slug)),
          ).map((o) => {
            const Icon = amenityIcon(o.value);
            return {
              value: o.value,
              label: o.label,
              media: <Icon size={iconSize.sm} aria-hidden />,
            };
          })}
          selected={picked}
          onToggle={(v) =>
            update.mutate(picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v])
          }
        />
      </DrawerField>
      {/* The same add-a-line field as a service's deliverables; each one shows as a pill. */}
      <TagListField
        label="Add your own"
        id="amenities-own"
        placeholder="Rooftop terrace"
        value={own}
        onChange={setOwn}
      />
      {q.data.amenities.map((f) => (
        <Card key={f.slug}>
          <p className="truncate text-sm font-semibold">{f.label}</p>
          <ProofPhotos subjectType="amenity" subjectId={f.slug} name={f.label} />
        </Card>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Equipment                                                            */
/* ------------------------------------------------------------------ */

type EquipmentDraft = {
  id?: string;
  name: string;
  category: string;
  quantity: string;
  included: boolean;
};
const blankDraft: EquipmentDraft = { name: "", category: "", quantity: "", included: true };
/** Included or at extra cost, as keys; the words are only what the control shows. */
const INCLUSION = ["included", "extra"] as const;
const INCLUSION_LABELS: Record<(typeof INCLUSION)[number], string> = {
  included: "Included",
  extra: "Extra cost",
};

/** Add, change or remove the business's equipment, each with its photos. */
export function EquipmentEditor() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const save = useServerFn(saveMyBookableEquipment);
  const remove = useServerFn(removeMyBookableEquipment);
  const q = useMyBookableEquipment();
  const tx = useTaxonomy().options;
  // Older rows may hold an instrument's slug; only their label is read from the gear list.
  const gear = useGearTaxonomy();
  const [draft, setDraft] = useState<EquipmentDraft | null>(null);

  // The type is a Production tool (owner, 10 Oct 2026): hardware, then software. Instruments are
  // not equipment here; they are what talent plays.
  const tools = [
    ...(tx?.equipment_categories ?? []).map((o) => ({ ...o, hint: "Hardware" })),
    ...(tx?.daw_tools ?? []).map((o) => ({ ...o, hint: "Software" })),
  ];
  const typeLabel = (slug: string | null) =>
    slug
      ? (tools.find((t) => t.slug === slug)?.label ??
        gear.types.find((t) => t.slug === slug)?.label ??
        slug)
      : "";
  const typeOptions = tools
    .filter((t) => t.metadata?.picker !== false || t.slug === draft?.category)
    .map((t) => ({ value: t.slug, label: t.label, hint: t.hint }));

  const saveItem = useMutation({
    mutationFn: (d: EquipmentDraft) =>
      save({
        data: {
          ...(d.id ? { id: d.id } : {}),
          name: d.name.trim(),
          category: d.category || null,
          quantity: d.quantity ? Number(d.quantity) : null,
          included: d.included,
        },
      }),
    onSuccess: async (_r, d) => {
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEY });
      toast.success(d.id ? "Equipment saved" : "Equipment added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save that. Try again."),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: EQUIPMENT_KEY });
      const before = queryClient.getQueryData<MyBookableEquipment>(EQUIPMENT_KEY);
      if (before) {
        queryClient.setQueryData<MyBookableEquipment>(EQUIPMENT_KEY, {
          ...before,
          items: before.items.filter((i) => i.id !== id),
        });
      }
      return { before };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.before) queryClient.setQueryData(EQUIPMENT_KEY, ctx.before);
      toast.error("Couldn't remove that. Try again.");
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
        // The item's photos go with it.
        queryClient.invalidateQueries({ queryKey: PHOTOS_KEY }),
      ]),
  });

  const edit = (i: BookableEquipment) =>
    setDraft({
      id: i.id,
      name: i.name,
      category: i.category ?? "",
      quantity: i.quantity ? String(i.quantity) : "",
      included: i.included !== false,
    });
  const quantity = draft?.quantity ? Number(draft.quantity) : null;
  const valid =
    !!draft?.name.trim() && (quantity === null || (Number.isInteger(quantity) && quantity >= 1));

  return (
    <section id="equipment">
      <p className="mb-1.5 block text-sm font-medium text-foreground">Equipment</p>
      <p className="mb-3 text-1 text-muted-foreground">
        The gear customers can use, with a photo of each.
      </p>
      <div className="space-y-2">
        {q.isLoading ? (
          <Loading rows={2} />
        ) : q.isError ? (
          <LoadError
            what="your equipment"
            action={
              <Btn variant="outline" onClick={() => void q.refetch()}>
                Try again
              </Btn>
            }
          />
        ) : (
          (q.data?.items ?? []).map((i) => (
            <Card key={i.id}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => edit(i)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-semibold">{i.name}</span>
                  <span className="block truncate text-1 text-muted-foreground">
                    {[
                      typeLabel(i.category),
                      i.quantity ? `Qty ${i.quantity}` : "",
                      i.included === false ? "Extra cost" : "Included",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
                <IconBtn
                  label={`Remove ${i.name}`}
                  variant="ghost"
                  onClick={() =>
                    confirm.ask({ title: `Remove ${i.name}?`, confirmLabel: "Remove" }, () =>
                      removeItem.mutate(i.id),
                    )
                  }
                >
                  <Trash2 size={iconSize.sm} aria-hidden />
                </IconBtn>
              </div>
              <ProofPhotos subjectType="equipment" subjectId={i.id} name={i.name} />
            </Card>
          ))
        )}
        {q.isError ? null : (
          <Btn variant="outline" className="w-full" onClick={() => setDraft(blankDraft)}>
            <Plus size={iconSize.sm} className="mr-1.5" aria-hidden /> Add Equipment
          </Btn>
        )}
      </div>
      {confirm.dialog}

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit equipment" : "Add equipment"}
      >
        {draft ? (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid && !saveItem.isPending) saveItem.mutate(draft);
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="equipment-name">
                Make and model
              </label>
              <input
                id="equipment-name"
                required
                maxLength={120}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Neumann U87"
                className={inputCls}
              />
            </div>
            <DrawerField label="Type">
              <SheetSelect
                title="Type"
                value={draft.category || null}
                options={typeOptions}
                placeholder="Choose"
                searchable
                onChange={(v) => setDraft({ ...draft, category: v })}
              />
            </DrawerField>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="equipment-quantity">
                Quantity
              </label>
              <input
                id="equipment-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                step={1}
                value={draft.quantity}
                onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                placeholder="1"
                className={inputCls}
              />
            </div>
            <SegmentedField
              label="Included or extra cost"
              value={draft.included ? "included" : "extra"}
              options={INCLUSION}
              labels={INCLUSION_LABELS}
              onChange={(v) => setDraft({ ...draft, included: v === "included" })}
            />
            <Btn type="submit" className="w-full" disabled={!valid} loading={saveItem.isPending}>
              {draft.id ? "Save" : "Add"}
            </Btn>
          </form>
        ) : null}
      </Sheet>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Policies                                                             */
/* ------------------------------------------------------------------ */

/**
 * The business's rules (owner, 10 Oct 2026): one large text box, one rule per line. Stored as a
 * list (profile_business.policies), so each line is a rule; blank lines are dropped on save.
 * Controlled; the screen saves.
 */
export const MAX_POLICIES = 12;
export function PoliciesEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const rules = value.filter((p) => p.trim());
  const tooMany = rules.length > MAX_POLICIES;
  const tooLong = rules.some((p) => p.trim().length > 200);
  const problem = tooMany
    ? `Keep it to ${MAX_POLICIES} rules.`
    : tooLong
      ? "Keep each rule under 200 characters."
      : null;
  return (
    <div>
      <label htmlFor="policies" className="mb-1.5 block text-sm font-medium text-foreground">
        Rules
      </label>
      <textarea
        id="policies"
        value={value.join("\n")}
        rows={10}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        placeholder={"No smoking inside the rooms.\nReschedule at least 24 hours before."}
        aria-invalid={problem ? true : undefined}
        aria-describedby="policies-message"
        className={cn(
          "w-full resize-none rounded-sm border bg-card px-3.5 py-3 text-[16px] leading-relaxed outline-none field-focus",
          problem ? "border-destructive" : "border-input",
        )}
      />
      <p
        id="policies-message"
        role={problem ? "alert" : undefined}
        className={cn("mt-1.5 text-1", problem ? "text-destructive" : "text-muted-foreground")}
      >
        {problem ?? "One rule per line."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photos                                                               */
/* ------------------------------------------------------------------ */

/**
 * One amenity's or equipment item's photos: tap one to view it, remove it, or add another, up to
 * MAX_BOOKABLE_PHOTOS. Shows nothing until the photos table exists.
 */
export function ProofPhotos({
  subjectType,
  subjectId,
  name,
}: {
  subjectType: BookablePhotoSubject;
  subjectId: string;
  name: string;
}) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const q = useMyBookablePhotos();
  const add = useServerFn(addMyBookablePhoto);
  const remove = useServerFn(removeMyBookablePhoto);
  const [viewing, setViewing] = useState(false);
  if (!q.data?.ready) return null;
  const profileId = q.data.profileId;
  const photos = q.data.photos.filter(
    (p) => p.subject_type === subjectType && p.subject_id === subjectId,
  );

  async function onPick(kind: BookablePhotoSubject, file: File) {
    try {
      const url = await uploadBookablePhoto(profileId, file);
      await add({ data: { subjectType: kind, subjectId, url } });
      await queryClient.invalidateQueries({ queryKey: PHOTOS_KEY });
      toast.success("Photo added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that photo", {
        action: { label: "Try again", onClick: () => void onPick(kind, file) },
      });
    }
  }

  async function onRemove(id: string) {
    try {
      await remove({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: PHOTOS_KEY });
      toast.success("Photo removed");
    } catch {
      toast.error("Couldn't remove that photo");
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {confirm.dialog}
      {photos.map((p, i) => (
        <div key={p.id} className="relative">
          <button
            type="button"
            onClick={() => setViewing(true)}
            aria-label={`View photo ${i + 1} of ${name}`}
            className="block overflow-hidden rounded-lg"
          >
            <img
              src={sized(p.url, { width: 56 })}
              alt=""
              className="h-14 w-14 object-cover"
              loading="lazy"
            />
          </button>
          <button
            type="button"
            onClick={() =>
              confirm.ask({ title: "Remove this photo?", confirmLabel: "Remove" }, () =>
                onRemove(p.id),
              )
            }
            aria-label={`Remove photo ${i + 1} of ${name}`}
            title="Remove photo"
            className="hit-area absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground"
          >
            <X size={iconSize.xs} aria-hidden />
          </button>
        </div>
      ))}
      {photos.length < MAX_BOOKABLE_PHOTOS ? (
        <ImagePickButton
          kind={subjectType}
          label={`Add a photo of ${name}`}
          className="h-14 w-14 rounded-lg border border-dashed border-border text-muted-foreground"
          onPick={onPick}
        >
          <ImagePlus size={iconSize.sm} aria-hidden />
        </ImagePickButton>
      ) : null}
      <PhotoSheet
        title={name}
        photos={viewing ? photos.map((p) => p.url) : []}
        onClose={() => setViewing(false)}
      />
    </div>
  );
}
