import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn, BtnLink, IconBtn, Sheet } from "@/components/ml/ui";
import { BusinessOnlyGate, Card, Loading, SegmentedField } from "@/components/ml/kit";
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
import { type MyStudio, getMyStudio } from "@/lib/studio-owner.functions";
import { getMyBusiness, updateMyBusiness } from "@/lib/profile-groups.functions";
import { type Weekday, type WeeklyHours } from "@/lib/studio-slots";
import { AmenitiesEditor, EquipmentEditor } from "@/components/ml/studio-setup";

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
        <div className="mt-8 space-y-8">
          <AmenitiesEditor />
          <EquipmentEditor />
        </div>

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
