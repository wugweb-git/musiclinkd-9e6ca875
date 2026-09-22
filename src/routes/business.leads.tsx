import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Screen, TopBar } from "@/components/ml/ui";
import { EmptyState, Loading } from "@/components/ml/kit";
import { useMyBusinessIdentity } from "@/hooks/use-my-business-identity";

/*
 * Leads from the menu: opens the signed-in business's own Leads inbox (/business/<username>/leads),
 * the screen an enquiry's notice opens too.
 */
export const Route = createFileRoute("/business/leads")({
  head: () => ({
    meta: [{ title: "Leads | MusicLinkd" }, { name: "robots", content: "noindex" }],
  }),
  component: MyLeads,
});

function MyLeads() {
  const navigate = useNavigate();
  const me = useMyBusinessIdentity();

  useEffect(() => {
    if (me.username) {
      void navigate({ to: "/business/$id/leads", params: { id: me.username }, replace: true });
    }
  }, [me.username, navigate]);

  return (
    <Screen>
      <TopBar title="Leads" back="/business" />
      <div className="px-5 pt-6">
        {me.ready && !me.username ? (
          <EmptyState
            title="Leads are for a business page"
            body="Switch to your business page to see the enquiries it has received."
          />
        ) : (
          <Loading rows={2} />
        )}
      </div>
    </Screen>
  );
}
