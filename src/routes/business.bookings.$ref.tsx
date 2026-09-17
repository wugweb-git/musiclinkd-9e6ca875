import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Users } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { BusinessOnlyGate } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import {
  BookingStatusPill,
  BookingTimeline,
  Detail,
  EmptyState,
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
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/business/bookings/$ref")({
  head: () => ({
    meta: [
      { title: "Session detail — MusicLinkd provider" },
      {
        name: "description",
        content: "Everything you need to run the session: customer, room, timing, and add-ons.",
      },
      { property: "og:title", content: "Session detail — MusicLinkd provider" },
      {
        property: "og:description",
        content: "Customer, room and timing for a confirmed session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProviderBookingDetail,
});

function ProviderBookingDetail() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <ProviderBookingDetailContent />
    </BusinessOnlyGate>
  );
}

function ProviderBookingDetailContent() {
  const { ref } = Route.useParams();
  const bk = [...bookings, ...providerToday].find((x) => x.ref === ref);
  const b = getBookable(bk?.bookableId ?? "");
  const r = getResource(b, bk?.resourceId);

  if (!bk || !b || !r) {
    return (
      <Screen>
        <TopBar title="Session" back="/business/bookings" />
        <div className="px-5 pt-4">
          <EmptyState
            title="Session not found"
            body="It may have been cancelled or moved."
            action={<BtnLink to="/business/bookings">Back to Workspace</BtnLink>}
          />
        </div>
      </Screen>
    );
  }

  const price = priceFor(b, r, bk.hours, bk.addOnIds);

  return (
    <Screen>
      <TopBar title={`#${bk.ref}`} subtitle={r.name} back="/business/bookings" />
      <main className="px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusPill status={bk.status} />
        </div>

        <div className="mt-4 rounded-lg bg-subtle p-4">
          <div className="flex items-center gap-3">
            <img
              src={bk.customerAvatar}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{bk.customer}</p>
              <p className="truncate text-1 text-muted-foreground">{bk.customerRole}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-1 text-muted-foreground">
              <Users size={iconSize.xs} /> {bk.people}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-1">
            <Detail label="Date" value={formatDate(bk.date)} />
            <Detail label="Time" value={`${formatTime(bk.start)} – ${formatTime(bk.end)}`} />
            <Detail label="Duration" value={`${bk.hours} hrs`} />
            <Detail label="Purpose" value={bk.purpose} />
            <Detail label="Room" value={r.name} />
            <Detail label="Value" value={inr(bk.amount)} />
          </dl>
          {bk.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-1 text-muted-foreground">
              {bk.notes}
            </p>
          ) : null}
        </div>

        <h2 className="mt-6 text-2">Progress</h2>
        <div className="mt-3 rounded-lg bg-subtle p-4">
          <BookingTimeline status={bk.status} />
        </div>

        <h2 className="mt-6 text-2">Payout</h2>
        <div className="mt-3">
          <PriceBreakdownCard p={price} compact />
        </div>

        <div className="mt-6 space-y-2">
          <BtnLink to="/messages" variant="outline" className="w-full">
            <MessageCircle size={iconSize.sm} className="mr-1.5" /> Message{" "}
            {bk.customer.split(" ")[0]}
          </BtnLink>
          <BtnLink to="/business/availability" variant="ghost" className="w-full">
            Block or Adjust This Room's Calendar
          </BtnLink>
        </div>
      </main>
    </Screen>
  );
}
