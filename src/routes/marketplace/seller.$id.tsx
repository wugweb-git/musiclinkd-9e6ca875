import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { ListingCard, Rating, SellerSummary, TrustPill } from "@/components/ml/market";
import { bySeller, reviews, sellerById } from "@/data/market";

export const Route = createFileRoute("/marketplace/seller/$id")({
  head: ({ params }) => {
    const s = sellerById(params.id);
    const title = s ? `${s.name} — ${s.role} | MusicLinkd Market` : "Seller | MusicLinkd Market";
    const desc = s?.bio ?? "Seller profile on the MusicLinkd marketplace.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: SellerProfile,
});

function SellerProfile() {
  const { id } = Route.useParams();
  const s = sellerById(id);
  if (!s) {
    return (
      <Screen>
        <TopBar title="Seller unavailable" back="/marketplace" />
      </Screen>
    );
  }
  const items = bySeller(s.id);
  return (
    <Screen>
      <TopBar title="Seller" back="/marketplace" />
      <div className="px-5 py-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <SellerSummary seller={s} />
          <div className="mt-3 flex flex-wrap gap-2">
            <TrustPill label="Verified identity" />
            <TrustPill label={`${s.reviews} transactions`} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{s.bio}</p>
          <div className="mt-4 flex gap-2">
            <Link to="/messages" className="flex-1">
              <Btn className="w-full">Message</Btn>
            </Link>
            <Btn variant="outline" className="flex-1">
              Follow
            </Btn>
          </div>
        </div>

        <h2 className="mt-6 text-[16px]">Listings ({items.length})</h2>
        <div className="mt-2 space-y-3">
          {items.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>

        <h2 className="mt-6 text-[16px]">Reviews</h2>
        <div className="mt-2 space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">{r.name}</p>
                <Rating value={r.rating} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {r.role} · {r.context} · {r.date}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Screen>
  );
}
