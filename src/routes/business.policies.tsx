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
import { getMyBusiness, updateMyBusiness } from "@/lib/profile-groups.functions";
import { PoliciesEditor } from "@/components/ml/studio-setup";

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

/**
 * The business's rules (profile_business.policies), with the same editor as Create business, and
 * for a studio its cancellation terms (studios.cancellation_policy), shown when booking.
 */
function PoliciesContent() {
  const queryClient = useQueryClient();
  const loadBusiness = useServerFn(getMyBusiness);
  const saveBusiness = useServerFn(updateMyBusiness);
  const loadStudio = useServerFn(getMyStudio);
  const saveStudio = useServerFn(updateMyStudio);
  const business = useQuery({ queryKey: ["business", "me"], queryFn: () => loadBusiness() });
  const studio = useQuery({
    queryKey: ["business", "studio", "mine"],
    queryFn: () => loadStudio(),
  });
  const [policies, setPolicies] = useState<string[]>([]);
  const [cancellation, setCancellation] = useState("");
  useEffect(() => setPolicies(business.data?.business.policies ?? []), [business.data]);
  useEffect(() => setCancellation(studio.data?.cancellation_policy ?? ""), [studio.data]);
  const [saving, setSaving] = useState(false);
  const cleaned = policies.map((p) => p.trim()).filter(Boolean);

  async function onSave() {
    if (!cleaned.length) {
      toast.error("Add at least one policy.");
      return;
    }
    setSaving(true);
    try {
      await saveBusiness({ data: { policies: cleaned } });
      if (studio.data) {
        await saveStudio({ data: { cancellation_policy: cancellation.trim() || null } });
      }
      await queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Policies saved");
    } catch {
      toast.error("Couldn't save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (business.isLoading || studio.isLoading) {
    return (
      <div className="px-5 pt-8">
        <Loading />
      </div>
    );
  }
  if (!business.data) {
    return (
      <div className="px-5 pt-4">
        <EmptyState title="No business yet" body="Create your business first." />
      </div>
    );
  }

  return (
    <>
      <main className="space-y-8 px-5 pb-40 pt-4">
        <section className="space-y-3">
          <div>
            <h2 className="text-2">Policies</h2>
            <p className="mt-1 text-1 text-muted-foreground">
              Your rules, one per line. They show on your page.
            </p>
          </div>
          <PoliciesEditor value={policies} onChange={setPolicies} />
        </section>
        {studio.data ? (
          <section className="min-w-0">
            <label htmlFor="policy" className="text-2">
              Cancellation
            </label>
            <textarea
              id="policy"
              rows={5}
              value={cancellation}
              placeholder="What happens when a customer cancels or reschedules."
              onChange={(e) => setCancellation(e.target.value)}
              className="mt-2 w-full resize-none rounded-lg border border-border bg-card p-4 text-1 leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </section>
        ) : null}
      </main>

      <StickyBar
        primaryLabel={saving ? "Saving…" : "Save policies"}
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
