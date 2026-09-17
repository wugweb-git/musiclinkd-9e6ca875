import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/market";
import { Loading } from "@/components/ml/kit";
import { BookingCard, RealBookingCard } from "@/components/ml/rental";
import { bookings, equipmentById, providerById, type RentalStatus } from "@/data/rentals";
import { listMyRentalBookings } from "@/lib/rentals.functions";
import { useAuth } from "@/hooks/use-auth";
import { TextLink } from "@/components/ml/links";

const tabs = ["Upcoming", "Active", "Completed", "Cancelled"] as const;

/** Real statuses don't carry a bucket the way seed bookings do — derive the same grouping. */
function bucketOf(status: RentalStatus): (typeof tabs)[number] {
  if (status === "Active") return "Active";
  if (status === "Completed") return "Completed";
  if (status === "Cancelled" || status === "Declined") return "Cancelled";
  return "Upcoming";
}

export const Route = createFileRoute("/marketplace/rent/mine")({
  head: () => ({
    meta: [
      { title: "My Rentals | MusicLinkd" },
      {
        name: "description",
        content: "Track upcoming, active, completed and cancelled equipment rentals in one place.",
      },
      { property: "og:title", content: "My Rentals | MusicLinkd" },
      { property: "og:description", content: "Your rental bookings, returns and reviews." },
    ],
  }),
  component: MyRentals,
});

function MyRentals() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");
  const { signedIn } = useAuth();
  const load = useServerFn(listMyRentalBookings);
  const q = useQuery({
    queryKey: ["rental-bookings", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const real = (q.data ?? []).filter((b) => bucketOf(b.status) === tab);
  const list = bookings.filter((b) => b.bucket === tab);
  const empty = list.length === 0 && real.length === 0;

  const countOf = (bucket: (typeof tabs)[number]) =>
    (q.data ?? []).filter((b) => bucketOf(b.status) === bucket).length +
    bookings.filter((b) => b.bucket === bucket).length;

  return (
    <Screen>
      <TopBar
        title="My rentals"
        subtitle={`${countOf("Active")} active · ${countOf("Upcoming")} upcoming`}
        back="/marketplace/rent"
        right={
          <TextLink to="/marketplace/rent/listings" className="shrink-0 text-1">
            Listings
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
        {signedIn && q.isLoading ? <Loading rows={2} /> : null}
        {real.map((b) => (
          <RealBookingCard
            key={b.id}
            title={b.listingTitle ?? "Rental"}
            photo={b.listingPhoto}
            status={b.status}
            startDate={b.startDate}
            endDate={b.endDate}
            fulfilment={b.fulfilment}
            totalPaise={b.totalPaise}
            action={
              <Link to="/marketplace/rent/active/$id" params={{ id: b.id }}>
                <Chip>View</Chip>
              </Link>
            }
          />
        ))}
        {empty ? (
          <EmptyState
            emoji="📭"
            title={`No ${tab.toLowerCase()} rentals`}
            body="When you rent equipment through MusicLinkd, it will appear here with dates, deposits and return reminders."
            action={<BtnLink to="/marketplace/rent">Explore Equipment</BtnLink>}
          />
        ) : (
          list.map((b) => {
            const e = equipmentById(b.equipmentId)!;
            const p = providerById(e.providerId)!;
            return (
              <BookingCard
                key={b.id}
                b={b}
                e={e}
                provider={p}
                action={
                  <>
                    <Link to="/marketplace/rent/active/$id" params={{ id: b.id }}>
                      <Chip>View</Chip>
                    </Link>
                    <Link to="/messages">
                      <Chip>Message</Chip>
                    </Link>
                    {b.bucket === "Active" ? (
                      <>
                        <Link to="/marketplace/rent/active/$id" params={{ id: b.id }}>
                          <Chip>Extend</Chip>
                        </Link>
                        <Link to="/marketplace/rent/active/$id" params={{ id: b.id }}>
                          <Chip>Return</Chip>
                        </Link>
                      </>
                    ) : null}
                    {b.bucket === "Completed" ? (
                      <Link to="/marketplace/rent/active/$id" params={{ id: b.id }}>
                        <Chip>Review</Chip>
                      </Link>
                    ) : null}
                  </>
                }
              />
            );
          })
        )}
      </div>
    </Screen>
  );
}
