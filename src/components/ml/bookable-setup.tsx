import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Btn, Chip, IconBtn, Sheet } from "@/components/ml/ui";
import { Card, EmptyState, Loading, SegmentedField } from "@/components/ml/kit";
import { PhotoSheet } from "@/components/ml/booking";
import { ImagePickButton } from "@/components/ml/profile";
import { ChipPicker, DrawerField } from "@/components/ml/onboarding";
import { SheetMultiSelect, SheetSelect } from "@/components/ml/listing-form";
import {
  type MyBookableEquipment,
  type BookableEquipment,
  getMyBookableEquipment,
  removeMyBookableEquipment,
  saveMyBookableEquipment,
  updateMyBookable,
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
 * A studio's amenities, equipment and policies, each with photos where it has them (owner, 22 Sep
 * 2026). One set of editors for Create business and for Edit profile → Facilities & equipment:
 *   amenities — what the place has (studios.amenities, from studio_amenities);
 *   equipment — gear with a type (an instrument or an equipment category, the list Market uses),
 *     quantity and included-or-extra (bookable_equipment);
 *   policies — the business's rules (profile_business.policies), with suggestions from the
 *     business_policies taxonomy.
 */

export const PHOTOS_KEY = ["studio-photos", "mine"];
export const EQUIPMENT_KEY = ["studio-equipment", "mine"];

const inputCls =
  "min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:border-primary";

/** The owner's bookable, its facilities and photos. Off for accounts that can't have one. */
export function useMyBookablePhotos(enabled = true) {
  const load = useServerFn(listMyBookablePhotos);
  return useQuery({ queryKey: PHOTOS_KEY, queryFn: () => load(), enabled, retry: false });
}

/* ------------------------------------------------------------------ */
/* Amenities                                                            */
/* ------------------------------------------------------------------ */

/** Pick the studio's amenities in a drawer, then add a photo of each. */
export function AmenitiesEditor() {
  const queryClient = useQueryClient();
  const q = useMyBookablePhotos();
  const tx = useTaxonomy().options;
  const save = useServerFn(updateMyBookable);
  const section = useRef<HTMLElement>(null);
  // Edit profile > Facilities & equipment lands here (#facilities) once the section has rendered.
  const shown = Boolean(q.data?.ready);
  useEffect(() => {
    if (shown && window.location.hash === "#facilities") {
      section.current?.scrollIntoView({ block: "start" });
    }
  }, [shown]);

  const picked = (q.data?.facilities ?? []).map((f) => f.slug);
  const update = useMutation({
    mutationFn: (amenities: string[]) => save({ data: { amenities } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PHOTOS_KEY }),
    onError: () => toast.error("Couldn't save the amenities. Try again."),
  });

  if (q.isLoading) return <Loading rows={2} />;
  if (q.isError || !q.data?.ready) return null;
  return (
    <section id="facilities" ref={section} className="scroll-mt-4 space-y-3">
      {/*
        Chips, like every other "pick several of these" question in onboarding — instruments,
        genres, languages (owner, 29 Sep 2026). This was a drawer, which made the same question
        look like a different one depending on which side of the fork you came in from.
      */}
      <DrawerField label="Amenities" hint="What the place has. Add a photo of each.">
        <ChipPicker
          options={choicesFor(tx?.studio_amenities).map((o) => {
            const Icon = amenityIcon(o.value);
            return {
              value: o.value,
              label: o.label,
              media: <Icon size={iconSize.sm} aria-hidden />,
            };
          })}
          selected={update.isPending && update.variables ? update.variables : picked}
          onToggle={(v) => {
            const now = update.isPending && update.variables ? update.variables : picked;
            update.mutate(now.includes(v) ? now.filter((x) => x !== v) : [...now, v]);
          }}
        />
      </DrawerField>
      {q.data.facilities.map((f) => (
        <Card key={f.slug}>
          <p className="truncate text-sm font-semibold">{f.label}</p>
          <ProofPhotos subjectType="facility" subjectId={f.slug} name={f.label} />
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
const INCLUSION = ["Included", "Extra cost"] as const;

/** Add, change or remove the studio's equipment, each with its photos. */
export function EquipmentEditor() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyBookableEquipment);
  const save = useServerFn(saveMyBookableEquipment);
  const remove = useServerFn(removeMyBookableEquipment);
  const q = useQuery({ queryKey: EQUIPMENT_KEY, queryFn: () => load() });
  const gear = useGearTaxonomy();
  const [draft, setDraft] = useState<EquipmentDraft | null>(null);
  const section = useRef<HTMLElement>(null);

  // The manage screen links here as #equipment; the section only exists once the studio loads.
  useEffect(() => {
    if (!q.isLoading && window.location.hash === "#equipment") {
      section.current?.scrollIntoView({ block: "start" });
    }
  }, [q.isLoading]);

  const typeLabel = (slug: string | null) =>
    slug
      ? (gear.types.find((t) => t.slug === slug)?.label ??
        q.data?.categories.find((c) => c.slug === slug)?.label ??
        slug)
      : "";
  // Instruments first by family (Guitars, Keys, Drums…), then equipment (Microphones, Consoles…).
  const typeOptions = gear.types.map((t) => ({
    value: t.slug,
    label: t.label,
    hint:
      t.kind === "instrument"
        ? (gear.categories.find((c) => c.slug === t.category)?.label ?? "Instrument")
        : "Equipment",
  }));

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
    <section id="equipment" ref={section} className="scroll-mt-4">
      <p className="mb-1.5 block text-sm font-medium text-foreground">Equipment</p>
      <p className="mb-3 text-1 text-muted-foreground">
        The gear customers can use, with a photo of each.
      </p>
      <div className="space-y-2">
        {q.isLoading ? (
          <Loading rows={2} />
        ) : q.isError ? (
          <EmptyState title="Couldn't load equipment" body="Check your connection and try again.">
            <Btn variant="outline" onClick={() => void q.refetch()}>
              Retry
            </Btn>
          </EmptyState>
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
                  onClick={() => removeItem.mutate(i.id)}
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

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit equipment" : "Add equipment"}
      >
        {draft ? (
          <form
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
              value={draft.included ? INCLUSION[0] : INCLUSION[1]}
              options={INCLUSION}
              onChange={(v) => setDraft({ ...draft, included: v === INCLUSION[0] })}
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
 * The business's rules, one per line: edit, remove, or add a suggestion in one tap. Controlled;
 * the screen saves. Suggestions come from the business_policies taxonomy.
 */
export function PoliciesEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const tx = useTaxonomy().options;
  const unused = (tx?.business_policies ?? []).filter((o) => !value.includes(o.label));
  return (
    <div className="space-y-3">
      {value.map((p, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            aria-label={`Policy ${i + 1}`}
            value={p}
            maxLength={200}
            rows={2}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
            className="min-h-control flex-1 resize-none rounded-lg border border-border bg-card px-4 py-3 text-2 outline-none focus:border-primary"
          />
          <IconBtn
            label={`Remove policy ${i + 1}`}
            variant="ghost"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <X size={iconSize.sm} aria-hidden />
          </IconBtn>
        </div>
      ))}
      {value.length < 12 ? (
        <Btn variant="outline" className="w-full" onClick={() => onChange([...value, ""])}>
          <Plus size={iconSize.sm} className="mr-1.5" aria-hidden /> Write a Policy
        </Btn>
      ) : null}
      {unused.length && value.length < 12 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {unused.map((o) => (
              <Chip key={o.slug} onClick={() => onChange([...value, o.label])}>
                <Plus size={iconSize.xs} className="mr-1" aria-hidden /> {o.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photos                                                               */
/* ------------------------------------------------------------------ */

/**
 * One facility's or equipment item's photos: tap one to view it, remove it, or add another, up to
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
  const q = useMyBookablePhotos();
  const add = useServerFn(addMyBookablePhoto);
  const remove = useServerFn(removeMyBookablePhoto);
  const [viewing, setViewing] = useState(false);
  if (!q.data?.ready) return null;
  const { studioId } = q.data;
  const photos = q.data.photos.filter(
    (p) => p.subject_type === subjectType && p.subject_id === subjectId,
  );

  async function onPick(kind: BookablePhotoSubject, file: File) {
    try {
      const url = await uploadBookablePhoto(studioId, file);
      await add({ data: { subjectType: kind, subjectId, url } });
      await queryClient.invalidateQueries({ queryKey: PHOTOS_KEY });
      toast.success("Photo added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that photo");
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
            onClick={() => void onRemove(p.id)}
            aria-label={`Remove photo ${i + 1} of ${name}`}
            title="Remove photo"
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground"
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
