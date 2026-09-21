import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2, X } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn, BtnLink, IconBtn, Sheet } from "@/components/ml/ui";
import { BusinessOnlyGate, Card, EmptyState, Loading, SegmentedField } from "@/components/ml/kit";
import { PhotoSheet } from "@/components/ml/booking";
import { ImagePickButton } from "@/components/ml/profile";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { formatDate, formatTime } from "@/data/booking";
import { iconSize } from "@/lib/tokens";
import {
  addMyStudioBlock,
  getStudioCalendar,
  listMyStudioBlocks,
  removeMyStudioBlock,
  updateMyWeeklyHours,
} from "@/lib/studio-calendar.functions";
import {
  type MyStudio,
  type MyStudioEquipment,
  type StudioEquipment,
  getMyStudio,
  getMyStudioEquipment,
  removeMyStudioEquipment,
  saveMyStudioEquipment,
} from "@/lib/studio-owner.functions";
import { getMyBusiness, updateMyBusiness } from "@/lib/profile-groups.functions";
import { type Weekday, type WeeklyHours } from "@/lib/studio-slots";
import {
  MAX_STUDIO_PHOTOS,
  type StudioPhotoSubject,
  addMyStudioPhoto,
  listMyStudioPhotos,
  removeMyStudioPhoto,
} from "@/lib/studio-photos.functions";
import { uploadStudioPhoto } from "@/lib/studio-photos";

export const Route = createFileRoute("/business/availability")({
  head: () => ({
    meta: [
      { title: "Manage availability — MusicLinkd provider" },
      {
        name: "description",
        content: "Set the opening hours customers see before requesting a session.",
      },
      { property: "og:title", content: "Manage availability — MusicLinkd provider" },
      {
        property: "og:description",
        content: "Opening hours for your space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Availability,
});

function Availability() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <AvailabilityContent />
    </BusinessOnlyGate>
  );
}

function AvailabilityContent() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyStudio);
  const q = useQuery({ queryKey: ["business", "studio", "mine"], queryFn: () => load() });
  // A business without a studio (a label, an agency) has only the hours line on its profile.
  const loadBusiness = useServerFn(getMyBusiness);
  const business = useQuery({
    queryKey: ["business", "mine"],
    queryFn: () => loadBusiness(),
    enabled: !q.isLoading && !q.data,
  });
  const saveBusiness = useServerFn(updateMyBusiness);
  const [hours, setHours] = useState("");
  useEffect(() => setHours(business.data?.business.operating_hours ?? ""), [business.data]);

  async function onSaveHours() {
    try {
      await saveBusiness({ data: { operating_hours: hours.trim() || null } });
      await queryClient.invalidateQueries({ queryKey: ["business", "mine"] });
      toast.success("Opening hours saved");
    } catch {
      toast.error("Couldn't save opening hours");
    }
  }

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Availability" back="/business/bookings" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen>
        <TopBar title="Availability" back="/business/bookings" />
        <main className="px-5 pt-4">
          <h2 className="text-2">Opening hours</h2>
          <p className="mt-1 text-1 text-muted-foreground">Shown on your business profile.</p>
          <textarea
            rows={3}
            value={hours}
            placeholder="e.g. Mon–Sat, 10am–7pm. Closed Sundays."
            onChange={(e) => setHours(e.target.value)}
            className="mt-2 w-full resize-none rounded-lg border border-border bg-card p-4 text-1 leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <Btn className="mt-4 w-full" onClick={() => void onSaveHours()}>
            Save Opening Hours
          </Btn>
        </main>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Availability" subtitle={q.data.name} back="/business/bookings" />
      <main className="px-5 pt-4">
        <WeeklyHoursEditor studio={q.data} />
        <ClosedTimes studio={q.data} />
        <FacilitiesEditor />
        <EquipmentEditor />

        <BtnLink to="/business/bookings" variant="ghost" className="mt-2 w-full">
          Back to Workspace
        </BtnLink>
      </main>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Booking calendar: weekly hours and closed times                     */
/* ------------------------------------------------------------------ */

const DAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const inputCls =
  "min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:border-primary";

/** The hours customers can pick from on the booking calendar, day by day. */
function WeeklyHoursEditor({ studio }: { studio: MyStudio }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getStudioCalendar);
  const save = useServerFn(updateMyWeeklyHours);
  const q = useQuery({
    queryKey: ["studio-calendar", studio.slug, "hours"],
    queryFn: () => load({ data: { slug: studio.slug } }),
  });
  const [week, setWeek] = useState<WeeklyHours>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setWeek(q.data?.weeklyHours ?? {}), [q.data]);

  // One opening span per day is edited here; any further spans already stored are kept.
  const setDay = (day: Weekday, open: boolean, span = { open: "10:00", close: "20:00" }) =>
    setWeek((w) => ({ ...w, [day]: open ? [span, ...(w[day]?.slice(1) ?? [])] : [] }));

  async function onSave() {
    setSaving(true);
    try {
      await save({ data: { weeklyHours: week } });
      await queryClient.invalidateQueries({ queryKey: ["studio-calendar", studio.slug] });
      await queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Opening hours saved");
    } catch {
      toast.error("Couldn't save opening hours");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="text-2">Opening hours</h2>
      <p className="mt-1 text-1 text-muted-foreground">
        The hours customers can book on your calendar, also shown on your studio page and business
        profile. With none set, they send a request instead.
      </p>
      {q.isLoading ? (
        <div className="mt-3">
          <Loading />
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {DAYS.map(({ key, label }) => {
            const span = week[key]?.[0];
            return (
              <Card key={key}>
                <div className="flex items-center gap-3">
                  <p className="w-24 shrink-0 text-sm font-semibold">{label}</p>
                  <SegmentedField
                    label={`${label} open or closed`}
                    value={span ? "Open" : "Closed"}
                    options={["Open", "Closed"] as const}
                    onChange={(v) => setDay(key, v === "Open")}
                  />
                </div>
                {span ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="time"
                      step={3600}
                      aria-label={`${label} opens`}
                      value={span.open}
                      onChange={(e) => setDay(key, true, { ...span, open: e.target.value })}
                      className={inputCls}
                    />
                    <span className="text-1 text-muted-foreground">to</span>
                    <input
                      type="time"
                      step={3600}
                      aria-label={`${label} closes`}
                      value={span.close}
                      onChange={(e) => setDay(key, true, { ...span, close: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}
          <Btn className="w-full" onClick={() => void onSave()} loading={saving}>
            Save Opening Hours
          </Btn>
        </div>
      )}
    </section>
  );
}

/** Times the owner closes on top of the weekly hours, for one room or the whole studio. */
function ClosedTimes({ studio }: { studio: MyStudio }) {
  const queryClient = useQueryClient();
  const load = useServerFn(listMyStudioBlocks);
  const add = useServerFn(addMyStudioBlock);
  const remove = useServerFn(removeMyStudioBlock);
  const q = useQuery({ queryKey: ["studio-blocks", "mine"], queryFn: () => load() });
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const roomName = (id: string | null) =>
    studio.rooms.find((r) => r.id === id)?.name ?? "Whole studio";

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["studio-blocks", "mine"] }),
      queryClient.invalidateQueries({ queryKey: ["studio-calendar", studio.slug] }),
    ]);
  }

  async function onAdd() {
    setBusy(true);
    try {
      await add({
        data: {
          roomId: roomId || null,
          startsAt,
          endsAt,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
      });
      await refresh();
      setOpen(false);
      setStartsAt("");
      setEndsAt("");
      setReason("");
      toast.success("Time closed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't close that time");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    try {
      await remove({ data: { id } });
      await refresh();
      toast.success("Time reopened");
    } catch {
      toast.error("Couldn't reopen that time");
    }
  }

  const when = (ts: string) => `${formatDate(ts.slice(0, 10))}, ${formatTime(ts.slice(11, 16))}`;

  return (
    <section className="mt-8">
      <h2 className="text-2">Closed times</h2>
      <p className="mt-1 text-1 text-muted-foreground">
        Holidays, maintenance or private sessions. Customers see these times as taken.
      </p>
      <div className="mt-3 space-y-2">
        {q.isLoading ? (
          <Loading rows={2} />
        ) : (
          (q.data ?? []).map((b) => (
            <Card key={b.id} className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {when(b.starts_at)} – {when(b.ends_at)}
                </span>
                <span className="block truncate text-1 text-muted-foreground">
                  {[roomName(b.room_id), b.reason].filter(Boolean).join(" · ")}
                </span>
              </span>
              <IconBtn label="Reopen this time" variant="ghost" onClick={() => void onRemove(b.id)}>
                <Trash2 size={iconSize.sm} aria-hidden />
              </IconBtn>
            </Card>
          ))
        )}
        <Btn variant="outline" className="w-full" onClick={() => setOpen(true)}>
          Close a time
        </Btn>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Close a time">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (startsAt && endsAt && !busy) void onAdd();
          }}
        >
          {studio.rooms.length ? (
            <>
              <label className="block text-1 font-semibold" htmlFor="block-room">
                Room
              </label>
              <select
                id="block-room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={inputCls}
              >
                <option value="">Whole studio</option>
                {studio.rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <label className="block text-1 font-semibold" htmlFor="block-start">
            From
          </label>
          <input
            id="block-start"
            type="datetime-local"
            step={3600}
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputCls}
          />
          <label className="block text-1 font-semibold" htmlFor="block-end">
            Until
          </label>
          <input
            id="block-end"
            type="datetime-local"
            step={3600}
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputCls}
          />
          <label className="block text-1 font-semibold" htmlFor="block-reason">
            Reason
          </label>
          <input
            id="block-reason"
            value={reason}
            maxLength={200}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Only you see this."
            className={inputCls}
          />
          <Btn
            type="submit"
            className="w-full"
            disabled={!startsAt || !endsAt || endsAt <= startsAt}
            loading={busy}
          >
            Close this time
          </Btn>
        </form>
      </Sheet>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Equipment: the gear list on the studio page and business profile    */
/* ------------------------------------------------------------------ */

const EQUIPMENT_KEY = ["studio-equipment", "mine"];
type EquipmentDraft = { id?: string; name: string; category: string; quantity: string };
const blankDraft: EquipmentDraft = { name: "", category: "", quantity: "" };

/** Add, change or remove the studio's equipment. Removing is optimistic; saving shows pending. */
function EquipmentEditor() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyStudioEquipment);
  const save = useServerFn(saveMyStudioEquipment);
  const remove = useServerFn(removeMyStudioEquipment);
  const q = useQuery({ queryKey: EQUIPMENT_KEY, queryFn: () => load() });
  const [draft, setDraft] = useState<EquipmentDraft | null>(null);
  const section = useRef<HTMLElement>(null);

  // The manage screen links here as #equipment; the section only exists once the studio loads.
  useEffect(() => {
    if (!q.isLoading && window.location.hash === "#equipment") {
      section.current?.scrollIntoView({ block: "start" });
    }
  }, [q.isLoading]);

  const categoryLabel = (slug: string | null) =>
    slug ? (q.data?.categories.find((c) => c.slug === slug)?.label ?? slug) : "";

  const saveItem = useMutation({
    mutationFn: (d: EquipmentDraft) =>
      save({
        data: {
          ...(d.id ? { id: d.id } : {}),
          name: d.name.trim(),
          category: d.category || null,
          quantity: d.quantity ? Number(d.quantity) : null,
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
      const before = queryClient.getQueryData<MyStudioEquipment>(EQUIPMENT_KEY);
      if (before) {
        queryClient.setQueryData<MyStudioEquipment>(EQUIPMENT_KEY, {
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

  const edit = (i: StudioEquipment) =>
    setDraft({
      id: i.id,
      name: i.name,
      category: i.category ?? "",
      quantity: i.quantity ? String(i.quantity) : "",
    });
  const quantity = draft?.quantity ? Number(draft.quantity) : null;
  const valid =
    !!draft?.name.trim() && (quantity === null || (Number.isInteger(quantity) && quantity >= 1));

  return (
    <section id="equipment" ref={section} className="mt-8 scroll-mt-4">
      <h2 className="text-2">Equipment</h2>
      <p className="mt-1 text-1 text-muted-foreground">
        The gear customers see on your studio page.
      </p>
      <div className="mt-3 space-y-2">
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
                    {[categoryLabel(i.category), i.quantity ? `× ${i.quantity}` : ""]
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
            Add equipment
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
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid && !saveItem.isPending) saveItem.mutate(draft);
            }}
          >
            <label className="block text-1 font-semibold" htmlFor="equipment-name">
              Name
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
            <label className="block text-1 font-semibold" htmlFor="equipment-category">
              Category
            </label>
            <select
              id="equipment-category"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className={inputCls}
            >
              <option value="">None</option>
              {(q.data?.categories ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
              {/* A stored slug that is no longer published stays selectable as itself. */}
              {draft.category && !q.data?.categories.some((c) => c.slug === draft.category) ? (
                <option value={draft.category}>{draft.category}</option>
              ) : null}
            </select>
            <label className="block text-1 font-semibold" htmlFor="equipment-quantity">
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
              className={inputCls}
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
/* Photos as proof: facilities and equipment on the studio page        */
/* ------------------------------------------------------------------ */

const PHOTOS_KEY = ["studio-photos", "mine"];

function useMyStudioPhotos() {
  const load = useServerFn(listMyStudioPhotos);
  return useQuery({ queryKey: PHOTOS_KEY, queryFn: () => load() });
}

/** Each of the studio's facilities, with the photos customers can open on the studio page. */
function FacilitiesEditor() {
  const q = useMyStudioPhotos();
  const section = useRef<HTMLElement>(null);
  // Manage > Photos & spaces lands here (#facilities) once the section has rendered.
  const shown = Boolean(q.data?.ready && q.data.facilities.length);
  useEffect(() => {
    if (shown && window.location.hash === "#facilities") {
      section.current?.scrollIntoView({ block: "start" });
    }
  }, [shown]);
  // Nothing to prove before the photos table exists, or when the studio lists no facilities.
  if (q.isLoading || q.isError || !q.data?.ready || !q.data.facilities.length) return null;
  return (
    <section id="facilities" ref={section} className="mt-8 scroll-mt-4">
      <h2 className="text-2">Facilities</h2>
      <p className="mt-1 text-1 text-muted-foreground">
        Photos customers can open beside each facility on your studio page.
      </p>
      <div className="mt-3 space-y-2">
        {q.data.facilities.map((f) => (
          <Card key={f.slug}>
            <p className="truncate text-sm font-semibold">{f.label}</p>
            <ProofPhotos subjectType="facility" subjectId={f.slug} name={f.label} />
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * One facility's or equipment item's photos: tap one to view it, remove it, or add another, up to
 * MAX_STUDIO_PHOTOS. Shows nothing until the photos table exists.
 */
function ProofPhotos({
  subjectType,
  subjectId,
  name,
}: {
  subjectType: StudioPhotoSubject;
  subjectId: string;
  name: string;
}) {
  const queryClient = useQueryClient();
  const q = useMyStudioPhotos();
  const add = useServerFn(addMyStudioPhoto);
  const remove = useServerFn(removeMyStudioPhoto);
  const [viewing, setViewing] = useState(false);
  if (!q.data?.ready) return null;
  const { studioId } = q.data;
  const photos = q.data.photos.filter(
    (p) => p.subject_type === subjectType && p.subject_id === subjectId,
  );

  async function onPick(kind: StudioPhotoSubject, file: File) {
    try {
      const url = await uploadStudioPhoto(studioId, file);
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
            <img src={p.url} alt="" className="h-14 w-14 object-cover" loading="lazy" />
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
      {photos.length < MAX_STUDIO_PHOTOS ? (
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
