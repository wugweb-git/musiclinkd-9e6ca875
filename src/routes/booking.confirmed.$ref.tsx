import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, CheckCircle2, Clock, MessageCircle, Share2 } from "lucide-react";
import { Btn, BtnLink } from "@/components/ml/ui";
import { BookingStatusPill, Detail } from "@/components/ml/booking";
import { Loading } from "@/components/ml/kit";
import { formatDate, formatTime } from "@/data/booking";
import { getBookingRequest } from "@/lib/bookings.functions";
import { addToCalendar, shareLink } from "@/lib/booking-actions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

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
  const load = useServerFn(getBookingRequest);
  const q = useQuery({
    queryKey: ["booking", ref],
    queryFn: () => load({ data: { id: ref } }),
    enabled: signedIn,
    retry: false,
  });
  const b = q.data ?? null;
  const confirmed = b?.status === "confirmed";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-14">
      <div>
        {confirmed ? (
          <CheckCircle2 size={44} className="text-primary" />
        ) : (
          <Clock size={44} className="text-primary" />
        )}
        <h1 className="mt-4 text-3 leading-tight">
          {confirmed ? "Booking confirmed" : "Booking request sent"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmed
            ? `${b?.studio?.name ?? "The studio"} has confirmed your session. Settle payment with them directly.`
            : `${b?.studio?.name ?? "The studio"} will review your request and reply. Nothing is confirmed yet.`}
        </p>

        {q.isLoading ? (
          <div className="mt-5">
            <Loading rows={2} />
          </div>
        ) : b ? (
          <div className="mt-5 rounded-lg bg-subtle p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-semibold">{b.studio?.name ?? "Studio"}</p>
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
                  title: joinParts(b.studio?.name ?? "Session", b.room?.name ?? ""),
                  date: b.session_date,
                  start: (b.start_time ?? "10:00").slice(0, 5),
                  end: (b.end_time ?? "14:00").slice(0, 5),
                  location: joinParts(b.studio?.name ?? "", b.studio?.location ?? ""),
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
                  title: b.studio?.name ?? "Studio session",
                  url: `${window.location.origin}/studio`,
                })
              }
            >
              <Share2 size={iconSize.sm} className="mr-1.5" /> Share
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
    </div>
  );
}
