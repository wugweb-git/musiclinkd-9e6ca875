import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { ReviewCard, ReviewRail } from "@/components/ml/profile";
import { businessView, loadBusiness } from "@/lib/business-view";

export const Route = createFileRoute("/business/$id/reviews")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business reviews | MusicLinkd" },
      {
        name: "description",
        content: "Reviews left after real sessions with this business.",
      },
      { property: "og:title", content: "Business reviews | MusicLinkd" },
      { property: "og:description", content: "Verified reviews from real sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessReviews,
});

function BusinessReviews() {
  const b = businessView(Route.useLoaderData());
  if (!b) {
    return (
      <Screen>
        <TopBar title="Reviews" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or is no longer public."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Reviews"
        subtitle={
          b.rating != null && b.reviewCount != null
            ? `${b.rating.toFixed(1)} · ${b.reviewCount} reviews`
            : ""
        }
        back={`/business/${b.id}`}
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        {b.reviews.length ? (
          <ReviewRail>
            {b.reviews.map((r) => (
              <ReviewCard
                key={r.id}
                r={{
                  id: r.id,
                  by: r.author,
                  org: r.org,
                  context: r.context,
                  stars: r.rating,
                  text: r.body,
                  tags: r.tags,
                }}
              />
            ))}
          </ReviewRail>
        ) : (
          <EmptyState
            title="No reviews yet"
            body="Reviews appear here after a completed session or order."
          />
        )}
      </div>
    </Screen>
  );
}
