import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { BusinessOnlyGate, EmptyState, Loading } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { getMyStudio, updateMyStudio } from "@/lib/studio-owner.functions";

export const Route = createFileRoute("/business/availability")({
  head: () => ({
    meta: [
      { title: "Manage availability — MusicLinkd provider" },
      {
        name: "description",
        content: "Set the opening hours customers see before requesting a session.",
      },
      { property: "og:title", content: "Manage availability — MusicLinkd provider" },
      {
        property: "og:description",
        content: "Opening hours for your space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Availability,
});

function Availability() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <AvailabilityContent />
    </BusinessOnlyGate>
  );
}

function AvailabilityContent() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyStudio);
  const save = useServerFn(updateMyStudio);
  const q = useQuery({ queryKey: ["business", "studio", "mine"], queryFn: () => load() });
  const [hours, setHours] = useState("");
  useEffect(() => setHours(q.data?.operating_hours ?? ""), [q.data]);

  async function onSave() {
    try {
      await save({ data: { operating_hours: hours.trim() || null } });
      await queryClient.invalidateQueries({ queryKey: ["business", "studio", "mine"] });
      toast.success("Availability saved");
    } catch {
      toast.error("Couldn't save availability");
    }
  }

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Availability" back="/business/bookings" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen>
        <TopBar title="Availability" back="/business/bookings" />
        <div className="px-5 pt-4">
          <EmptyState title="No studio yet" body="Set up your studio profile first." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Availability" subtitle={q.data.name} back="/business/bookings" />
      <main className="px-5 pt-4">
        <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
          A single opening-hours line customers see on your studio page. Per-day toggles, blocked
          dates and instant-booking rules aren't supported yet.
        </p>

        <h2 className="mt-6 text-2">Opening hours</h2>
        <textarea
          rows={3}
          value={hours}
          placeholder="e.g. Mon–Sat, 10am–10pm. Closed Sundays."
          onChange={(e) => setHours(e.target.value)}
          className="mt-2 w-full resize-none rounded-lg border border-border bg-card p-4 text-1 leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        <Btn className="mt-6 w-full" onClick={() => void onSave()}>
          Save Availability
        </Btn>
        <BtnLink to="/business/bookings" variant="ghost" className="mt-2 w-full">
          Back to Workspace
        </BtnLink>
      </main>
    </Screen>
  );
}
