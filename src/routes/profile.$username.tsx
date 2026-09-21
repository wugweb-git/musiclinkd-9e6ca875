import { createFileRoute } from "@tanstack/react-router";
import {
  PublicProfileScreen,
  loadPublicProfile,
  publicProfileHead,
} from "@/components/ml/public-profile";

// The long form of a profile link; /@username is the short one (src/routes/$handle.tsx).
export const Route = createFileRoute("/profile/$username")({
  loader: ({ params }) => loadPublicProfile(params.username),
  head: ({ params, loaderData }) => publicProfileHead(params.username, loaderData),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { username } = Route.useParams();
  return <PublicProfileScreen username={username} data={Route.useLoaderData()} />;
}
