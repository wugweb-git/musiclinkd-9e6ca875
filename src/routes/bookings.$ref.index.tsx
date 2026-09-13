import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, MapPin, MessageCircle, Navigation } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import {
  BookingStatusPill,
  BookingTimeline,
  Detail,
  EmptyState,
  PaymentPill,
  PriceBreakdownCard,
  PolicyCard,
} from "@/components/ml/booking";
import {
  formatDate,
  formatTime,
  getBooking,
  getBookable,
  getResource,
  inr,
  priceFor,
} from "@/data/booking";

export const Route = createFileRoute("/bookings/$ref/")({
  head: () => ({
    meta: [
      { title: "Booking detail — MusicLinkd" },
      {
        name: "description",
        content:
          "Full status, timing, location, payment state and actions for a single MusicLinkd booking.",
      },
      { property: "og:title", content: "Booking detail — MusicLinkd" },
      {
        property: "og:description",
        content: "Status, timing, payment and actions for your booking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingDetail,
});

function BookingDetail() {
  const { ref } = Route.useParams();
  const bk = getBooking(ref);
  const b = getBookable(bk?.bookableId ?? "");
  const r = getResource(b, bk?.resourceId);

  if (!bk || !b || !r) {
    return (
      <Screen>
        <TopBar title="Booking" back="/bookings" />
        <div className="px-5 pt-4">
          <EmptyState
            title="This booking is unavailable"
            body="It may have been cancelled, expired, removed, or you no longer have access to it."
            action={
              <Link to="/bookings">
                <Btn>Return to bookings</Btn>
              </Link>
            }
          />
        </div>
      </Screen>
    );
  }

  const price = priceFor(b, r, bk.hours, bk.addOnIds);
  const today = new Date().toDateString() === new Date(`${bk.date}T00:00:00`).toDateString();
  const upcoming = ["upcoming", "confirmed"].includes(bk.status);
  const completed = bk.status === "completed";

  return (
    <Screen>
      <TopBar title={`#${bk.ref}`} subtitle={b.name} back="/bookings" />
      <main className="px-5 pt-4">
        {upcoming && today ? (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--pink-container)" }}
          >
            <p className="font-semibold">Today at {formatTime(bk.start)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Arrive 10 minutes early for load-in at {b.area}.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusPill status={bk.status} />
          <PaymentPill status={bk.payment} />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="flex gap-3">
            <img
              src={r.photo}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold">{b.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.name}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={12} /> {b.area}, {b.city}
              </p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
            <Detail label="Date" value={formatDate(bk.date)} />
            <Detail label="Time" value={`${formatTime(bk.start)} – ${formatTime(bk.end)}`} />
            <Detail label="Duration" value={`${bk.hours} hrs`} />
            <Detail label="People" value={`${bk.people}`} />
            <Detail label="Purpose" value={bk.purpose} />
            <Detail label="Amount" value={inr(bk.amount)} />
          </dl>
          {bk.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              {bk.notes}
            </p>
          ) : null}
        </div>

        <h2 className="mt-6 text-[17px]">Progress</h2>
        <div className="mt-3 rounded-lg border border-border bg-card p-4">
          <BookingTimeline status={bk.status} />
        </div>

        <h2 className="mt-6 text-[17px]">Price</h2>
        <div className="mt-3">
          <PriceBreakdownCard p={price} compact />
        </div>

        <h2 className="mt-6 text-[17px]">Terms that apply</h2>
        <div className="mt-3 space-y-2">
          {b.policies.slice(0, 3).map((p) => (
            <PolicyCard
              key={p.title}
              title={p.title}
              body={p.body}
              critical={p.critical ?? false}
            />
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <Link to="/messages" className="block">
            <Btn variant="outline" className="w-full">
              <MessageCircle size={15} className="mr-1.5" /> Message provider
            </Btn>
          </Link>

          {upcoming ? (
            <>
              <Btn variant="outline" className="w-full" onClick={() => undefined}>
                <CalendarPlus size={15} className="mr-1.5" /> Add to calendar
              </Btn>
              <Btn variant="outline" className="w-full" onClick={() => undefined}>
                <Navigation size={15} className="mr-1.5" /> Get directions
              </Btn>
              <Link to="/bookings/$ref/reschedule" params={{ ref: bk.ref }} className="block">
                <Btn variant="ghost" className="w-full">
                  Reschedule
                </Btn>
              </Link>
              <Link to="/bookings/$ref/cancel" params={{ ref: bk.ref }} className="block">
                <Btn variant="ghost" className="w-full">
                  Cancel booking
                </Btn>
              </Link>
            </>
          ) : null}

          {completed ? (
            <>
              <Link to="/booking/$id" params={{ id: b.id }} className="block">
                <Btn className="w-full">Book again</Btn>
              </Link>
              <Btn variant="outline" className="w-full" onClick={() => undefined}>
                Leave a review
              </Btn>
              <p className="text-center text-[11px] text-muted-foreground">
                Reviews are handled in your MusicLinkd reviews flow.
              </p>
            </>
          ) : null}
        </div>
      </main>
    </Screen>
  );
}
