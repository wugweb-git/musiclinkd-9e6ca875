import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarClock,
  EyeOff,
  Image,
  Headphones,
  LayoutDashboard,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Row, EmptyState, Dialog, StatusPill } from "@/components/ml/kit";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { deleteMyBusiness } from "@/lib/business-account.functions";
import { deactivateMyAccount } from "@/lib/account.functions";
import { businessView, loadBusiness } from "@/lib/business-view";
import { joinParts } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/business/$id/manage")({
  loader: ({ params }) => loadBusiness(params.id),
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
  const b = businessView(Route.useLoaderData());
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const remove = useServerFn(deleteMyBusiness);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const deactivate = useServerFn(deactivateMyAccount);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  async function onDeactivate() {
    setDeactivating(true);
    try {
      await deactivate();
      await queryClient.invalidateQueries();
      toast.success("Deactivated. Reactivate any time from Settings.");
      setConfirmDeactivate(false);
      void navigate({ to: "/settings" });
    } catch {
      toast.error("That didn't go through. Try again.");
    } finally {
      setDeactivating(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      const result = await remove();
      if (result.status === "upcoming") {
        toast.error(
          `${result.count} upcoming ${result.count === 1 ? "booking" : "bookings"} must be cancelled or handed over first.`,
        );
      } else {
        setDeleted(true);
        await queryClient.invalidateQueries();
      }
    } catch {
      toast.error("That didn't go through. Try again.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  // Everything here acts on the signed-in account's own business, so only its owner sees it.
  if (!b || (!loading && !deleted && user?.id !== b.profileId)) {
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
          {b.logo ? (
            <img src={b.logo} alt="" className="h-12 w-12 rounded-sm object-cover" loading="lazy" />
          ) : (
            <div aria-hidden className="h-12 w-12 shrink-0 rounded-sm bg-subtle" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{b.name}</p>
            <p className="truncate text-1 text-muted-foreground">
              {joinParts(b.typeLabel, b.city)}
            </p>
          </div>
          <StatusPill
            label={b.verified ? "verified" : "unverified"}
            tone={b.verified ? "good" : "neutral"}
          />
        </Card>

        <div className="space-y-2">
          <Row
            icon={<LayoutDashboard size={iconSize.sm} />}
            title="Dashboard"
            subtitle="Leads, analytics, services, reviews"
            to="/business/$id/dashboard"
            params={{ id }}
          />
          <Row
            icon={<Pencil size={iconSize.sm} />}
            title="Details"
            subtitle="Name, about, contact, hours"
            to="/profile/edit"
          />
          <Row
            icon={<Image size={iconSize.sm} />}
            title="Photos & spaces"
            subtitle={`${b.spaces.length} bookable spaces`}
            to="/business/availability"
            hash="facilities"
          />
          <Row
            icon={<CalendarClock size={iconSize.sm} />}
            title="Availability & bookings"
            subtitle="Calendar, requests, policies"
            to="/business/bookings/calendar"
          />
          <Row
            icon={<Headphones size={iconSize.sm} />}
            title="Equipment"
            subtitle="Gear on your studio page"
            to="/business/availability"
            hash="equipment"
          />
          <Row
            icon={<ShieldCheck size={iconSize.sm} />}
            title="Business verification"
            subtitle={b.verified ? "Verified — renews yearly" : "Get the verified badge"}
            to="/business/$id/verification"
            params={{ id }}
          />
        </div>

        <Card className="space-y-2">
          <p className="flex items-center gap-2 text-1 font-semibold">
            <EyeOff size={iconSize.sm} /> Deactivate business
          </p>
          <p className="text-1 text-muted-foreground">
            Hides the profile and studio from everyone until you reactivate. Nothing is deleted.
          </p>
          <Btn variant="outline" className="w-full" onClick={() => setConfirmDeactivate(true)}>
            Deactivate {b.name}
          </Btn>
        </Card>

        <Card className="space-y-2">
          <p className="flex items-center gap-2 text-1 font-semibold">
            <Trash2 size={iconSize.sm} /> Delete business
          </p>
          <p className="text-1 text-muted-foreground">
            Permanently deletes the profile, studio, equipment, photos and reviews. Customers keep
            their own record of past sessions.
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
          <Btn className="w-full" loading={deleting} onClick={() => void onDelete()}>
            Yes, Delete
          </Btn>
          <Btn variant="ghost" className="w-full" onClick={() => setConfirmDelete(false)}>
            Keep It
          </Btn>
        </div>
      </Dialog>

      <Dialog
        open={confirmDeactivate}
        title={`Deactivate ${b.name}?`}
        body="Nobody can find or open it until you reactivate it from Settings. Bookings already made stay as they are."
        onClose={() => setConfirmDeactivate(false)}
      >
        <div className="space-y-2">
          <Btn className="w-full" loading={deactivating} onClick={() => void onDeactivate()}>
            Yes, Deactivate
          </Btn>
          <Btn variant="ghost" className="w-full" onClick={() => setConfirmDeactivate(false)}>
            Keep It
          </Btn>
        </div>
      </Dialog>

      <Dialog
        open={deleted}
        title="Business deleted"
        body="The business and its studio are deleted from MusicLinkd."
        onClose={() => setDeleted(false)}
      >
        <BtnLink to="/business" className="w-full">
          Back to Businesses
        </BtnLink>
      </Dialog>
    </Screen>
  );
}
