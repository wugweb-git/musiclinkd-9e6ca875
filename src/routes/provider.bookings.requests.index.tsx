import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, Chip } from "@/components/ml/ui";
import { BookingSkeleton, EmptyState, ProviderRequestCard } from "@/components/ml/booking";
import { getBookable, getResource, providerRequests } from "@/data/booking";

export const Route = createFileRoute("/provider/bookings/requests/")({
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

function Requests() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [loading, setLoading] = useState(false);

  const list = providerRequests.filter((b) =>
    tab === "All" ? true : tab === "New" ? b.status === "requested" : b.status === "reviewing",
  );

  return (
    <Screen>
      <TopBar
        title="Requests"
        subtitle={`${providerRequests.length} awaiting your reply`}
        back="/provider/bookings"
        right={
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 700);
            }}
            className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
          >
            Refresh
          </button>
        }
      />

      <div className="rail no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <main className="space-y-3 px-5 pt-4">
        {loading ? (
          <BookingSkeleton rows={3} />
        ) : list.length === 0 ? (
          <EmptyState
            title="No requests here"
            body="New booking requests for your space will appear in this queue. Keep your availability up to date so people can find open dates."
          />
        ) : (
          list.map((bk) => {
            const entity = getBookable(bk.bookableId);
            const resource = getResource(entity, bk.resourceId);
            return (
              <ProviderRequestCard
                key={bk.ref}
                booking={bk}
                entityResource={`${resource?.name ?? "Session"} · ${entity?.name ?? ""}`}
              />
            );
          })
        )}
      </main>
    </Screen>
  );
}
