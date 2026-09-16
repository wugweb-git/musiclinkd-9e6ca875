import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Dialog, EmptyState, Loading, Row, StatusPill } from "@/components/ml/kit";
import { StateCard } from "@/components/ml/portfolio";
import { serviceStatusTone } from "@/data/services";
import { useRefreshServices, useService } from "@/hooks/use-services";
import { deleteService, duplicateService, setServiceStatus } from "@/lib/services.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/services/$id/manage")({
  head: () => ({
    meta: [
      { title: "Manage a service | MusicLinkd" },
      {
        name: "description",
        content:
          "Pause, duplicate or delete a service, and see what happens to bookings already in the calendar.",
      },
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
  const { service: s, owner, pending, error, retry } = useService(id);
  const refresh = useRefreshServices();
  const updateStatus = useServerFn(setServiceStatus);
  const duplicate = useServerFn(duplicateService);
  const remove = useServerFn(deleteService);
  const [busy, setBusy] = useState<"status" | "duplicate" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duplicated, setDuplicated] = useState(false);

  // Only the owner manages a service; anyone else, and a signed-out viewer, gets not found.
  if (pending || error || !s || !owner) {
    return (
      <Screen>
        <TopBar title="Manage" back="/services" />
        <div className="px-5 pt-6">
          {pending ? (
            <Loading />
          ) : error ? (
            <StateCard
              tone="error"
              title="We couldn't load this service"
              body="Check your connection and try again."
              action={<Btn onClick={retry}>Retry</Btn>}
            />
          ) : (
            <EmptyState
              title="Service not found"
              body="This service may have already been deleted."
            />
          )}
        </div>
      </Screen>
    );
  }

  const status = s.status;

  async function run(kind: NonNullable<typeof busy>, action: () => Promise<unknown>) {
    setBusy(kind);
    try {
      await action();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this service");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <TopBar title="Manage service" subtitle={s.name} back={`/services/${s.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{s.name}</p>
            </div>
            <StatusPill label={status} tone={serviceStatusTone[status]} />
          </div>
        </Card>

        {status === "paused" ? (
          <Card>
            <p className="text-sm font-semibold">This service is paused</p>
            <p className="mt-1 text-1 text-muted-foreground">
              It is hidden from Discover and search, and no new enquiries can come in. Bookings
              already confirmed still stand.
            </p>
          </Card>
        ) : null}

        <div className="space-y-2">
          <Row
            icon={status === "active" ? <EyeOff size={iconSize.sm} /> : <Eye size={iconSize.sm} />}
            title={status === "active" ? "Pause this service" : "Make it live again"}
            subtitle={
              status === "active" ? "Hide it while you are full" : "Show it in Discover and search"
            }
            onClick={() => {
              if (busy) return;
              void run("status", async () => {
                await updateStatus({
                  data: { id: s.id, status: status === "active" ? "paused" : "active" },
                });
                await refresh();
              });
            }}
          />
          <Row
            icon={<Copy size={iconSize.sm} />}
            title="Duplicate"
            subtitle={duplicated ? "Copy created as a draft" : "Start a new service from this one"}
            onClick={() => {
              if (busy) return;
              void run("duplicate", async () => {
                await duplicate({ data: { id: s.id } });
                setDuplicated(true);
                await refresh();
              });
            }}
          />
          <Row
            icon={<Trash2 size={iconSize.sm} />}
            title="Delete this service"
            subtitle="Permanent, and it cannot be restored"
            onClick={() => setConfirmDelete(true)}
          />
        </div>

        <Card>
          <p className="text-sm font-semibold">Before you delete</p>
          <p className="mt-1 text-1 text-muted-foreground">
            Deleting removes the listing and its reviews' link to it. Confirmed bookings are
            unaffected and stay in your calendar.
          </p>
        </Card>
      </div>

      <Dialog
        open={confirmDelete}
        title={`Delete "${s.name}"?`}
        body="This cannot be undone. If you only want a break, pause it instead."
        onClose={() => setConfirmDelete(false)}
      >
        <Btn
          loading={busy === "delete"}
          onClick={() =>
            void run("delete", () => remove({ data: { id: s.id } })).then((ok) => {
              if (!ok) return;
              void navigate({ to: "/services" }).then(() => refresh());
            })
          }
        >
          Delete service
        </Btn>
        <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>
          Keep it
        </Btn>
      </Dialog>
    </Screen>
  );
}
