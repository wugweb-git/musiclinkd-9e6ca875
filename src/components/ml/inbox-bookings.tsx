import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Btn, BtnLink } from "@/components/ml/ui";
import { EmptyState, LoadError, Segmented } from "@/components/ml/kit";
import { BookingRecord, BookingSkeleton } from "@/components/ml/booking";
import { answerBooking, listBookableBookings } from "@/lib/bookings.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

/*
 * Booking requests for what you provide — your place, your services, and services of bands you
 * manage — the Inbox's Booking Requests tab (owner, 4 Oct 2026, queue item 10). Booking state is
 * its own machine, shown as it is stored (labels only): Requested, Reviewing, Confirmed, Declined,
 * Cancelled, Completed. It was /business/bookings/requests, behind a business-only gate that hid a
 * talent's own service bookings, which the list already read.
 */
const tabs = ["requested", "reviewing", "confirmed", "declined", "cancelled", "completed"] as const;
type Tab = (typeof tabs)[number];
const tabLabels: Record<Tab, string> = {
  requested: "Requested",
  reviewing: "Reviewing",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function BookingRequestsPanel() {
  const [tab, setTab] = useState<Tab>("requested");
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
  const list = all.filter((b) => b.status === tab);

  return (
    <>
      <div className="px-5 pt-4">
        <Segmented value={tab} options={tabs} labels={tabLabels} onChange={setTab} />
        {waiting.length ? (
          <p className="mt-2 text-1 text-muted-foreground">{waiting.length} awaiting your reply</p>
        ) : null}
      </div>

      <main className="space-y-3 px-5 pt-4 pb-8">
        {!signedIn && !authLoading ? (
          <EmptyState
            icon={<CalendarDays size={iconSize.lg} aria-hidden />}
            title="Sign in to see requests"
            body="Requests for what you offer appear here."
          />
        ) : q.isLoading ? (
          <BookingSkeleton rows={3} />
        ) : q.isError ? (
          <LoadError what="your requests" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={iconSize.lg} aria-hidden />}
            title="No requests here"
            body="Booking requests for your services appear in this queue."
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
    </>
  );
}
