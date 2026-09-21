import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { listMyLeads } from "@/lib/enquiries.functions";
import { BarChart3, CalendarClock, Images, Inbox, ShieldCheck, Star, Wrench } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { EmptyState, Row } from "@/components/ml/kit";
import { businessView, loadBusiness } from "@/lib/business-view";
import { iconSize } from "@/lib/tokens";

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
  const { user } = useAuth();
  const load = useServerFn(listMyLeads);
  // Same query as the Leads screen, so opening it after this is instant.
  const leads = useQuery({
    queryKey: ["leads", "mine"],
    queryFn: () => load(),
    enabled: Boolean(b && user && user.id === b.profileId),
  });
  const fresh = (leads.data ?? []).filter((l) => l.status === "new").length;

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
        <div className="space-y-2">
          <Row
            icon={<Inbox size={iconSize.sm} />}
            title="Leads"
            subtitle={
              leads.data
                ? fresh
                  ? `${fresh} new`
                  : `${leads.data.length} in total`
                : "Enquiries from people"
            }
            to="/business/$id/leads"
            params={{ id: b.id }}
          />
          <Row
            icon={<BarChart3 size={iconSize.sm} />}
            title="Analytics"
            subtitle="Views, sources, room demand"
            to="/business/$id/analytics"
            params={{ id: b.id }}
          />
          <Row
            icon={<Wrench size={iconSize.sm} />}
            title="Services"
            subtitle="Rooms, sessions and pricing"
            to="/business/$id/services"
            params={{ id: b.id }}
          />
          <Row
            icon={<CalendarClock size={iconSize.sm} />}
            title="Availability"
            subtitle="Hours, notice and blackout dates"
            to="/business/$id/availability"
            params={{ id: b.id }}
          />
          <Row
            icon={<Images size={iconSize.sm} />}
            title="Portfolio"
            subtitle="Credits and gallery"
            to="/business/$id/portfolio"
            params={{ id: b.id }}
          />
          <Row
            icon={<Star size={iconSize.sm} />}
            title="Reviews"
            subtitle={
              b.rating != null && b.reviewCount != null
                ? `${b.rating.toFixed(1)} from ${b.reviewCount} reviews`
                : ""
            }
            to="/business/$id/reviews"
            params={{ id: b.id }}
          />
          <Row
            icon={<ShieldCheck size={iconSize.sm} />}
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
