import { createFileRoute } from "@tanstack/react-router";
import { reviewItemFrom } from "@/lib/review-item";
import { ReviewCard, ReviewRail } from "@/components/ml/profile";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn, BtnLink, VerifiedBadge } from "@/components/ml/ui";
import { EmptyState, EquipmentGrid, Followers, Rating, ReviewTags } from "@/components/ml/market";
import { Loading, Segmented } from "@/components/ml/kit";
import { RentalReportSheet } from "@/components/ml/rental";
import { getRentalProvider } from "@/lib/rentals.functions";
import { getSellerListings } from "@/lib/catalog.functions";
import { rentalFromRow } from "@/lib/market-view";
import { listReviewsFor } from "@/lib/reviews.functions";
import { getTaxonomyLabels } from "@/lib/portfolio.functions";

export const Route = createFileRoute("/marketplace/rent/provider/$id")({
  head: () => ({
    meta: [
      { title: "Rental Provider | MusicLinkd" },
      { name: "description", content: "Rental provider on MusicLinkd." },
    ],
  }),
  component: ProviderProfile,
});

const tabs = ["Equipment", "Reviews", "About"];

function ProviderProfile() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState(tabs[0]!);
  const [report, setReport] = useState(false);
  const [following, setFollowing] = useState(false);

  const loadProvider = useServerFn(getRentalProvider);
  const loadListings = useServerFn(getSellerListings);
  const loadReviews = useServerFn(listReviewsFor);
  const loadLabels = useServerFn(getTaxonomyLabels);

  const provider = useQuery({
    queryKey: ["rent", "provider", id],
    queryFn: () => loadProvider({ data: { profileId: id } }),
  });
  const listings = useQuery({
    queryKey: ["rent", "provider", id, "listings"],
    queryFn: () => loadListings({ data: { sellerProfileId: id } }),
  });
  const reviews = useQuery({
    queryKey: ["rent", "provider", id, "reviews"],
    queryFn: () => loadReviews({ data: { profileId: id } }),
  });
  const labels = useQuery({ queryKey: ["taxonomy", "labels"], queryFn: () => loadLabels() });

  if (provider.isLoading) {
    return (
      <Screen>
        <TopBar title="Provider" back="/marketplace/rent" />
        <div className="px-5 py-6">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

  const p = provider.data;
  if (!p) {
    return (
      <Screen>
        <TopBar title="Provider unavailable" back="/marketplace/rent" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This provider is no longer on MusicLinkd.
        </p>
      </Screen>
    );
  }

  const items = (listings.data ?? [])
    .filter((row) => row.category === "gear_rental")
    .map((row) => rentalFromRow(row, labels.data ?? {}));

  return (
    <Screen>
      <TopBar title="Provider" back="/marketplace/rent" />

      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          {p.photo ? (
            <img
              src={p.photo}
              alt={p.name}
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="h-20 w-20 shrink-0 rounded-lg bg-subtle" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-3 leading-tight">{p.name}</h1>
              {p.verified ? <VerifiedBadge size={16} /> : null}
            </div>
            {p.role ? <p className="mt-0.5 text-1 text-muted-foreground">{p.role}</p> : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {p.rating ? <Rating value={p.rating} count={p.reviews} /> : null}
              <Followers count={p.followers} />
              {p.location ? (
                <span className="text-1 text-muted-foreground">{p.location}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-subtle px-1 py-2">
            <p className="truncate text-1 font-bold">{p.completedRentals}</p>
            <p className="text-1 text-muted-foreground">Completed rentals</p>
          </div>
          <div className="rounded-lg bg-subtle px-1 py-2">
            <p className="truncate text-1 font-bold">{items.length}</p>
            <p className="text-1 text-muted-foreground">Listed now</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <BtnLink to="/messages" className="w-full">
            Message
          </BtnLink>
          <Btn
            variant={following ? "ghost" : "outline"}
            className="w-full"
            onClick={() => {
              const next = !following;
              setFollowing(next);
              toast.success(next ? `Now following ${p.name}` : `Unfollowed ${p.name}`);
            }}
          >
            {following ? "Following" : "Follow"}
          </Btn>
        </div>
      </div>

      <div className="px-5 pb-3">
        <Segmented value={tab} options={tabs} onChange={setTab} />
      </div>

      <div className="space-y-3 px-5 pb-6">
        {tab === "Equipment" ? (
          listings.isLoading ? (
            <Loading rows={2} />
          ) : items.length ? (
            <EquipmentGrid items={items} />
          ) : (
            <EmptyState
              emoji="📦"
              title="No equipment listed"
              body="This provider has no rental equipment available right now."
            />
          )
        ) : null}

        {tab === "Reviews" ? (
          reviews.isLoading ? (
            <Loading rows={2} />
          ) : reviews.data?.length ? (
            <ReviewRail>
              {reviews.data.map((r) => (
                <ReviewCard key={r.id} r={reviewItemFrom(r)} />
              ))}
            </ReviewRail>
          ) : (
            <EmptyState
              emoji="⭐"
              title="No reviews yet"
              body="Renters can review a provider after a completed rental."
            />
          )
        ) : null}

        {tab === "About" ? (
          <>
            {p.bio ? (
              <p className="rounded-lg bg-subtle p-4 text-1 leading-relaxed text-muted-foreground">
                {p.bio}
              </p>
            ) : null}
            <dl className="divide-y divide-border rounded-lg border border-border">
              {[
                ...(p.location ? [{ k: "Based in", v: p.location }] : []),
                { k: "Completed rentals", v: `${p.completedRentals}` },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-1 text-muted-foreground">{r.k}</dt>
                  <dd className="text-1 font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => setReport(true)}
              className="text-1 font-semibold text-muted-foreground"
            >
              Report or block this provider
            </button>
          </>
        ) : null}
      </div>

      <RentalReportSheet
        open={report}
        onClose={() => setReport(false)}
        subject={{ type: "profile", id }}
      />
    </Screen>
  );
}
