import { createFileRoute } from "@tanstack/react-router";
import { BusinessProfileExperience } from "@/components/ml/business-profile";
import { businessView, loadBusiness } from "@/lib/business-view";

export const Route = createFileRoute("/business/$id/")({
  // The id is the username of a business account.
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business profile | MusicLinkd" },
      {
        name: "description",
        content: "Spaces, rates, team and credits for a studio, label or venue on MusicLinkd.",
      },
      { property: "og:title", content: "Business profile | MusicLinkd" },
      {
        property: "og:description",
        content: "See rooms, rates and the people behind the business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessProfileScreen,
});

function BusinessProfileScreen() {
  return <BusinessProfileExperience b={businessView(Route.useLoaderData())} />;
}
