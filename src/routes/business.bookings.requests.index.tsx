import { iconSize } from "@/lib/tokens";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Btn, BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { BusinessOnlyGate, LoadError, Segmented, EmptyState } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { BookingSkeleton, BookingRecord } from "@/components/ml/booking";
import { answerBooking, listBookableBookings } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";

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

const tabs = ["all", "new", "reviewing"] as const;
const tabLabels: Record<(typeof tabs)[number], string> = {
  all: "All",
  new: "New",
  reviewing: "In review",
};

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
  const [tab, setTab] = useState<(typeof tabs)[number]>("all");
  const { signedIn, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listBookableBookings);
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
    tab === "all" ? true : tab === "new" ? b.status === "requested" : b.status === "reviewing",
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
        <Segmented value={tab} options={tabs} labels={tabLabels} onChange={setTab} />
      </div>

      <main className="space-y-3 px-5 pt-4">
        {!signedIn && !authLoading ? (
          <EmptyState
            icon={<CalendarDays size={iconSize.lg} aria-hidden />}
            title="Sign in to see requests"
            body="Requests for a space you run appear here."
          />
        ) : q.isLoading ? (
          <BookingSkeleton rows={3} />
        ) : q.isError ? (
          <LoadError what="your requests" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={iconSize.lg} aria-hidden />}
            title="No requests here"
            body="New booking requests for your space will appear in this queue. Keep your availability up to date so people can find open dates."
          />
        ) : (
          list.map((b) => (
            // Accepting happens on the review screen, which shows clashing requests and answers
            // them with a saved reply; accepting from here could double-book a slot.
            <BookingRecord
              key={b.id}
              b={b}
              side="studio"
              actions={
                b.status === "requested" || b.status === "reviewing" ? (
                  <>
                    {b.status === "requested" ? (
                      <Btn
                        variant="outline"
                        className="flex-1"
                        loading={reply.isPending && reply.variables?.id === b.id}
                        onClick={() => reply.mutate({ id: b.id, status: "reviewing" })}
                      >
                        Reviewing
                      </Btn>
                    ) : null}
                    <BtnLink
                      to="/business/bookings/requests/$ref"
                      params={{ ref: b.id }}
                      className="flex-1"
                    >
                      Review
                    </BtnLink>
                  </>
                ) : undefined
              }
            />
          ))
        )}
      </main>
    </Screen>
  );
}
