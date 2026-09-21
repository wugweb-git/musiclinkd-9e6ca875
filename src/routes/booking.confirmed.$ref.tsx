import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CalendarPlus,
  CalendarClock,
  CheckCircle2,
  Clock,
  MessageCircle,
  Share2,
  XCircle,
} from "lucide-react";
import { Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { BookingStatusPill, Detail } from "@/components/ml/booking";
import { Dialog, Loading } from "@/components/ml/kit";
import { formatDate, formatTime } from "@/data/booking";
import { cancelBooking, getBookingRequest, rescheduleBooking } from "@/lib/bookings.functions";
import { addToCalendar, shareLink } from "@/lib/booking-actions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";
import { earliestBookingDate } from "@/lib/studio-slots";

/*
 * What happened after you asked: the request as the studio will see it. A request is the end of the
 * flow — the studio replies, and payment is settled between the two of them, not here.
 */
export const Route = createFileRoute("/booking/confirmed/$ref")({
  head: () => ({
    meta: [
      { title: "Booking request sent — MusicLinkd" },
      {
        name: "description",
        content: "Your session details and what happens next after asking a studio.",
      },
      { property: "og:title", content: "Booking request sent — MusicLinkd" },
      { property: "og:description", content: "Session details and next steps." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmed,
});

function Confirmed() {
  const { ref } = Route.useParams();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(getBookingRequest);
  const q = useQuery({
    queryKey: ["booking", ref],
    queryFn: () => load({ data: { id: ref } }),
    enabled: signedIn,
    retry: false,
  });
  const b = q.data ?? null;
  const confirmed = b?.status === "confirmed";
  const settled = b && ["declined", "cancelled", "completed"].includes(b.status);
  const cancellable = b && ["requested", "reviewing", "confirmed"].includes(b.status);
  const cancel = useServerFn(cancelBooking);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function doCancel() {
    setCancelling(true);
    try {
      await cancel({ data: { id: ref } });
      await queryClient.invalidateQueries({ queryKey: ["booking", ref] });
      await queryClient.invalidateQueries({ queryKey: ["bookings", "mine"] });
      setConfirmCancel(false);
    } catch {
      toast.error("Couldn't cancel that — try again");
    } finally {
      setCancelling(false);
    }
  }

  const move = useServerFn(rescheduleBooking);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDate, setMoveDate] = useState("");
  const [moveStart, setMoveStart] = useState("");
  const [moving, setMoving] = useState(false);

  async function doReschedule() {
    if (!moveDate) return;
    setMoving(true);
    try {
      await move({
        data: {
          id: ref,
          date: moveDate,
          ...(moveStart ? { startTime: moveStart } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["booking", ref] });
      await queryClient.invalidateQueries({ queryKey: ["bookings", "mine"] });
      setMoveOpen(false);
      toast.success("New time sent — the studio answers again");
    } catch {
      toast.error("Couldn't move that — try again");
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-14">
      <div>
        {confirmed ? (
          <CheckCircle2 size={44} className="text-primary" />
        ) : settled ? (
          <XCircle size={44} className="text-muted-foreground" />
        ) : (
          <Clock size={44} className="text-primary" />
        )}
        <h1 className="mt-4 text-3 leading-tight">
          {confirmed
            ? "Booking confirmed"
            : b?.status === "cancelled"
              ? "Booking cancelled"
              : b?.status === "declined"
                ? "Booking declined"
                : b?.status === "completed"
                  ? "Booking completed"
                  : "Booking request sent"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmed
            ? `${b?.studio?.name ?? b?.studio_name ?? "The studio"} has confirmed your session. Settle payment with them directly.`
            : b?.status === "cancelled"
              ? "You cancelled this request."
              : b?.status === "declined"
                ? `${b?.studio?.name ?? b?.studio_name ?? "The studio"} declined this request.`
                : b?.status === "completed"
                  ? "This session has already happened."
                  : `${b?.studio?.name ?? b?.studio_name ?? "The studio"} will review your request and reply. Nothing is confirmed yet.`}
        </p>

        {q.isLoading ? (
          <div className="mt-5">
            <Loading rows={2} />
          </div>
        ) : b ? (
          <div className="mt-5 rounded-lg bg-subtle p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-semibold">
                {b.studio?.name ?? b.studio_name ?? "Studio"}
              </p>
              <BookingStatusPill status={b.status === "declined" ? "rejected" : b.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-1">
              {b.room?.name ? <Detail label="Room" value={b.room.name} /> : null}
              <Detail label="Date" value={formatDate(b.session_date)} />
              {b.start_time ? (
                <Detail
                  label="Time"
                  value={joinParts(
                    formatTime(b.start_time.slice(0, 5)),
                    b.end_time ? formatTime(b.end_time.slice(0, 5)) : "",
                  )}
                />
              ) : null}
              {b.hours ? <Detail label="Duration" value={`${b.hours} hrs`} /> : null}
              {b.people ? <Detail label="People" value={String(b.people)} /> : null}
              {b.purpose ? <Detail label="Purpose" value={b.purpose} /> : null}
              {b.studio?.location ? <Detail label="Location" value={b.studio.location} /> : null}
            </dl>
            {b.reply ? (
              <p className="mt-3 border-t border-border pt-3 text-1 text-muted-foreground">
                {b.reply}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-5 text-1 text-muted-foreground">
            This request is no longer available. Your bookings are on the Bookings screen.
          </p>
        )}

        {b ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Btn
              variant="outline"
              onClick={() =>
                addToCalendar({
                  uid: b.id,
                  title: joinParts(
                    b.studio?.name ?? b.studio_name ?? "Session",
                    b.room?.name ?? "",
                  ),
                  date: b.session_date,
                  start: (b.start_time ?? "10:00").slice(0, 5),
                  end: (b.end_time ?? "14:00").slice(0, 5),
                  location: joinParts(
                    b.studio?.name ?? b.studio_name ?? "",
                    b.studio?.location ?? "",
                  ),
                  description: b.purpose ?? "",
                })
              }
            >
              <CalendarPlus size={iconSize.sm} className="mr-1.5" /> Add to Calendar
            </Btn>
            <Btn
              variant="outline"
              onClick={() =>
                void shareLink({
                  title: b.studio?.name ?? b.studio_name ?? "Studio session",
                  url: `${window.location.origin}/studio`,
                })
              }
            >
              <Share2 size={iconSize.sm} className="mr-1.5" /> Share
            </Btn>
          </div>
        ) : null}

        {cancellable ? (
          <div className="mt-3 space-y-2">
            <Btn
              variant="outline"
              className="w-full"
              onClick={() => {
                setMoveDate(b?.session_date ?? "");
                setMoveStart(b?.start_time?.slice(0, 5) ?? "");
                setMoveOpen(true);
              }}
            >
              <CalendarClock size={iconSize.sm} className="mr-1.5" /> Ask for another time
            </Btn>
            <Btn variant="ghost" className="w-full" onClick={() => setConfirmCancel(true)}>
              <XCircle size={iconSize.sm} className="mr-1.5" /> Cancel this booking
            </Btn>
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-2">
        <BtnLink to="/bookings" className="w-full">
          View Bookings
        </BtnLink>
        <BtnLink to="/messages" variant="outline" className="w-full">
          <MessageCircle size={iconSize.sm} className="mr-1.5" /> Message Provider
        </BtnLink>
      </div>

      <Sheet open={moveOpen} onClose={() => setMoveOpen(false)} title="Ask for another time">
        <div className="space-y-4">
          <p className="text-1 text-muted-foreground">
            The studio answers again — a confirmed session goes back to pending when the time
            changes.
          </p>
          <label className="block">
            <span className="text-1 font-semibold">New date</span>
            <input
              type="date"
              min={earliestBookingDate()}
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              className="mt-2 h-12 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-1 font-semibold">Start time (optional)</span>
            <input
              type="time"
              value={moveStart}
              onChange={(e) => setMoveStart(e.target.value)}
              className="mt-2 h-12 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </label>
          <Btn
            className="w-full"
            disabled={!moveDate || moving}
            onClick={() => void doReschedule()}
          >
            {moving ? "Sending…" : "Send new time"}
          </Btn>
        </div>
      </Sheet>

      <Dialog
        open={confirmCancel}
        title="Cancel this booking?"
        body="The studio will see that you cancelled. This can't be undone."
        onClose={() => setConfirmCancel(false)}
      >
        <Btn onClick={() => void doCancel()} disabled={cancelling}>
          {cancelling ? "Cancelling…" : "Cancel booking"}
        </Btn>
        <Btn variant="ghost" onClick={() => setConfirmCancel(false)} disabled={cancelling}>
          Keep it
        </Btn>
      </Dialog>
    </div>
  );
}
