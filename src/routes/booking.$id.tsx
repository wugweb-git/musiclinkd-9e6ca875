import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BookingDraftProvider } from "@/components/ml/booking-context";
import { getStudio } from "@/lib/catalog.functions";
import { getStudioCalendar } from "@/lib/studio-calendar.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { bookableFromStudio } from "@/lib/studio-view";

export const Route = createFileRoute("/booking/$id")({
  // The id is a database studio slug; an unknown slug shows "unavailable".
  loader: async ({ params }) => {
    const [row, labels, calendar] = await Promise.all([
      getStudio({ data: { slug: params.id } }).catch(() => null),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      // Weekly hours turn the date and time steps on; without them the studio is asked directly.
      getStudioCalendar({ data: { slug: params.id } }).catch(() => null),
    ]);
    return {
      studio: row ? bookableFromStudio(row, labels, calendar?.weeklyHours) : null,
    };
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
