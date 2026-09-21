import { createFileRoute } from "@tanstack/react-router";
import {
  PublicProfileScreen,
  loadPublicProfile,
  publicProfileHead,
} from "@/components/ml/public-profile";

// A business page by username; the same page as /@username (src/components/ml/public-profile.tsx).
export const Route = createFileRoute("/business/$id/")({
  loader: ({ params }) => loadPublicProfile(params.id),
  head: ({ params, loaderData }) => publicProfileHead(params.id, loaderData),
  component: BusinessProfileScreen,
});

function BusinessProfileScreen() {
  const { id } = Route.useParams();
  return <PublicProfileScreen username={id} data={Route.useLoaderData()} />;
}
