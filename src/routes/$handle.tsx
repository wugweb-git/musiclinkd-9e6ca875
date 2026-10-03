import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  PublicProfileError,
  PublicProfileScreen,
  loadPublicProfile,
  publicProfileHead,
} from "@/components/ml/public-profile";

/*
 * musiclinkd.com/@username: every profile's short link, talent and business alike (owner, 22 Sep
 * 2026). Any other single-segment path that isn't a route is still a 404.
 */
const handleOf = (h: string) => (h.startsWith("@") ? h.slice(1) : null);

export const Route = createFileRoute("/$handle")({
  loader: ({ params }) => {
    const username = handleOf(decodeURIComponent(params.handle));
    if (!username) throw notFound();
    return loadPublicProfile(username);
  },
  head: ({ params, loaderData }) =>
    publicProfileHead(handleOf(decodeURIComponent(params.handle)) ?? params.handle, loaderData),
  errorComponent: PublicProfileError,
  component: HandleRoute,
});

function HandleRoute() {
  const { handle } = Route.useParams();
  const username = handleOf(decodeURIComponent(handle)) ?? handle;
  return <PublicProfileScreen username={username} data={Route.useLoaderData()} />;
}
