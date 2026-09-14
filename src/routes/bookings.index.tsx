import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import {
  BookingListCard,
  BookingSkeleton,
  EmptyState,
  ErrorState,
  OfflineBanner,
} from "@/components/ml/booking";
import { bookings, getBookable, getResource, type BookingStatus } from "@/data/booking";
import { showDemoControls } from "@/lib/dev";

export const Route = createFileRoute("/bookings/")({
  head: () => ({
    meta: [
      { title: "My bookings — MusicLinkd" },
      {
        name: "description",
        content:
          "Every studio, jam room and session you've booked — upcoming, pending, completed and cancelled.",
      },
      { property: "og:title", content: "My bookings — MusicLinkd" },
      {
        property: "og:description",
        content: "Track upcoming, pending and past MusicLinkd bookings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyBookings,
});

const tabs: { key: string; label: string; match: BookingStatus[] }[] = [
  { key: "upcoming", label: "Upcoming", match: ["upcoming", "confirmed", "inProgress"] },
  { key: "pending", label: "Pending", match: ["requested", "reviewing"] },
  { key: "completed", label: "Completed", match: ["completed"] },
  { key: "cancelled", label: "Cancelled", match: ["cancelled", "rejected", "expired", "noShow"] },
];

type Sim = "ok" | "loading" | "error" | "offline" | "empty";

function MyBookings() {
  const [tab, setTab] = useState(tabs[0]!.key);
  const [sim, setSim] = useState<Sim>("ok");
  const active = tabs.find((t) => t.key === tab)!;
  const list = sim === "empty" ? [] : bookings.filter((b) => active.match.includes(b.status));

  return (
    <Screen>
      <TopBar
        title="My bookings"
        subtitle="Studios, rooms and sessions"
        right={
          showDemoControls ? (
            <button
              type="button"
              onClick={() => setSim(sim === "ok" ? "empty" : "ok")}
              className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
            >
              {sim === "ok" ? "States" : "Reset"}
            </button>
          ) : undefined
        }
      />

      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t.key} active={t.key === tab} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <main className="px-5">
        {sim === "offline" ? <OfflineBanner onRetry={() => setSim("ok")} /> : null}

        {sim === "loading" ? (
          <BookingSkeleton />
        ) : sim === "error" ? (
          <ErrorState
            message="We couldn't load your bookings just now."
            onRetry={() => setSim("ok")}
          />
        ) : list.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            body="When you book a studio, jam room or session it shows up here."
            action={<BtnLink to="/studio">Discover studios &amp; spaces</BtnLink>}
          />
        ) : (
          <div className="space-y-3">
            {list.map((bk) => {
              const b = getBookable(bk.bookableId);
              const r = getResource(b, bk.resourceId);
              return (
                <BookingListCard
                  key={bk.ref}
                  booking={bk}
                  entityName={b?.name ?? "Provider"}
                  resourceName={r?.name ?? "Room"}
                />
              );
            })}
          </div>
        )}

        {showDemoControls ? (
          <div className="mt-6 flex gap-2">
            <Btn variant="ghost" className="flex-1" onClick={() => setSim("loading")}>
              Loading
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setSim("error")}>
              Error
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setSim("offline")}>
              Offline
            </Btn>
          </div>
        ) : null}

        <Link
          to="/provider/bookings"
          className="mt-6 block rounded-lg border border-border bg-card p-4"
        >
          <p className="text-sm font-semibold">Manage a space you run</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Open the provider workspace to review requests and set availability.
          </p>
        </Link>
      </main>
    </Screen>
  );
}
