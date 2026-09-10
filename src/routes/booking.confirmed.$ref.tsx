import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, CheckCircle2, Clock, MessageCircle, Share2 } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { BookingStatusPill, Detail } from "@/components/ml/booking";
import { bookables, formatDate, formatTime, inr, isoDate } from "@/data/booking";

export const Route = createFileRoute("/booking/confirmed/$ref")({
  head: () => ({
    meta: [
      { title: "Booking confirmation — MusicLinkd" },
      {
        name: "description",
        content:
          "Your session details, reference number and next steps after requesting or confirming a booking.",
      },
      { property: "og:title", content: "Booking confirmation — MusicLinkd" },
      {
        property: "og:description",
        content: "Session details and next steps for your MusicLinkd booking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Confirmed,
});

function Confirmed() {
  const { ref } = Route.useParams();
  const requested = ref.endsWith("R");
  const b = bookables[0]!;
  const r = b.resources[0]!;
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const date = isoDate(soon);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-14">
      <div>
        {requested ? (
          <Clock size={44} className="text-primary" />
        ) : (
          <CheckCircle2 size={44} className="text-primary" />
        )}
        <h1 className="mt-4 text-[28px] leading-tight">
          {requested ? "Booking request sent" : "Booking confirmed"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {requested
            ? `${b.name} will review your request and reply — usually within a few hours. Nothing is confirmed yet.`
            : `Your slot at ${b.name} is locked in. The provider has your session details.`}
        </p>

        <div className="mt-5 rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-semibold">{b.name}</p>
            <BookingStatusPill status={requested ? "requested" : "confirmed"} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
            <Detail label="Room" value={r.name} />
            <Detail label="Date" value={formatDate(date)} />
            <Detail label="Time" value={`${formatTime("16:00")} – ${formatTime("20:00")}`} />
            <Detail label="Duration" value="4 hrs" />
            <Detail label="Location" value={`${b.area}, ${b.city}`} />
            <Detail label="Booking ID" value={ref} />
            <Detail label={requested ? "Estimated price" : "Amount"} value={inr(11328)} />
            <Detail label="Payment" value={requested ? "Nothing charged yet" : "Deposit paid"} />
          </dl>
        </div>

        {!requested ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Btn variant="outline" onClick={() => undefined}>
              <CalendarPlus size={15} className="mr-1.5" /> Add to calendar
            </Btn>
            <Btn variant="outline" onClick={() => undefined}>
              <Share2 size={15} className="mr-1.5" /> Share
            </Btn>
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-2">
        <Link to="/bookings" className="block">
          <Btn className="w-full">View booking</Btn>
        </Link>
        <Link to="/messages" className="block">
          <Btn variant="outline" className="w-full">
            <MessageCircle size={15} className="mr-1.5" /> Message provider
          </Btn>
        </Link>
      </div>
    </div>
  );
}
