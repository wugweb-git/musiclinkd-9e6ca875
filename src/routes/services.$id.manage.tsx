import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, Row, StatusPill } from "@/components/ml/kit";
import { getService, serviceStatusTone, type ServiceStatus } from "@/data/services";

export const Route = createFileRoute("/services/$id/manage")({
  head: () => ({
    meta: [
      { title: "Manage a service | MusicLinkd" },
      { name: "description", content: "Pause, duplicate or delete a service, and see what happens to bookings already in the calendar." },
      { property: "og:title", content: "Manage a service | MusicLinkd" },
      { property: "og:description", content: "Pause, duplicate or delete a service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageService,
});

function ManageService() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const s = getService(id);
  const [status, setStatus] = useState<ServiceStatus>(s?.status ?? "active");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duplicated, setDuplicated] = useState(false);

  if (!s) {
    return (
      <Screen>
        <TopBar title="Manage" back="/services" />
        <div className="px-5 pt-6">
          <EmptyState title="Service not found" body="This service may have already been deleted." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Manage service" subtitle={s.title} back={`/services/${s.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{s.title}</p>
              <p className="text-[12px] text-muted-foreground">{s.stats.bookings} bookings · {s.stats.enquiries} enquiries</p>
            </div>
            <StatusPill label={status} tone={serviceStatusTone[status]} />
          </div>
        </Card>

        {status === "paused" ? (
          <Card>
            <p className="text-sm font-semibold">This service is paused</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              It is hidden from Discover and search, and no new enquiries can come in. Bookings already confirmed still stand.
            </p>
          </Card>
        ) : null}

        <div className="space-y-2">
          <Row
            icon={status === "active" ? <EyeOff size={16} /> : <Eye size={16} />}
            title={status === "active" ? "Pause this service" : "Make it live again"}
            subtitle={status === "active" ? "Hide it while you are full" : "Show it in Discover and search"}
            onClick={() => setStatus(status === "active" ? "paused" : "active")}
          />
          <Row
            icon={<Copy size={16} />}
            title="Duplicate"
            subtitle={duplicated ? "Copy created as a draft" : "Start a new service from this one"}
            onClick={() => setDuplicated(true)}
          />
          <Row icon={<Trash2 size={16} />} title="Delete this service" subtitle="Permanent, and it cannot be restored" onClick={() => setConfirmDelete(true)} />
        </div>

        <Card>
          <p className="text-sm font-semibold">Before you delete</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Deleting removes the listing and its reviews' link to it. Confirmed bookings are unaffected and stay in your calendar.
          </p>
        </Card>
      </div>

      <Dialog
        open={confirmDelete}
        title={`Delete "${s.title}"?`}
        body="This cannot be undone. If you only want a break, pause it instead."
        onClose={() => setConfirmDelete(false)}
      >
        <Btn onClick={() => navigate({ to: "/services" })}>Delete service</Btn>
        <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>Keep it</Btn>
      </Dialog>
    </Screen>
  );
}
