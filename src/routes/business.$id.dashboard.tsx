import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarClock, Images, Inbox, ShieldCheck, Star, Wrench } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, EmptyState, Row, StatusPill } from "@/components/ml/kit";
import { businessAnalytics, businessLeads, getBusiness } from "@/data/business";

export const Route = createFileRoute("/business/$id/dashboard")({
  head: () => ({
    meta: [
      { title: "Business dashboard | MusicLinkd" },
      { name: "description", content: "Run the business day to day: new leads, bookings, reviews, availability and analytics in one place." },
      { property: "og:title", content: "Business dashboard | MusicLinkd" },
      { property: "og:description", content: "Leads, bookings, reviews and analytics for your business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const { id } = Route.useParams();
  const b = getBusiness(id);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Dashboard" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or you no longer have access to it." />
        </div>
      </Screen>
    );
  }

  const newLeads = businessLeads.filter((l) => l.status === "new").length;

  return (
    <Screen>
      <TopBar title="Dashboard" subtitle={b.name} back={`/business/${b.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{newLeads} new {newLeads === 1 ? "enquiry" : "enquiries"}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Answering within an hour is the single biggest lever you have.</p>
            </div>
            <StatusPill label="Today" tone="brand" />
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Views", value: businessAnalytics.views.toLocaleString("en-IN") },
            { label: "Enquiries", value: businessAnalytics.enquiries },
            { label: "Bookings", value: businessAnalytics.bookings },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-[18px] font-bold leading-none">{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <Row icon={<Inbox size={16} />} title="Leads" subtitle={`${newLeads} waiting on a reply`} to={`/business/${b.id}/leads`} />
          <Row icon={<BarChart3 size={16} />} title="Analytics" subtitle="Views, sources, room demand" to={`/business/${b.id}/analytics`} />
          <Row icon={<Wrench size={16} />} title="Services" subtitle="Rooms, sessions and pricing" to={`/business/${b.id}/services`} />
          <Row icon={<CalendarClock size={16} />} title="Availability" subtitle="Hours, notice and blackout dates" to={`/business/${b.id}/availability`} />
          <Row icon={<Images size={16} />} title="Portfolio" subtitle="Credits and gallery" to={`/business/${b.id}/portfolio`} />
          <Row icon={<Star size={16} />} title="Reviews" subtitle={`${b.stats.rating} from ${b.stats.reviews} reviews`} to={`/business/${b.id}/reviews`} />
          <Row icon={<ShieldCheck size={16} />} title="Verification" subtitle={b.verified ? "Verified business" : "Not verified yet"} to={`/business/${b.id}/verification`} />
        </div>
      </div>
    </Screen>
  );
}
