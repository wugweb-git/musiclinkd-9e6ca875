import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, EmptyState, StatusPill } from "@/components/ml/kit";
import { businessLeads, getBusiness, leadStatusTone, type BusinessLead } from "@/data/business";

export const Route = createFileRoute("/business/$id/leads")({
  head: () => ({
    meta: [
      { title: "Leads inbox | MusicLinkd" },
      { name: "description", content: "Every enquiry that arrived on your business page, with what they asked for and how far it got." },
      { property: "og:title", content: "Leads inbox | MusicLinkd" },
      { property: "og:description", content: "Enquiries from your business page in one queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessLeads,
});

const filters = ["All", "New", "Replied", "Booked"] as const;

function BusinessLeads() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  if (!b) {
    return (
      <Screen>
        <TopBar title="Leads" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or you no longer have access to it." />
        </div>
      </Screen>
    );
  }

  const list = businessLeads.filter(
    (l) => filter === "All" || l.status === (filter.toLowerCase() as BusinessLead["status"]),
  );

  return (
    <Screen>
      <TopBar title="Leads" subtitle={b.name} back={`/business/${b.id}/dashboard`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>

        {list.length ? (
          <div className="space-y-3">
            {list.map((l) => (
              <Card key={l.id}>
                <div className="flex items-center gap-3">
                  <img src={l.photo} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{l.intent} · {l.at}</p>
                  </div>
                  <StatusPill label={l.status} tone={leadStatusTone[l.status]} />
                </div>
                <p className="mt-3 text-[13px]">{l.message}</p>
                <div className="mt-3 flex gap-2">
                  <Link to="/messages" className="flex-1">
                    <Btn className="w-full">Reply</Btn>
                  </Link>
                  <Btn variant="ghost" className="flex-1">Mark closed</Btn>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing in this queue" body="New enquiries from your business page land here first." />
        )}
      </div>
    </Screen>
  );
}
