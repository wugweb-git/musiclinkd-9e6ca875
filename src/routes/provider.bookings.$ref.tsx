import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Users } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import {
  BookingStatusPill,
  BookingTimeline,
  Detail,
  EmptyState,
  PaymentPill,
  PriceBreakdownCard,
} from "@/components/ml/booking";
import {
  bookings,
  formatDate,
  formatTime,
  getBookable,
  getResource,
  inr,
  priceFor,
  providerToday,
} from "@/data/booking";

export const Route = createFileRoute("/provider/bookings/$ref")({
  head: () => ({
    meta: [
      { title: "Session detail — MusicLinkd provider" },
      {
        name: "description",
        content:
          "Everything you need to run the session: customer, room, timing, add-ons and payout status.",
      },
      { property: "og:title", content: "Session detail — MusicLinkd provider" },
      {
        property: "og:description",
        content: "Customer, room, timing and payout for a confirmed session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProviderBookingDetail,
});

function ProviderBookingDetail() {
  const { ref } = Route.useParams();
  const bk = [...bookings, ...providerToday].find((x) => x.ref === ref);
  const b = getBookable(bk?.bookableId ?? "");
  const r = getResource(b, bk?.resourceId);

  if (!bk || !b || !r) {
    return (
      <Screen>
        <TopBar title="Session" back="/provider/bookings" />
        <div className="px-5 pt-4">
          <EmptyState
            title="Session not found"
            body="It may have been cancelled or moved."
            action={
              <Link to="/provider/bookings">
                <Btn>Back to workspace</Btn>
              </Link>
            }
          />
        </div>
      </Screen>
    );
  }

  const price = priceFor(b, r, bk.hours, bk.addOnIds);

  return (
    <Screen>
      <TopBar title={`#${bk.ref}`} subtitle={r.name} back="/provider/bookings" />
      <main className="px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusPill status={bk.status} />
          <PaymentPill status={bk.payment} />
        </div>

        <div className="mt-4 rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <img
              src={bk.customerAvatar}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{bk.customer}</p>
              <p className="truncate text-xs text-muted-foreground">{bk.customerRole}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-text2">
              <Users size={13} /> {bk.people}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
            <Detail label="Date" value={formatDate(bk.date)} />
            <Detail label="Time" value={`${formatTime(bk.start)} – ${formatTime(bk.end)}`} />
            <Detail label="Duration" value={`${bk.hours} hrs`} />
            <Detail label="Purpose" value={bk.purpose} />
            <Detail label="Room" value={r.name} />
            <Detail label="Value" value={inr(bk.amount)} />
          </dl>
          {bk.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-xs text-text2">{bk.notes}</p>
          ) : null}
        </div>

        <h2 className="mt-6 text-[17px]">Progress</h2>
        <div className="mt-3 rounded-3xl border border-border bg-card p-4">
          <BookingTimeline status={bk.status} />
        </div>

        <h2 className="mt-6 text-[17px]">Payout</h2>
        <div className="mt-3">
          <PriceBreakdownCard p={price} compact />
        </div>

        <div className="mt-6 space-y-2">
          <Link to="/messages" className="block">
            <Btn variant="outline" className="w-full">
              <MessageCircle size={15} className="mr-1.5" /> Message {bk.customer.split(" ")[0]}
            </Btn>
          </Link>
          <Link to="/provider/availability" className="block">
            <Btn variant="ghost" className="w-full">
              Block or adjust this room's calendar
            </Btn>
          </Link>
        </div>
      </main>
    </Screen>
  );
}
