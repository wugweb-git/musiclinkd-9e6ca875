import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, Loading, Tag } from "@/components/ml/kit";
import { BusinessOnlyGate } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { answerBooking, listStudioBookings, type BookingRequest } from "@/lib/bookings.functions";
import { availabilityConflicts, findConflicts } from "@/lib/booking-overlaps";
import { getMyStudio } from "@/lib/studio-owner.functions";
import { getStudioCalendar } from "@/lib/studio-calendar.functions";
import { formatDate, formatTime, isoDate } from "@/data/booking";
import { joinParts } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/services/conflicts")({
  head: () => ({
    meta: [
      { title: "Booking conflicts | MusicLinkd" },
      {
        name: "description",
        content:
          "Double bookings and overlaps across your services, with the quickest way to resolve each one.",
      },
      { property: "og:title", content: "Booking conflicts | MusicLinkd" },
      { property: "og:description", content: "Overlapping sessions and how to resolve them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conflicts,
});

function requesterName(b: BookingRequest) {
  return b.requester?.display_name ?? b.requester?.username ?? b.requester_name ?? "Someone";
}

function Conflicts() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <ConflictsContent />
    </BusinessOnlyGate>
  );
}

function ConflictsContent() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const load = useServerFn(listStudioBookings);
  const answer = useServerFn(answerBooking);

  const q = useQuery({ queryKey: ["studio-bookings"], queryFn: () => load() });
  const conflicts = findConflicts(q.data ?? []).filter(
    (c) => !dismissed.includes(`${c.a.id}:${c.b.id}`),
  );
  // The studio's weekly hours and blackout days, for requests its calendar doesn't allow.
  const loadStudio = useServerFn(getMyStudio);
  const studio = useQuery({
    queryKey: ["business", "studio", "mine"],
    queryFn: () => loadStudio(),
  });
  const slug = studio.data?.slug;
  const loadCalendar = useServerFn(getStudioCalendar);
  const calendar = useQuery({
    queryKey: ["studio-calendar", slug, "rules"],
    queryFn: () => loadCalendar({ data: { slug: slug! } }),
    enabled: !!slug,
  });
  const outside = calendar.data
    ? availabilityConflicts(q.data ?? [], calendar.data, isoDate(new Date())).filter(
        (c) => !dismissed.includes(c.booking.id),
      )
    : [];

  const offerAnotherTime = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      answer({ data: { id, status: "reviewing", reply } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["studio-bookings"] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  return (
    <Screen>
      <TopBar
        title="Conflicts"
        subtitle="Overlaps across your services"
        back="/services/availability"
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-foreground">
              <AlertTriangle size={iconSize.md} />
            </span>
            <p className="text-1 text-muted-foreground">
              Conflicts do not cancel anything on their own. Nothing changes until you pick an
              option below.
            </p>
          </div>
        </Card>

        {q.isLoading ? (
          <Loading rows={2} />
        ) : conflicts.length || outside.length ? (
          <div className="space-y-3">
            {conflicts.map((c) => {
              const pairId = `${c.a.id}:${c.b.id}`;
              return (
                <Card key={pairId}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{formatDate(c.a.session_date)}</p>
                      <p className="mt-1 text-1 text-muted-foreground">
                        {requesterName(c.a)}{" "}
                        {joinParts(formatTime(c.a.start_time!.slice(0, 5)), c.a.room?.name ?? "")}{" "}
                        overlaps {requesterName(c.b)}{" "}
                        {joinParts(formatTime(c.b.start_time!.slice(0, 5)), c.b.room?.name ?? "")}
                      </p>
                    </div>
                    <Tag>Double booking</Tag>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Btn
                      variant="outline"
                      className="flex-1"
                      loading={offerAnotherTime.isPending}
                      onClick={() =>
                        offerAnotherTime.mutate({
                          id: c.b.id,
                          reply:
                            "This slot double-books with another session — could you offer another time?",
                        })
                      }
                    >
                      Offer Another Time
                    </Btn>
                    <Btn
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setDismissed((p) => [...p, pairId])}
                    >
                      Keep Both
                    </Btn>
                  </div>
                </Card>
              );
            })}
            {outside.map(({ booking: b, kind, detail }) => (
              <Card key={`${kind}:${b.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{formatDate(b.session_date)}</p>
                    <p className="mt-1 text-1 text-muted-foreground">
                      {requesterName(b)}{" "}
                      {joinParts(
                        b.start_time ? formatTime(b.start_time.slice(0, 5)) : "",
                        b.room?.name ?? "",
                      )}{" "}
                      {detail}
                    </p>
                  </div>
                  <Tag>{kind}</Tag>
                </div>
                <div className="mt-3 flex gap-2">
                  <Btn
                    variant="outline"
                    className="flex-1"
                    loading={offerAnotherTime.isPending}
                    onClick={() =>
                      offerAnotherTime.mutate({
                        id: b.id,
                        reply:
                          kind === "Outside your hours"
                            ? "This time is outside our opening hours — could you pick another time?"
                            : "We're closed that day — could you pick another day?",
                      })
                    }
                  >
                    Offer Another Time
                  </Btn>
                  <Btn
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setDismissed((p) => [...p, b.id])}
                  >
                    Keep It
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No conflicts" body="Your calendar is clean." />
        )}

        <BtnLink to="/services/availability" variant="outline" className="w-full">
          <CalendarClock size={iconSize.sm} className="mr-2 inline" aria-hidden />
          Adjust Availability
        </BtnLink>
      </div>
    </Screen>
  );
}
