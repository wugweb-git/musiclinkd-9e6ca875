import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Detail, EmptyState, PriceBreakdownCard, StickyBar } from "@/components/ml/booking";
import {
  declineReasons,
  formatDate,
  formatTime,
  getBookable,
  getResource,
  inr,
  priceFor,
  providerRequests,
} from "@/data/booking";

export const Route = createFileRoute("/provider/bookings/requests/$ref")({
  head: () => ({
    meta: [
      { title: "Review booking request — MusicLinkd" },
      {
        name: "description",
        content:
          "See who's asking, what they need and what you'd earn, then accept, propose a new time or decline.",
      },
      { property: "og:title", content: "Review booking request — MusicLinkd" },
      {
        property: "og:description",
        content: "Accept, counter-offer or decline an incoming session request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestReview,
});

function RequestReview() {
  const { ref } = Route.useParams();
  const bk = providerRequests.find((x) => x.ref === ref);
  const b = getBookable(bk?.bookableId ?? "");
  const r = getResource(b, bk?.resourceId);
  const [decision, setDecision] = useState<"none" | "declining" | "accepted" | "declined">("none");

  if (!bk || !b || !r) {
    return (
      <Screen>
        <TopBar title="Request" back="/provider/bookings" />
        <div className="px-5 pt-4">
          <EmptyState
            title="Request no longer available"
            body="It was withdrawn or already handled."
            action={<BtnLink to="/provider/bookings">Back to Requests</BtnLink>}
          />
        </div>
      </Screen>
    );
  }

  const price = priceFor(b, r, bk.hours, bk.addOnIds);

  if (decision === "accepted" || decision === "declined") {
    return (
      <Screen>
        <TopBar title="Request" back="/provider/bookings" />
        <main className="px-5 pt-6">
          <div className="rounded-lg bg-subtle p-5">
            <p className="font-semibold">
              {decision === "accepted" ? "Request accepted" : "Request declined"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {decision === "accepted"
                ? `${bk.customer} has been notified and the slot is now blocked on your calendar.`
                : `${bk.customer} has been notified and the slot stays open for other bookings.`}
            </p>
            <BtnLink to="/provider/bookings" className="mt-4 w-full">
              Back to Workspace
            </BtnLink>
          </div>
        </main>
      </Screen>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-32">
      <TopBar title={`Request #${bk.ref}`} subtitle={r.name} back="/provider/bookings" />
      <main className="px-5 pt-4">
        <div className="rounded-lg bg-subtle p-4">
          <div className="flex items-center gap-3">
            <img
              src={bk.customerAvatar}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold">{bk.customer}</p>
              <p className="truncate text-1 text-muted-foreground">{bk.customerRole}</p>
            </div>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-1 font-semibold text-muted-foreground">
            <ShieldCheck size={12} /> Verified profile · 4 past sessions
          </p>
        </div>

        <div className="mt-3 rounded-lg bg-subtle p-4">
          <dl className="grid grid-cols-2 gap-3 text-1">
            <Detail label="Date" value={formatDate(bk.date)} />
            <Detail label="Time" value={`${formatTime(bk.start)} – ${formatTime(bk.end)}`} />
            <Detail label="Duration" value={`${bk.hours} hrs`} />
            <Detail label="People" value={`${bk.people}`} />
            <Detail label="Purpose" value={bk.purpose} />
            <Detail label="Add-ons" value={bk.addOnIds.length ? `${bk.addOnIds.length}` : "None"} />
          </dl>
          {bk.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-1 text-muted-foreground">
              "{bk.notes}"
            </p>
          ) : null}
        </div>

        <h2 className="mt-6 text-2">What you'd earn</h2>
        <div className="mt-3">
          <PriceBreakdownCard p={price} compact />
        </div>

        <BtnLink to="/messages" variant="outline" className="mt-3 w-full">
          <MessageCircle size={16} className="mr-1.5" /> Ask a Question First
        </BtnLink>

        <Btn variant="ghost" className="mt-2 w-full" onClick={() => setDecision("declining")}>
          Propose a Different Time or Decline
        </Btn>

        {decision === "declining" ? (
          <div className="mt-3 rounded-lg bg-subtle p-4">
            <p className="text-sm font-semibold">Reason</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {declineReasons.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setDecision("declined")}
                  className="min-h-10 rounded-full border border-border px-3 text-1 font-semibold"
                >
                  {x}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDecision("none")}
              className="mt-3 min-h-10 text-1 font-bold text-muted-foreground"
            >
              Keep request
            </button>
          </div>
        ) : null}
      </main>

      <StickyBar
        price={inr(price.total)}
        hint="Respond within 12 hrs to keep your response rate"
        primaryLabel="Accept request"
        onPrimary={() => setDecision("accepted")}
      />
    </div>
  );
}
