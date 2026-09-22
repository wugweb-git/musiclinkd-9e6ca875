import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BookingDraftProvider } from "@/components/ml/booking-context";
import { getStudio } from "@/lib/catalog.functions";
import { getStudioCalendar } from "@/lib/studio-calendar.functions";
import { getStudioPhotos } from "@/lib/studio-photos.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { bookableFromStudio } from "@/lib/studio-view";
import { listPublicServices } from "@/lib/services.functions";

export const Route = createFileRoute("/booking/$id")({
  // The id is a database studio slug; an unknown slug shows "unavailable".
  loader: async ({ params }) => {
    const [row, labels, calendar] = await Promise.all([
      getStudio({ data: { slug: params.id } }).catch(() => null),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      // Weekly hours turn the date and time steps on; without them the studio is asked directly.
      getStudioCalendar({ data: { slug: params.id } }).catch(() => null),
    ]);
    // Facility and equipment photos need the studio's id; none before the table exists.
    const ownerId = (row as { owner?: { id?: string } | null } | null)?.owner?.id;
    const [photos, services] = await Promise.all([
      row ? getStudioPhotos({ data: { studioId: row.id } }).catch(() => []) : [],
      // The business's services are what a session can be for (details step, and listed here).
      ownerId ? listPublicServices({ data: { profileId: ownerId } }).catch(() => []) : [],
    ]);
    const studio = row ? bookableFromStudio(row, labels, calendar?.weeklyHours, photos) : null;
    return { studio: studio ? { ...studio, services } : null };
  },
  component: BookingLayout,
});

function BookingLayout() {
  const { id } = Route.useParams();
  const { studio } = Route.useLoaderData();
  return (
    <BookingDraftProvider id={id} studio={studio}>
      <Outlet />
    </BookingDraftProvider>
  );
}
