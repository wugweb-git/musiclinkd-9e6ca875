import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import { BusinessOnlyGate, EmptyState, Loading } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { StickyBar } from "@/components/ml/booking";
import { getMyStudio, updateMyStudio } from "@/lib/studio-owner.functions";

export const Route = createFileRoute("/business/policies")({
  head: () => ({
    meta: [
      { title: "Booking policies — MusicLinkd provider" },
      {
        name: "description",
        content: "The cancellation and other rules customers see before they book your space.",
      },
      { property: "og:title", content: "Booking policies — MusicLinkd provider" },
      {
        property: "og:description",
        content: "The rules customers agree to when booking your space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Policies,
});

function PoliciesContent() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyStudio);
  const save = useServerFn(updateMyStudio);
  const q = useQuery({ queryKey: ["business", "studio", "mine"], queryFn: () => load() });
  const [text, setText] = useState("");
  useEffect(() => setText(q.data?.cancellation_policy ?? ""), [q.data]);

  async function onSave() {
    try {
      await save({ data: { cancellation_policy: text.trim() || null } });
      await queryClient.invalidateQueries({ queryKey: ["business", "studio", "mine"] });
      toast.success("Policies saved");
    } catch {
      toast.error("Couldn't save that — try again");
    }
  }

  if (q.isLoading) {
    return (
      <div className="px-5 pt-8">
        <Loading />
      </div>
    );
  }
  if (!q.data) {
    return (
      <div className="px-5 pt-4">
        <EmptyState title="No studio yet" body="Set up your studio profile first." />
      </div>
    );
  }

  return (
    <>
      <main className="space-y-6 px-5 pb-40 pt-4">
        <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
          Customers see this before they request a session. One combined policy field is supported
          today — separate reschedule, overtime, arrival and equipment terms aren't yet.
        </p>

        <section className="min-w-0">
          <label htmlFor="policy" className="text-2">
            Cancellation &amp; other policies
          </label>
          <textarea
            id="policy"
            rows={8}
            value={text}
            placeholder="What happens when a customer cancels, reschedules, or runs over — and any arrival or equipment rules."
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full resize-none rounded-lg border border-border bg-card p-4 text-1 leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </section>
      </main>

      <StickyBar
        primaryLabel="Save policies"
        hint="Applies to new bookings only"
        onPrimary={() => void onSave()}
      />
    </>
  );
}

function Policies() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <Screen bottomNav={false}>
        <TopBar title="Policies" subtitle="Your space" back="/business/bookings" />
        <PoliciesContent />
      </Screen>
    </BusinessOnlyGate>
  );
}
