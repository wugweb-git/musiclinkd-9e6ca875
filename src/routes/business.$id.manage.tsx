import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarClock,
  Image,
  LayoutDashboard,
  Pencil,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Row, EmptyState, Dialog, StatusPill } from "@/components/ml/kit";
import { getBusiness, businessTypeLabel } from "@/data/business";

export const Route = createFileRoute("/business/$id/manage")({
  head: () => ({
    meta: [
      { title: "Manage business | MusicLinkd" },
      {
        name: "description",
        content: "Edit details, spaces, team, availability and verification for your business.",
      },
      { property: "og:title", content: "Manage business | MusicLinkd" },
      { property: "og:description", content: "Everything the owner controls in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageBusiness,
});

function ManageBusiness() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Manage" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="It may have been removed." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Manage" subtitle={b.name} back={`/business/${id}`} />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="flex items-center gap-3">
          <img src={b.logo} alt="" className="h-12 w-12 rounded-md object-cover" loading="lazy" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{b.name}</p>
            <p className="truncate text-[12px] text-muted-foreground">
              {businessTypeLabel(b.type)} · {b.city}
            </p>
          </div>
          <StatusPill
            label={b.verified ? "verified" : "unverified"}
            tone={b.verified ? "good" : "neutral"}
          />
        </Card>

        <div className="space-y-2">
          <Row
            icon={<LayoutDashboard size={16} />}
            title="Dashboard"
            subtitle="Leads, analytics, services, reviews"
            to="/business/$id/dashboard"
            params={{ id }}
          />
          <Row
            icon={<Pencil size={16} />}
            title="Details"
            subtitle="Name, about, contact, hours"
            to="/business/new"
          />
          <Row
            icon={<Image size={16} />}
            title="Photos & spaces"
            subtitle={`${b.spaces.length} bookable spaces`}
            to="/business/$id"
            params={{ id }}
          />
          <Row
            icon={<Users size={16} />}
            title="Team & roles"
            subtitle={`${b.members.filter((m) => m.status === "active").length} active`}
            to="/business/$id/team"
            params={{ id }}
          />
          <Row
            icon={<CalendarClock size={16} />}
            title="Availability & bookings"
            subtitle="Calendar, requests, policies"
            to="/provider/bookings/calendar"
          />
          <Row
            icon={<ShieldCheck size={16} />}
            title="Business verification"
            subtitle={b.verified ? "Verified — renews yearly" : "Get the verified badge"}
            to="/business/$id/verification"
            params={{ id }}
          />
        </div>

        <Card className="space-y-2">
          <p className="flex items-center gap-2 text-[13px] font-semibold">
            <Trash2 size={15} /> Delete business
          </p>
          <p className="text-[12px] text-muted-foreground">
            Removes the profile, spaces and team. Past bookings and reviews stay with the people
            involved.
          </p>
          <Btn variant="outline" className="w-full" onClick={() => setConfirmDelete(true)}>
            Delete {b.name}
          </Btn>
        </Card>
      </div>

      <Dialog
        open={confirmDelete}
        title={`Delete ${b.name}?`}
        body="This cannot be undone. Upcoming bookings must be cancelled or handed over first."
        onClose={() => setConfirmDelete(false)}
      >
        <div className="space-y-2">
          <Btn
            className="w-full"
            onClick={() => {
              setConfirmDelete(false);
              setDeleted(true);
            }}
          >
            Yes, delete
          </Btn>
          <Btn variant="ghost" className="w-full" onClick={() => setConfirmDelete(false)}>
            Keep it
          </Btn>
        </div>
      </Dialog>

      <Dialog
        open={deleted}
        title="Business deleted"
        body="The profile is no longer visible on MusicLinkd."
        onClose={() => setDeleted(false)}
      >
        <BtnLink to="/business" className="w-full">
          Back to businesses
        </BtnLink>
      </Dialog>
    </Screen>
  );
}
