import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Chip, BtnLink, Btn } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/market";
import { Loading } from "@/components/ml/kit";
import { EquipmentRow, RentalStatusPill } from "@/components/ml/rental";
import { equipment, equipmentById, inr, rentalNotifications, rentalRequests } from "@/data/rentals";
import { TextLink } from "@/components/ml/links";
import { useAuth } from "@/hooks/use-auth";
import {
  listMyIncomingRentalRequests,
  setRentalBookingStatus,
  type MyRentalBooking,
} from "@/lib/rentals.functions";

export const Route = createFileRoute("/marketplace/rent/listings")({
  head: () => ({
    meta: [
      { title: "My Rental Listings | MusicLinkd" },
      {
        name: "description",
        content:
          "Manage your rental listings, requests, offers and provider insights on MusicLinkd.",
      },
      { property: "og:title", content: "My Rental Listings | MusicLinkd" },
      { property: "og:description", content: "A lightweight workspace for rental providers." },
    ],
  }),
  component: MyListings,
});

const tabs = ["Active", "Requests", "Drafts", "Alerts"];
const statusBuckets = [
  "Active",
  "Reserved",
  "Currently Rented",
  "Unavailable",
  "Completed",
  "Archived",
] as const;
const tone: Record<string, string> = {
  primary: "var(--surface-subtle)",
  success: "var(--success-container)",
  warn: "var(--warn-container)",
  purple: "var(--purple-container)",
};

function MyListings() {
  const [tab, setTab] = useState(tabs[0]!);
  const [bucket, setBucket] = useState<string>("Active");
  const shown = equipment.filter((e) => e.listingStatus === bucket);
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listMyIncomingRentalRequests);
  const setStatus = useServerFn(setRentalBookingStatus);
  const q = useQuery({
    queryKey: ["rental-bookings", "incoming"],
    queryFn: () => load(),
    enabled: signedIn && tab === "Requests",
  });
  const decide = useMutation({
    mutationFn: (vars: { id: string; status: "confirmed" | "declined" }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-bookings", "incoming"] });
      toast.success("Updated.");
    },
    onError: () => toast.error("That didn't save. Try again."),
  });
  const realRequests = q.data ?? [];

  return (
    <Screen>
      <TopBar
        title="My rental listings"
        subtitle={`${equipment.length} items · 3 requests`}
        back="/marketplace/rent"
        right={
          <TextLink to="/marketplace/rent/list" className="shrink-0 text-1">
            New
          </TextLink>
        }
      />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5 pb-6">
        {tab === "Active" ? (
          <>
            <div className="rail flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {statusBuckets.map((s) => (
                <Chip key={s} active={bucket === s} onClick={() => setBucket(s)}>
                  {s}
                </Chip>
              ))}
            </div>
            {shown.length ? (
              shown.map((e) => (
                <div key={e.id}>
                  <EquipmentRow e={e} />
                  <div className="mt-1.5 flex flex-wrap gap-2 px-1 text-1 font-semibold text-muted-foreground">
                    <span
                      className="rounded-full px-2 py-1"
                      style={{ background: "var(--success-container)", color: "var(--success)" }}
                    >
                      {e.listingStatus}
                    </span>
                    <span className="rounded-full bg-background px-2 py-1">
                      {e.views} views · {e.saves} saves · {e.enquiries} enquiries
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                emoji="📦"
                title={`Nothing ${bucket.toLowerCase()}`}
                body="Listings move through drafts, review, active, reserved and completed as rentals progress."
              />
            )}
          </>
        ) : null}

        {tab === "Requests" && signedIn && q.isLoading ? <Loading rows={2} /> : null}
        {tab === "Requests"
          ? realRequests.map((r) => (
              <article key={r.id} className="rounded-lg bg-subtle p-4">
                <div className="flex items-start gap-3">
                  {r.listingPhoto ? (
                    <img
                      src={r.listingPhoto}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-sm bg-background" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-1 font-semibold">{r.listingTitle ?? "Listing"}</p>
                    <p className="truncate text-1 text-muted-foreground">
                      {new Date(r.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      –{" "}
                      {new Date(r.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {r.quantity} unit{r.quantity > 1 ? "s" : ""}
                    </p>
                    {r.totalPaise != null ? (
                      <p className="mt-1 text-1 font-semibold">{inr(Math.round(r.totalPaise / 100))}</p>
                    ) : null}
                  </div>
                  <RentalStatusPill status={r.status} />
                </div>
                {r.status === "Requested" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn
                      variant="outline"
                      className="min-h-9 px-3 text-1"
                      loading={decide.isPending}
                      onClick={() => decide.mutate({ id: r.id, status: "confirmed" })}
                    >
                      Accept
                    </Btn>
                    <Btn
                      variant="ghost"
                      className="min-h-9 px-3 text-1"
                      loading={decide.isPending}
                      onClick={() => decide.mutate({ id: r.id, status: "declined" })}
                    >
                      Decline
                    </Btn>
                    <Link to="/messages">
                      <Chip>Message</Chip>
                    </Link>
                  </div>
                ) : null}
              </article>
            ))
          : null}
        {tab === "Requests" && !q.isLoading
          ? rentalRequests.map((r) => {
              const e = equipmentById(r.equipmentId)!;
              return (
                <article key={r.id} className="rounded-lg bg-subtle p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={e.photos[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-sm object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-1 font-semibold">{e.name}</p>
                      <p className="truncate text-1 text-muted-foreground">
                        {r.renter} · {r.dates} · {r.quantity} unit
                      </p>
                      <p className="mt-1 text-1">
                        <span className="font-semibold">{inr(r.offered)}</span>
                        {r.offered !== r.asking ? (
                          <span className="text-muted-foreground">
                            {" "}
                            offered vs {inr(r.asking)} asking
                          </span>
                        ) : (
                          <span className="text-muted-foreground"> at asking price</span>
                        )}
                      </p>
                    </div>
                    <RentalStatusPill
                      status={
                        r.status === "Pending"
                          ? "Requested"
                          : r.status === "Accepted"
                            ? "Confirmed"
                            : "Declined"
                      }
                    />
                  </div>
                  {r.status === "Pending" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Chip active>Accept</Chip>
                      <Chip>Counter offer</Chip>
                      <Chip>Decline</Chip>
                      <Link to="/messages">
                        <Chip>Message</Chip>
                      </Link>
                    </div>
                  ) : null}
                </article>
              );
            })
          : null}

        {tab === "Drafts" ? (
          <EmptyState
            emoji="📝"
            title="No drafts"
            body="Start a rental listing and we'll keep it here until you publish."
            action={<BtnLink to="/marketplace/rent/list">Rent Out Equipment</BtnLink>}
          />
        ) : null}

        {tab === "Alerts"
          ? rentalNotifications.map((n) => (
              <article key={n.id} className="flex items-start gap-3 rounded-lg bg-subtle p-4">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: tone[n.tone] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-1 font-semibold">{n.title}</p>
                  <p className="text-1 text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-1 text-muted-foreground">{n.time}</span>
              </article>
            ))
          : null}
      </div>
    </Screen>
  );
}
