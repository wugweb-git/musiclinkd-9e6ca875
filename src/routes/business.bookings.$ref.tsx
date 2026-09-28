import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Users } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { useMessagePerson } from "@/hooks/use-message-person";
import {
  BusinessOnlyGate,
  EmptyState,
  LoadError,
  Loading,
  StatusPill,
  type Tone,
} from "@/components/ml/kit";
import { Detail } from "@/components/ml/booking";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { getBookingRequest, type BookingStatus } from "@/lib/bookings.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/business/bookings/$ref")({
  head: () => ({
    meta: [
      { title: "Session detail — MusicLinkd provider" },
      {
        name: "description",
        content: "Everything you need to run the session: customer, room and timing.",
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

const statusTone: Record<BookingStatus, Tone> = {
  requested: "warn",
  reviewing: "warn",
  confirmed: "good",
  declined: "neutral",
  cancelled: "neutral",
  completed: "neutral",
};
const statusLabel: Record<BookingStatus, string> = {
  requested: "Requested",
  reviewing: "Reviewing",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
function formatTime(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${m} ${period}`;
}

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
  const message = useMessagePerson();
  const load = useServerFn(getBookingRequest);
  const q = useQuery({
    queryKey: ["booking", ref],
    queryFn: () => load({ data: { id: ref } }),
  });

  if (q.isError) {
    return (
      <Screen>
        <TopBar title="Session" back="/business/bookings" />
        <div className="px-5 pt-6">
          <LoadError what="this booking" />
        </div>
      </Screen>
    );
  }

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Session" back="/business/bookings" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }

  const bk = q.data;
  if (!bk) {
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

  const customerName =
    bk.requester?.display_name ?? bk.requester?.username ?? bk.requester_name ?? "Someone";

  return (
    <Screen>
      <TopBar
        title="Session"
        subtitle={bk.room?.name ?? bk.studio?.name ?? bk.studio_name ?? "Studio"}
        back="/business/bookings"
      />
      <main className="px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={statusLabel[bk.status]} tone={statusTone[bk.status]} />
        </div>

        <div className="mt-4 rounded-lg bg-subtle p-4">
          <div className="flex items-center gap-3">
            {bk.requester?.avatar_url ? (
              <img
                src={bk.requester.avatar_url}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span aria-hidden className="h-12 w-12 shrink-0 rounded-full bg-background" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{customerName}</p>
            </div>
            {bk.people ? (
              <span className="inline-flex items-center gap-1 text-1 text-muted-foreground">
                <Users size={iconSize.xs} /> {bk.people}
              </span>
            ) : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-1">
            <Detail label="Date" value={formatDate(bk.session_date)} />
            <Detail
              label="Time"
              value={
                bk.start_time
                  ? `${formatTime(bk.start_time)} – ${formatTime(bk.end_time)}`
                  : "Not set"
              }
            />
            {bk.hours ? <Detail label="Duration" value={`${bk.hours} hrs`} /> : null}
            {bk.purpose ? <Detail label="Purpose" value={bk.purpose} /> : null}
            {bk.room ? <Detail label="Room" value={bk.room.name} /> : null}
          </dl>
          {bk.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-1 text-muted-foreground">
              {bk.notes}
            </p>
          ) : null}
          {bk.reply ? (
            <p className="mt-3 border-t border-border pt-3 text-1">
              <span className="font-semibold">Your reply: </span>
              {bk.reply}
            </p>
          ) : null}
        </div>

        <div className="mt-6 space-y-2">
          {bk.requester ? (
            <Btn
              variant="outline"
              className="w-full"
              loading={message.pending}
              onClick={() => bk.requester && void message.open(bk.requester.id)}
            >
              <MessageCircle size={iconSize.sm} className="mr-1.5" /> Message{" "}
              {customerName.split(" ")[0]}
            </Btn>
          ) : null}
          <BtnLink to="/business/availability" variant="ghost" className="w-full">
            Block or Adjust This Room's Calendar
          </BtnLink>
        </div>
      </main>
    </Screen>
  );
}
