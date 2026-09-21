import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { BusinessOnlyGate, EmptyState, Loading } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { Detail, StickyBar } from "@/components/ml/booking";
import { answerBooking, getBookingRequest } from "@/lib/bookings.functions";
import { iconSize } from "@/lib/tokens";
import { useMessagePerson } from "@/hooks/use-message-person";

export const Route = createFileRoute("/business/bookings/requests/$ref")({
  head: () => ({
    meta: [
      { title: "Review booking request — MusicLinkd" },
      {
        name: "description",
        content: "See who's asking and what they need, then accept or decline.",
      },
      { property: "og:title", content: "Review booking request — MusicLinkd" },
      {
        property: "og:description",
        content: "Accept or decline an incoming session request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestReview,
});

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

function RequestReview() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <RequestReviewContent />
    </BusinessOnlyGate>
  );
}

function RequestReviewContent() {
  const { ref } = Route.useParams();
  const queryClient = useQueryClient();
  const load = useServerFn(getBookingRequest);
  const answer = useServerFn(answerBooking);
  const message = useMessagePerson();
  const q = useQuery({
    queryKey: ["booking", ref],
    queryFn: () => load({ data: { id: ref } }),
  });
  const [decision, setDecision] = useState<"none" | "declining" | "sending">("none");

  async function respond(status: "confirmed" | "declined") {
    setDecision("sending");
    try {
      await answer({ data: { id: ref, status } });
      await queryClient.invalidateQueries({ queryKey: ["booking", ref] });
      await queryClient.invalidateQueries({ queryKey: ["business", "bookings", "mine"] });
      toast.success(status === "confirmed" ? "Request accepted" : "Request declined");
    } catch {
      toast.error("Couldn't send that — try again");
      setDecision("none");
    }
  }

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Request" back="/business/bookings" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }

  const bk = q.data;
  if (!bk || (bk.status !== "requested" && bk.status !== "reviewing" && decision !== "sending")) {
    return (
      <Screen>
        <TopBar title="Request" back="/business/bookings" />
        <div className="px-5 pt-4">
          <EmptyState
            title={bk ? "This request was already handled" : "Request no longer available"}
            body={bk ? `Its status is now "${bk.status}".` : "It was withdrawn or already handled."}
            action={<BtnLink to="/business/bookings">Back to Requests</BtnLink>}
          />
        </div>
      </Screen>
    );
  }

  const customerName =
    bk.requester?.display_name ?? bk.requester?.username ?? bk.requester_name ?? "Someone";

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <TopBar
        title="Request"
        subtitle={bk.room?.name ?? bk.studio?.name ?? bk.studio_name ?? "Studio"}
        back="/business/bookings"
      />
      <main className="px-5 pt-4">
        <div className="rounded-lg bg-subtle p-4">
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
            <div className="min-w-0">
              <p className="truncate font-semibold">{customerName}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-subtle p-4">
          <dl className="grid grid-cols-2 gap-3 text-1">
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
            {bk.people ? <Detail label="People" value={`${bk.people}`} /> : null}
            {bk.purpose ? <Detail label="Purpose" value={bk.purpose} /> : null}
          </dl>
          {bk.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-1 text-muted-foreground">
              "{bk.notes}"
            </p>
          ) : null}
        </div>

        {bk.requester ? (
          <Btn
            variant="outline"
            className="mt-3 w-full"
            loading={message.pending}
            onClick={() => bk.requester && void message.open(bk.requester.id)}
          >
            <MessageCircle size={iconSize.sm} className="mr-1.5" /> Ask a Question First
          </Btn>
        ) : null}

        <Btn
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => setDecision(decision === "declining" ? "none" : "declining")}
        >
          Decline
        </Btn>

        {decision === "declining" ? (
          <div className="mt-3 rounded-lg bg-subtle p-4">
            <p className="text-sm font-semibold">Decline this request?</p>
            <div className="mt-3 flex gap-2">
              <Btn className="flex-1" variant="outline" onClick={() => void respond("declined")}>
                Decline
              </Btn>
              <Btn className="flex-1" variant="ghost" onClick={() => setDecision("none")}>
                Keep request
              </Btn>
            </div>
          </div>
        ) : null}
      </main>

      <StickyBar
        hint="Respond so the requester isn't left waiting"
        primaryLabel="Accept request"
        onPrimary={() => void respond("confirmed")}
      />
    </div>
  );
}
