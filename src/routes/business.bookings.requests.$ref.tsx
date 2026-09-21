import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { BusinessOnlyGate, EmptyState, Loading, SegmentedField } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { Detail, StickyBar } from "@/components/ml/booking";
import { answerBooking, getBookingRequest, listStudioBookings } from "@/lib/bookings.functions";
import { waitingAlongside } from "@/lib/booking-overlaps";
import { bookingReplies } from "@/data/booking";
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

const OTHERS_CHOICES = ["Decline them", "Leave them waiting"] as const;

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
  const [reply, setReply] = useState("");
  // Requests don't hold their slot: the others who asked for this time are answered here too.
  const loadAll = useServerFn(listStudioBookings);
  const all = useQuery({ queryKey: ["studio-bookings"], queryFn: () => loadAll() });
  const others = q.data ? waitingAlongside(q.data, all.data ?? []) : [];
  const [othersChoice, setOthersChoice] = useState<(typeof OTHERS_CHOICES)[number]>(
    OTHERS_CHOICES[0],
  );
  const [takenReply, setTakenReply] = useState<string>(bookingReplies.taken[0]);

  async function respond(status: "confirmed" | "declined") {
    setDecision("sending");
    try {
      await answer({ data: { id: ref, status, ...(reply.trim() ? { reply: reply.trim() } : {}) } });
      if (status === "confirmed" && others.length && othersChoice === OTHERS_CHOICES[0]) {
        await Promise.all(
          others.map((o) =>
            answer({ data: { id: o.id, status: "declined", reply: takenReply.trim() } }),
          ),
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["booking", ref] });
      await queryClient.invalidateQueries({ queryKey: ["business", "bookings", "mine"] });
      toast.success(status === "confirmed" ? "Request accepted" : "Request declined");
      // Back to the fresh status, so the screen shows it was handled and can't be answered twice.
      setDecision("none");
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

        <div className="mt-3 rounded-lg bg-subtle p-4">
          <label htmlFor="booking-reply" className="text-sm font-semibold">
            Reply
          </label>
          <div className="rail mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            {bookingReplies[decision === "declining" ? "declined" : "confirmed"].map((r) => (
              <Chip key={r} active={reply === r} onClick={() => setReply(r)}>
                {r}
              </Chip>
            ))}
          </div>
          <textarea
            id="booking-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Optional. Sent with your answer."
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none"
          />
        </div>

        {others.length ? (
          <div className="mt-3 rounded-lg bg-subtle p-4">
            <p className="text-sm font-semibold">
              {others.length} {others.length === 1 ? "other asks" : "others ask"} for this time
            </p>
            <ul className="mt-1 space-y-0.5 text-1 text-muted-foreground">
              {others.map((o) => (
                <li key={o.id}>
                  {o.requester?.display_name ??
                    o.requester?.username ??
                    o.requester_name ??
                    "Someone"}{" "}
                  · {formatTime(o.start_time)} – {formatTime(o.end_time)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-1 text-muted-foreground">When you accept this one:</p>
            <div className="mt-2">
              <SegmentedField
                label="When you accept this one"
                value={othersChoice}
                options={OTHERS_CHOICES}
                onChange={setOthersChoice}
              />
            </div>
            {othersChoice === OTHERS_CHOICES[0] ? (
              <div className="rail mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {bookingReplies.taken.map((r) => (
                  <Chip key={r} active={takenReply === r} onClick={() => setTakenReply(r)}>
                    {r}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <Btn
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => {
            setReply("");
            setDecision(decision === "declining" ? "none" : "declining");
          }}
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
