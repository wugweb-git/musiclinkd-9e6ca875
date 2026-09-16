import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/kit";
import { businessView, loadBusiness } from "@/lib/business-view";

export const Route = createFileRoute("/business/$id/analytics")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business analytics | MusicLinkd" },
      {
        name: "description",
        content: "See how many people found the business, saved it, enquired and actually booked.",
      },
      { property: "og:title", content: "Business analytics | MusicLinkd" },
      { property: "og:description", content: "Views, saves, enquiries and bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessAnalytics,
});

function BusinessAnalytics() {
  const b = businessView(Route.useLoaderData());

  if (!b) {
    return (
      <Screen>
        <TopBar title="Analytics" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or you no longer have access to it."
          />
        </div>
      </Screen>
    );
  }

  // There is no analytics source in the database yet, so no figures are shown.
  return (
    <Screen>
      <TopBar
        title="Analytics"
        subtitle={`${b.name} · last 30 days`}
        back={`/business/${b.id}/dashboard`}
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <EmptyState
          title="Analytics"
          body="See how many people found the business, saved it, enquired and actually booked."
        />
      </div>
    </Screen>
  );
}
