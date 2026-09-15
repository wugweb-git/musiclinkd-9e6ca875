import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarClock, Images, Inbox, ShieldCheck, Star, Wrench } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { EmptyState, Row } from "@/components/ml/kit";
import { businessView, loadBusiness } from "@/lib/business-view";

export const Route = createFileRoute("/business/$id/dashboard")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business dashboard | MusicLinkd" },
      {
        name: "description",
        content:
          "Run the business day to day: new leads, bookings, reviews, availability and analytics in one place.",
      },
      { property: "og:title", content: "Business dashboard | MusicLinkd" },
      {
        property: "og:description",
        content: "Leads, bookings, reviews and analytics for your business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const b = businessView(Route.useLoaderData());

  if (!b) {
    return (
      <Screen>
        <TopBar title="Dashboard" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or you no longer have access to it."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Dashboard" subtitle={b.name} back={`/business/${b.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        {/* Leads, views, enquiries and bookings are not stored yet: no card or figures. */}
        <div className="space-y-2">
          <Row
            icon={<Inbox size={16} />}
            title="Leads"
            subtitle=""
            to="/business/$id/leads"
            params={{ id: b.id }}
          />
          <Row
            icon={<BarChart3 size={16} />}
            title="Analytics"
            subtitle="Views, sources, room demand"
            to="/business/$id/analytics"
            params={{ id: b.id }}
          />
          <Row
            icon={<Wrench size={16} />}
            title="Services"
            subtitle="Rooms, sessions and pricing"
            to="/business/$id/services"
            params={{ id: b.id }}
          />
          <Row
            icon={<CalendarClock size={16} />}
            title="Availability"
            subtitle="Hours, notice and blackout dates"
            to="/business/$id/availability"
            params={{ id: b.id }}
          />
          <Row
            icon={<Images size={16} />}
            title="Portfolio"
            subtitle="Credits and gallery"
            to="/business/$id/portfolio"
            params={{ id: b.id }}
          />
          <Row
            icon={<Star size={16} />}
            title="Reviews"
            subtitle={
              b.rating != null && b.reviewCount != null
                ? `${b.rating} from ${b.reviewCount} reviews`
                : ""
            }
            to="/business/$id/reviews"
            params={{ id: b.id }}
          />
          <Row
            icon={<ShieldCheck size={16} />}
            title="Verification"
            subtitle={b.verified ? "Verified business" : "Not verified yet"}
            to="/business/$id/verification"
            params={{ id: b.id }}
          />
        </div>
      </div>
    </Screen>
  );
}
