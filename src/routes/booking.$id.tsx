import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BookingDraftProvider } from "@/components/ml/booking-context";
import { getBookable } from "@/data/booking";
import { getStudio } from "@/lib/catalog.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { bookableFromStudio } from "@/lib/studio-view";

export const Route = createFileRoute("/booking/$id")({
  // Seeded spaces win; otherwise the id is a database studio slug. Neither shows "unavailable".
  loader: async ({ params }) => {
    if (getBookable(params.id)) return { studio: null };
    const [row, labels] = await Promise.all([
      getStudio({ data: { slug: params.id } }).catch(() => null),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    return { studio: row ? bookableFromStudio(row, labels) : null };
  },
  component: BookingLayout,
});

function BookingLayout() {
  const { id } = Route.useParams();
  const { studio } = Route.useLoaderData();
  return (
    <BookingDraftProvider id={id} fallback={studio}>
      <Outlet />
    </BookingDraftProvider>
  );
}
