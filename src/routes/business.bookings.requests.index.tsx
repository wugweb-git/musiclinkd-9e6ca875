import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Btn, BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { BusinessOnlyGate, Segmented } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { BookingSkeleton, BookingStatusPill, EmptyState } from "@/components/ml/booking";
import { formatDate, formatTime, type BookingStatus } from "@/data/booking";
import { answerBooking, listStudioBookings } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/business/bookings/requests/")({
  head: () => ({
    meta: [
      { title: "Booking requests — MusicLinkd provider" },
      {
        name: "description",
        content:
          "Every incoming booking request for your space in one queue: new, in review and needs a reply, with the session details you need to decide.",
      },
      { property: "og:title", content: "Booking requests — MusicLinkd provider" },
      {
        property: "og:description",
        content: "Review, accept or decline incoming session requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Requests,
});

const tabs = ["All", "New", "In review"] as const;

/** The requests people have sent to studios this account owns, and the reply to each. */
function Requests() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <RequestsContent />
    </BusinessOnlyGate>
  );
}

function RequestsContent() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const { signedIn, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listStudioBookings);
  const answer = useServerFn(answerBooking);

  const q = useQuery({
    queryKey: ["studio-bookings"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const reply = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "reviewing" | "confirmed" | "declined" | "completed";
    }) => answer({ data: { id, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["studio-bookings"] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  const all = q.data ?? [];
  const waiting = all.filter((b) => ["requested", "reviewing"].includes(b.status));
  const list = all.filter((b) =>
    tab === "All" ? true : tab === "New" ? b.status === "requested" : b.status === "reviewing",
  );

  return (
    <Screen>
      <TopBar
        title="Requests"
        subtitle={
          waiting.length ? `${waiting.length} awaiting your reply` : "Requests for your space"
        }
        back="/business/bookings"
      />

      <div className="px-5 pt-4">
        <Segmented value={tab} options={tabs} onChange={setTab} />
      </div>

      <main className="space-y-3 px-5 pt-4">
        {!signedIn && !authLoading ? (
          <EmptyState
            title="Sign in to see requests"
            body="Requests for a space you run appear here."
          />
        ) : q.isLoading ? (
          <BookingSkeleton rows={3} />
        ) : list.length === 0 ? (
          <EmptyState
            title="No requests here"
            body="New booking requests for your space will appear in this queue. Keep your availability up to date so people can find open dates."
          />
        ) : (
          list.map((b) => (
            <article key={b.id} className="rounded-lg bg-subtle p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {b.requester?.username ? (
                    <Link
                      to="/profile/$username"
                      params={{ username: b.requester.username }}
                      className="truncate text-2 font-semibold"
                    >
                      {b.requester.display_name ?? b.requester.username}
                    </Link>
                  ) : (
                    <p className="truncate text-2 font-semibold">Someone</p>
                  )}
                  <p className="mt-0.5 truncate text-1 text-muted-foreground">
                    {joinParts(b.studio?.name ?? b.studio_name ?? "", b.room?.name ?? "")}
                  </p>
                </div>
                <BookingStatusPill
                  status={(b.status === "declined" ? "rejected" : b.status) as BookingStatus}
                />
              </div>

              <p className="mt-2 text-1 text-muted-foreground">
                {joinParts(
                  formatDate(b.session_date),
                  b.start_time ? formatTime(b.start_time.slice(0, 5)) : "",
                  b.hours ? `${b.hours} hrs` : "",
                  b.people ? `${b.people} people` : "",
                )}
              </p>
              {b.notes ? <p className="mt-2 text-1 leading-relaxed">{b.notes}</p> : null}

              {/* Accepting happens on the review screen, which shows clashing requests and answers
                  them with a saved reply; accepting from here could double-book a slot. */}
              {["requested", "reviewing"].includes(b.status) ? (
                <div className="mt-3 flex gap-2">
                  {b.status === "requested" ? (
                    <Btn
                      variant="outline"
                      className="min-h-10 flex-1 text-1"
                      loading={reply.isPending}
                      onClick={() => reply.mutate({ id: b.id, status: "reviewing" })}
                    >
                      Reviewing
                    </Btn>
                  ) : null}
                  <BtnLink
                    to="/business/bookings/requests/$ref"
                    params={{ ref: b.id }}
                    className="min-h-10 flex-1 text-1"
                  >
                    Review
                  </BtnLink>
                </div>
              ) : null}
            </article>
          ))
        )}
      </main>
    </Screen>
  );
}
