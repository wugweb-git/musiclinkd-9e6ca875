import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BookingDraftProvider } from "@/components/ml/booking-context";
import { getBookableBySlug } from "@/lib/catalog.functions";
import { getBookableCalendar } from "@/lib/bookable-calendar.functions";
import { getBookablePhotos } from "@/lib/bookable-photos.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { bookableFromRow } from "@/lib/bookable-view";
import { listPublicServices } from "@/lib/services.functions";

export const Route = createFileRoute("/booking/$id")({
  // ?service=<name> starts the booking with that service picked (Book on a service card).
  validateSearch: (search: Record<string, unknown>) =>
    typeof search["service"] === "string" ? { service: search["service"] } : {},
  // The id is a database studio slug; an unknown slug shows "unavailable".
  loader: async ({ params }) => {
    const [row, labels, calendar] = await Promise.all([
      getBookableBySlug({ data: { slug: params.id } }),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      // Weekly hours turn the date and time steps on; without them the studio is asked directly.
      getBookableCalendar({ data: { slug: params.id } }).catch(() => null),
    ]);
    // Amenity and equipment photos need the studio's id; none before the table exists.
    const ownerId = (row as { owner?: { id?: string } | null } | null)?.owner?.id;
    const [photos, services] = await Promise.all([
      row ? getBookablePhotos({ data: { studioId: row.id } }).catch(() => []) : [],
      // The business's services are what a session can be for (details step, and listed here).
      ownerId ? listPublicServices({ data: { profileId: ownerId } }).catch(() => []) : [],
    ]);
    const studio = row ? bookableFromRow(row, labels, calendar?.weeklyHours, photos) : null;
    return { studio: studio ? { ...studio, services } : null };
  },
  component: BookingLayout,
  errorComponent: BookingLoadError,
});

function BookingLoadError({ reset }: { reset: () => void }) {
  return <div role="alert" className="mx-auto max-w-app px-5 py-10 text-sm text-foreground">
    <h1 className="text-3 font-semibold">Booking could not load</h1>
    <p className="mt-2 text-muted-foreground">Check your connection and try again.</p>
    <button type="button" onClick={reset} className="state-layer mt-5 min-h-touch rounded-lg bg-ink px-5 font-semibold text-ink-foreground">Retry</button>
  </div>;
}

function BookingLayout() {
  const { id } = Route.useParams();
  const { studio } = Route.useLoaderData();
  const { service } = Route.useSearch() as { service?: string };
  return (
    <BookingDraftProvider id={id} studio={studio} service={service}>
      <Outlet />
    </BookingDraftProvider>
  );
}
