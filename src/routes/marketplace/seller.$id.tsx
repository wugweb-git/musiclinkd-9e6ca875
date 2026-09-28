import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { reviewItemFrom } from "@/lib/review-item";
import { ReviewCard, ReviewRail } from "@/components/ml/profile";
import { useQuery } from "@tanstack/react-query";
import { RentalReportSheet } from "@/components/ml/rental";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Followers, ListingGrid, Rating, ReviewTags, TrustPill } from "@/components/ml/market";
import { EmptyState, LoadError, Loading } from "@/components/ml/kit";
import { getRentalProvider } from "@/lib/rentals.functions";
import { getSellerListings } from "@/lib/catalog.functions";
import { listingFromRow as adaptListing } from "@/lib/market-view";
import { listReviewsFor } from "@/lib/reviews.functions";
import { getTaxonomyLabels } from "@/lib/portfolio.functions";
import { sized } from "@/lib/image-url";

export const Route = createFileRoute("/marketplace/seller/$id")({
  head: () => ({
    meta: [
      { title: "Seller | MusicLinkd Market" },
      { name: "description", content: "Seller profile on the MusicLinkd marketplace." },
    ],
  }),
  component: SellerProfile,
});

function SellerProfile() {
  const { id } = Route.useParams();
  const loadSeller = useServerFn(getRentalProvider);
  const loadListings = useServerFn(getSellerListings);
  const loadReviews = useServerFn(listReviewsFor);
  const loadLabels = useServerFn(getTaxonomyLabels);

  const seller = useQuery({
    queryKey: ["marketplace", "seller", id],
    queryFn: () => loadSeller({ data: { profileId: id } }),
  });
  const listings = useQuery({
    queryKey: ["marketplace", "seller", id, "listings"],
    queryFn: () => loadListings({ data: { sellerProfileId: id } }),
  });
  const reviews = useQuery({
    queryKey: ["marketplace", "seller", id, "reviews"],
    queryFn: () => loadReviews({ data: { profileId: id } }),
  });
  const labels = useQuery({ queryKey: ["taxonomy", "labels"], queryFn: () => loadLabels() });
  const [following, setFollowing] = useState(false);
  const [report, setReport] = useState(false);

  if (seller.isLoading) {
    return (
      <Screen>
        <TopBar title="Seller" back="/marketplace" />
        <div className="px-5 py-6">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

  const s = seller.data;
  if (!s) {
    return (
      <Screen>
        <TopBar title="Seller unavailable" back="/marketplace" />
      </Screen>
    );
  }

  // Market shows goods and rentals; services are Discover's (owner, 18 Sep 2026).
  const items = (listings.data ?? [])
    .map((row) => adaptListing(row, labels.data ?? {}, Date.now()))
    .filter((l) => l.type !== "service");

  return (
    <Screen>
      <TopBar title="Seller" back="/marketplace" />
      <div className="px-5 py-5">
        <div className="rounded-lg bg-subtle p-4">
          <div className="flex items-center gap-3">
            {s.photo ? (
              <img
                src={sized(s.photo, { width: 56 })}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <span className="h-14 w-14 shrink-0 rounded-full bg-background" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.name}</p>
              {s.role ? <p className="truncate text-1 text-muted-foreground">{s.role}</p> : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.verified ? <TrustPill label="Verified identity" /> : null}
            {s.rating ? <Rating value={s.rating} count={s.reviews} /> : null}
            <Followers count={s.followers} />
          </div>
          {s.bio ? <p className="mt-3 text-sm text-muted-foreground">{s.bio}</p> : null}
          <div className="mt-4 flex gap-2">
            <BtnLink to="/messages" className="flex-1 w-full">
              Message
            </BtnLink>
            <Btn
              variant={following ? "ghost" : "outline"}
              className="flex-1"
              onClick={() => {
                const next = !following;
                setFollowing(next);
                toast.success(next ? `Now following ${s.name}` : `Unfollowed ${s.name}`);
              }}
            >
              {following ? "Following" : "Follow"}
            </Btn>
          </div>
        </div>

        <h2 className="mt-6 text-2">Listings ({items.length})</h2>
        <div className="mt-2 space-y-3">
          {listings.isLoading ? (
            <Loading rows={2} />
          ) : listings.isError ? (
            <LoadError what="their listings" />
          ) : items.length ? (
            <ListingGrid items={items} />
          ) : (
            <EmptyState title="No listings yet" body="Nothing published here right now." />
          )}
        </div>

        <h2 className="mt-6 text-2">Reviews</h2>
        <div className="mt-2">
          {reviews.isLoading ? (
            <Loading rows={2} />
          ) : reviews.isError ? (
            <LoadError what="these reviews" />
          ) : reviews.data?.length ? (
            <ReviewRail>
              {reviews.data.map((r) => (
                <ReviewCard key={r.id} r={reviewItemFrom(r)} />
              ))}
            </ReviewRail>
          ) : (
            <EmptyState title="No reviews yet" body="No one has reviewed this seller yet." />
          )}
        </div>

        <button
          type="button"
          onClick={() => setReport(true)}
          className="mt-6 w-full text-left text-1 text-muted-foreground underline underline-offset-2"
        >
          Report or block this seller
        </button>
      </div>

      <RentalReportSheet
        open={report}
        onClose={() => setReport(false)}
        subject={{ type: "profile", id }}
      />
    </Screen>
  );
}
