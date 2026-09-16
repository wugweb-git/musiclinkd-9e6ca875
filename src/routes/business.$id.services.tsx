import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, Price, Row, StatusPill } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import { useRefreshServices } from "@/hooks/use-services";
import { businessView, loadBusiness } from "@/lib/business-view";
import { setServiceStatus } from "@/lib/services.functions";

const statusPill = {
  active: { label: "Live", tone: "good" },
  paused: { label: "Paused", tone: "warn" },
  draft: { label: "Draft", tone: "neutral" },
} as const;

export const Route = createFileRoute("/business/$id/services")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business services | MusicLinkd" },
      {
        name: "description",
        content:
          "Manage the rooms, sessions and services this business offers, with pricing and status.",
      },
      { property: "og:title", content: "Business services | MusicLinkd" },
      { property: "og:description", content: "Rooms, sessions and pricing for your business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessServices,
});

function BusinessServices() {
  const b = businessView(Route.useLoaderData());
  const router = useRouter();
  const { user } = useAuth();
  const updateStatus = useServerFn(setServiceStatus);
  const refresh = useRefreshServices();
  const [busy, setBusy] = useState<string | null>(null);
  // Only the signed-in owner edits or pauses; imported business accounts cannot sign in yet.
  const owner = Boolean(b && user && user.id === b.profileId);

  async function toggle(id: string, status: "active" | "paused" | "draft") {
    setBusy(id);
    try {
      await updateStatus({ data: { id, status: status === "active" ? "paused" : "active" } });
      await Promise.all([router.invalidate(), refresh()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this service");
    } finally {
      setBusy(null);
    }
  }

  if (!b) {
    return (
      <Screen>
        <TopBar title="Services" back="/business" />
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
      <TopBar
        title="Services"
        subtitle={b.name}
        back={`/business/${b.id}`}
        right={
          <Link
            to="/services/new"
            search={{ step: "category" as const }}
            aria-label="Add service"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus size={18} />
          </Link>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Row
          icon={<CalendarClock size={16} />}
          title="Business availability"
          subtitle="Opening hours, blackout dates, notice"
          to="/business/$id/availability"
          params={{ id: b.id }}
        />

        <div className="space-y-3">
          {b.services.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.label}</p>
                  {s.category ? (
                    <p className="truncate text-1 text-muted-foreground">{s.category}</p>
                  ) : null}
                  <Price price={s.price} className="mt-1" amountClassName="text-1" />
                </div>
                <StatusPill label={statusPill[s.status].label} tone={statusPill[s.status].tone} />
              </div>
              {owner ? (
                <div className="mt-3 flex gap-2">
                  <BtnLink
                    to="/services/new"
                    search={{ step: "category" as const, id: s.id }}
                    variant="outline"
                    className="flex-1"
                  >
                    Edit
                  </BtnLink>
                  <Btn
                    variant="ghost"
                    className="flex-1"
                    loading={busy === s.id}
                    onClick={() => void toggle(s.id, s.status)}
                  >
                    {s.status === "active" ? "Pause" : "Publish"}
                  </Btn>
                </div>
              ) : null}
            </Card>
          ))}
        </div>

        <Card>
          <p className="text-sm font-semibold">Rooms as bookable spaces</p>
          <p className="mt-1 text-1 text-muted-foreground">
            Each space carries its own rate and calendar. Customers pick the room before they pick a
            date.
          </p>
          <div className="mt-3 space-y-2">
            {b.spaces.map((sp) => (
              <div
                key={sp.id}
                className="flex items-center justify-between rounded-[16px] border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-1 font-semibold">{sp.name}</p>
                  {sp.capacity ? (
                    <p className="truncate text-1 text-muted-foreground">{sp.capacity}</p>
                  ) : null}
                  <Price price={sp.rate} amountClassName="text-1 font-semibold" />
                </div>
                <StatusPill label="Bookable" tone="brand" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Screen>
  );
}
