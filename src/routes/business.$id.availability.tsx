import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { businessView, loadBusiness } from "@/lib/business-view";
import { updateMyBusiness } from "@/lib/profile-groups.functions";

export const Route = createFileRoute("/business/$id/availability")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business availability | MusicLinkd" },
      {
        name: "description",
        content: "Set the opening hours customers see on your business profile.",
      },
      { property: "og:title", content: "Business availability | MusicLinkd" },
      { property: "og:description", content: "Opening hours for your business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessAvailability,
});

function BusinessAvailability() {
  const queryClient = useQueryClient();
  const loaderData = Route.useLoaderData();
  const b = businessView(loaderData);
  const save = useServerFn(updateMyBusiness);
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setHours(loaderData.record?.business.operating_hours ?? "");
  }, [loaderData]);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Availability" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or you no longer have access to it."
          />
        </div>
      </Screen>
    );
  }

  async function onSave() {
    setSaving(true);
    try {
      await save({ data: { operating_hours: hours.trim() || null } });
      await queryClient.invalidateQueries();
      toast.success("Availability saved");
    } catch {
      toast.error("Couldn't save availability");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Availability" subtitle={b.name} back={`/business/${b.id}/services`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
          A single opening-hours line customers see on your business page. Notice period and
          blackout dates aren't supported yet.
        </p>

        <Card>
          <p className="text-sm font-semibold">Opening hours</p>
          <textarea
            rows={3}
            value={hours}
            placeholder="e.g. Mon–Sat, 10am–7pm. Closed Sundays."
            onChange={(e) => setHours(e.target.value)}
            className="mt-2 w-full resize-none rounded-lg border border-border bg-background p-3 text-1 leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </Card>

        <Btn className="w-full" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving…" : "Save availability"}
        </Btn>
      </div>
    </Screen>
  );
}
