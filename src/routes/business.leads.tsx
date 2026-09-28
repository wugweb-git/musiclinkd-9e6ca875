import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Screen, TopBar } from "@/components/ml/ui";
import { BusinessOnlyGate, Loading } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { useMyBusinessIdentity } from "@/hooks/use-my-business-identity";

/*
 * Leads from the menu: opens the signed-in business's own Leads inbox (/business/<username>/leads),
 * the screen an enquiry's notice opens too. One gate for the whole business area — this screen used
 * to roll its own empty state, which made the same "business only" idea read three different ways
 * (owner, 28 Sep 2026).
 */
export const Route = createFileRoute("/business/leads")({
  head: () => ({
    meta: [{ title: "Leads | MusicLinkd" }, { name: "robots", content: "noindex" }],
  }),
  component: MyLeads,
});

function MyLeads() {
  const gate = useRequireBusiness();
  return (
    <Screen>
      <TopBar title="Leads" back="/home" />
      <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
        <ToMyLeads />
      </BusinessOnlyGate>
    </Screen>
  );
}

/** Past the gate this account has a business page, so send it to that page's own Leads inbox. */
function ToMyLeads() {
  const navigate = useNavigate();
  const me = useMyBusinessIdentity();
  useEffect(() => {
    if (me.username) {
      void navigate({ to: "/business/$id/leads", params: { id: me.username }, replace: true });
    }
  }, [me.username, navigate]);
  return (
    <div className="px-5 pt-6">
      <Loading rows={2} />
    </div>
  );
}
