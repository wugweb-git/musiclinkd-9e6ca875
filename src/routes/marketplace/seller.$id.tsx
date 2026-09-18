import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Followers, ListingGrid, Rating, ReviewTags, TrustPill } from "@/components/ml/market";
import { EmptyState, Loading } from "@/components/ml/kit";
import { getRentalProvider } from "@/lib/rentals.functions";
import { getSellerListings } from "@/lib/catalog.functions";
import { listingFromRow as adaptListing } from "@/lib/market-view";
import { listReviewsFor } from "@/lib/reviews.functions";
import { getTaxonomyLabels } from "@/lib/portfolio.functions";

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
              <img src={s.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
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
            <Btn variant="outline" className="flex-1">
              Follow
            </Btn>
          </div>
        </div>

        <h2 className="mt-6 text-2">Listings ({items.length})</h2>
        <div className="mt-2 space-y-3">
          {listings.isLoading ? (
            <Loading rows={2} />
          ) : items.length ? (
            <ListingGrid items={items} />
          ) : (
            <EmptyState title="No listings yet" body="Nothing published here right now." />
          )}
        </div>

        <h2 className="mt-6 text-2">Reviews</h2>
        <div className="mt-2 space-y-3">
          {reviews.isLoading ? (
            <Loading rows={2} />
          ) : reviews.data?.length ? (
            reviews.data.map((r) => (
              <article key={r.id} className="rounded-lg bg-subtle p-4">
                <div className="flex items-center justify-between">
                  <p className="text-1 font-semibold">{r.author_name}</p>
                  <Rating value={r.rating} />
                </div>
                <p className="text-1 text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                <ReviewTags tags={r.tags} />
              </article>
            ))
          ) : (
            <EmptyState title="No reviews yet" body="No one has reviewed this seller yet." />
          )}
        </div>
      </div>
    </Screen>
  );
}
