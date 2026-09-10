import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Chip, Btn } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/market";
import { BookingCard } from "@/components/ml/rental";
import { bookings, equipmentById, providerById } from "@/data/rentals";

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

const tabs = ["Upcoming", "Active", "Completed", "Cancelled"] as const;

function MyRentals() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");
  const list = bookings.filter((b) => b.bucket === tab);

  return (
    <Screen>
      <TopBar
        title="My rentals"
        subtitle="1 active · 1 upcoming"
        back="/marketplace/rent"
        right={
          <Link
            to="/marketplace/rent/listings"
            className="shrink-0 text-xs font-semibold text-primary"
          >
            Listings
          </Link>
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
        {list.length ? (
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
        ) : (
          <EmptyState
            emoji="📭"
            title={`No ${tab.toLowerCase()} rentals`}
            body="When you rent equipment through MusicLinkd, it will appear here with dates, deposits and return reminders."
            action={
              <Link to="/marketplace/rent">
                <Btn>Explore equipment</Btn>
              </Link>
            }
          />
        )}
      </div>
    </Screen>
  );
}
