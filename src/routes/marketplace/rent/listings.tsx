import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Chip, BtnLink, Btn } from "@/components/ml/ui";
import { EmptyState, ProductCard, productFromRental } from "@/components/ml/market";
import { Loading } from "@/components/ml/kit";
import { RentalStatusPill } from "@/components/ml/rental";
import { inr, type RentalItem } from "@/data/rentals";
import { TextButton, TextLink } from "@/components/ml/links";
import { useAuth } from "@/hooks/use-auth";
import {
  listMyIncomingRentalRequests,
  listMyListingStandings,
  setMyListingStatus,
  setRentalBookingStatus,
  type ListingStanding,
} from "@/lib/rentals.functions";
import { listRentalNotifications } from "@/lib/notifications.functions";
import { loadMyCatalogRentals } from "@/lib/market-view";

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
type Bucket = (typeof statusBuckets)[number];

const ACTIVE: ListingStanding = { stored: "active", rented: false, reserved: false, completed: 0 };

/**
 * The one bucket a listing sits in. The owner's own Unavailable or Archived comes first; otherwise
 * its bookings say whether it is out with someone (Currently Rented) or promised (Reserved).
 */
function bucketOf(s: ListingStanding): Bucket {
  if (s.stored === "archived") return "Archived";
  if (s.stored === "unavailable") return "Unavailable";
  if (s.rented) return "Currently Rented";
  if (s.reserved) return "Reserved";
  return "Active";
}

/** Completed is history, not a state: any listing with a finished rental is listed there too. */
const inBucket = (s: ListingStanding, bucket: string) =>
  bucket === "Completed" ? s.completed > 0 : bucketOf(s) === bucket;

function MyListings() {
  const [tab, setTab] = useState(tabs[0]!);
  const [bucket, setBucket] = useState<string>("Active");
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

  const myListings = useQuery({
    queryKey: ["marketplace", "mine", "rentals"],
    queryFn: loadMyCatalogRentals,
    enabled: signedIn && tab === "Active",
  });
  const loadStandings = useServerFn(listMyListingStandings);
  const standings = useQuery({
    queryKey: ["marketplace", "mine", "standings"],
    queryFn: () => loadStandings(),
    enabled: signedIn && tab === "Active",
  });
  const standingOf = (e: RentalItem) => (e.dbId && standings.data?.[e.dbId]) || ACTIVE;
  const realListings: RentalItem[] = (myListings.data ?? []).filter((e) =>
    inBucket(standingOf(e), bucket),
  );
  const listingsLoading = signedIn && (myListings.isLoading || standings.isLoading);

  // The owner takes a listing out of browsing, or puts it back.
  const saveStatus = useServerFn(setMyListingStatus);
  const changeStatus = useMutation({
    mutationFn: (vars: { id: string; status: "active" | "unavailable" | "archived" }) =>
      saveStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "mine", "standings"] });
      toast.success("Updated.");
    },
    onError: () => toast.error("That didn't save. Try again."),
  });

  // Requests, answers and cancellations on rentals, as notified (notifications, rental_* kinds).
  const loadAlerts = useServerFn(listRentalNotifications);
  const alerts = useQuery({
    queryKey: ["notifications", "rentals"],
    queryFn: () => loadAlerts(),
    enabled: signedIn && tab === "Alerts",
  });

  return (
    <Screen>
      <TopBar
        title="My rental listings"
        subtitle={`${myListings.data?.length ?? 0} items · ${realRequests.length} requests`}
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
            {listingsLoading ? <Loading rows={2} /> : null}
            <div className="grid grid-cols-2 gap-3">
              {realListings.map((e) => {
                const standing = standingOf(e);
                const state = bucketOf(standing);
                const set = (status: "active" | "unavailable" | "archived") =>
                  e.dbId && changeStatus.mutate({ id: e.dbId, status });
                return (
                  <div key={e.id}>
                    <ProductCard item={productFromRental(e)} />
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 px-1 text-1 font-semibold text-muted-foreground">
                      <span
                        className="rounded-full bg-subtle px-2 py-1"
                        style={
                          state === "Active"
                            ? { background: "var(--success-container)", color: "var(--success)" }
                            : undefined
                        }
                      >
                        {bucket === "Completed" ? `${standing.completed} completed` : state}
                      </span>
                      {standing.stored === "archived" ? (
                        <TextButton disabled={changeStatus.isPending} onClick={() => set("active")}>
                          Restore
                        </TextButton>
                      ) : (
                        <>
                          <TextButton
                            disabled={changeStatus.isPending}
                            onClick={() =>
                              set(standing.stored === "unavailable" ? "active" : "unavailable")
                            }
                          >
                            {standing.stored === "unavailable" ? "Available" : "Unavailable"}
                          </TextButton>
                          <TextButton
                            disabled={changeStatus.isPending}
                            onClick={() => set("archived")}
                          >
                            Archive
                          </TextButton>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {realListings.length === 0 && !listingsLoading ? (
              <EmptyState
                emoji="📦"
                title={`Nothing ${bucket.toLowerCase()}`}
                body="Listings move through drafts, review, active, reserved and completed as rentals progress."
              />
            ) : null}
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
                      <p className="mt-1 text-1 font-semibold">
                        {inr(Math.round(r.totalPaise / 100))}
                      </p>
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
        {tab === "Requests" && !q.isLoading && realRequests.length === 0 ? (
          <EmptyState
            emoji="📨"
            title="No requests yet"
            body="Requests from renters wait here for you to accept or decline."
          />
        ) : null}

        {tab === "Drafts" ? (
          <EmptyState
            emoji="📝"
            title="No drafts"
            body="Start a rental listing and we'll keep it here until you publish."
            action={<BtnLink to="/marketplace/rent/list">Rent Out Equipment</BtnLink>}
          />
        ) : null}

        {tab === "Alerts" && signedIn && alerts.isLoading ? <Loading rows={2} /> : null}
        {tab === "Alerts"
          ? (alerts.data ?? []).map((n) => (
              <Link
                key={n.id}
                to={n.href ?? "/marketplace/rent/listings"}
                className="block rounded-lg bg-subtle p-4"
              >
                <p className="text-1 font-semibold">{n.title}</p>
                {n.body ? (
                  <p className="mt-0.5 line-clamp-2 text-1 text-muted-foreground">{n.body}</p>
                ) : null}
                <p className="mt-1 text-1 text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </Link>
            ))
          : null}
        {tab === "Alerts" && !alerts.isLoading && !alerts.data?.length ? (
          <EmptyState
            emoji="🔔"
            title="No alerts yet"
            body="You're told here when a renter requests, confirms or returns."
          />
        ) : null}
      </div>
    </Screen>
  );
}
