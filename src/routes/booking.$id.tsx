import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BookingDraftProvider } from "@/components/ml/booking-context";

export const Route = createFileRoute("/booking/$id")({
  component: BookingLayout,
});

function BookingLayout() {
  const { id } = Route.useParams();
  return (
    <BookingDraftProvider id={id}>
      <Outlet />
    </BookingDraftProvider>
  );
}
