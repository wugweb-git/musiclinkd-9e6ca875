import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Chip, BtnLink } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/market";
import { EquipmentRow, RentalStatusPill } from "@/components/ml/rental";
import { equipment, equipmentById, inr, rentalNotifications, rentalRequests } from "@/data/rentals";

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
  primary: "var(--pink-container)",
  success: "var(--success-container)",
  warn: "var(--warn-container)",
  purple: "var(--purple-container)",
};

function MyListings() {
  const [tab, setTab] = useState(tabs[0]!);
  const [bucket, setBucket] = useState<string>("Active");
  const shown = equipment.filter((e) => e.listingStatus === bucket);

  return (
    <Screen>
      <TopBar
        title="My rental listings"
        subtitle={`${equipment.length} items · 3 requests`}
        back="/marketplace/rent"
        right={
          <Link to="/marketplace/rent/list" className="shrink-0 text-xs font-semibold text-primary">
            New
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
                  <div className="mt-1.5 flex flex-wrap gap-2 px-1 text-[10px] font-semibold text-muted-foreground">
                    <span
                      className="rounded-full px-2 py-1"
                      style={{ background: "var(--success-container)", color: "var(--success)" }}
                    >
                      {e.listingStatus}
                    </span>
                    <span className="rounded-full bg-subtle px-2 py-1">
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

        {tab === "Requests"
          ? rentalRequests.map((r) => {
              const e = equipmentById(r.equipmentId)!;
              return (
                <article key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={e.photos[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{e.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {r.renter} · {r.dates} · {r.quantity} unit
                      </p>
                      <p className="mt-1 text-[11px]">
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
            action={<BtnLink to="/marketplace/rent/list">Rent out equipment</BtnLink>}
          />
        ) : null}

        {tab === "Alerts"
          ? rentalNotifications.map((n) => (
              <article
                key={n.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: tone[n.tone] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
              </article>
            ))
          : null}
      </div>
    </Screen>
  );
}
