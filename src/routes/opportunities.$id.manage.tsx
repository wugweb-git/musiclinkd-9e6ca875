import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BarChart3, Users, Pencil, XCircle } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, Row, StatusPill, EmptyState, Dialog, Loading } from "@/components/ml/kit";
import { statusTone } from "@/components/ml/opportunity";
import { myOpportunities } from "@/data/opportunities";
import { useMyDbOpportunities } from "@/hooks/use-my-opportunities";
import { setOpportunityStatus } from "@/lib/catalog.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/opportunities/$id/manage")({
  head: () => ({
    meta: [
      { title: "Manage opportunity | MusicLinkd" },
      { name: "description", content: "Edit, pause, analyse or close an opportunity you posted." },
      { property: "og:title", content: "Manage opportunity | MusicLinkd" },
      { property: "og:description", content: "Opportunity management, analytics and closing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageOpportunity,
});

function ManageOpportunity() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  // Signed in: the user's own stored opportunities resolve too.
  const mine = useMyDbOpportunities();
  const isReal = mine.items.some((x) => x.id === id);
  const o = mine.items.find((x) => x.id === id) ?? myOpportunities.find((x) => x.id === id);
  const setStatus = useServerFn(setOpportunityStatus);
  const [close, setClose] = useState(false);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function closeIt() {
    setClose(false);
    if (!isReal) {
      setClosed(true);
      return;
    }
    setBusy(true);
    try {
      await setStatus({ data: { id, status: "closed" } });
      await queryClient.invalidateQueries({ queryKey: ["opportunities", "mine"] });
      setClosed(true);
    } catch {
      toast.error("Couldn't close that — try again");
    } finally {
      setBusy(false);
    }
  }

  if (!o) {
    return (
      <Screen>
        <TopBar title="Manage" back="/opportunities/mine" />
        <div className="px-5 pt-6">
          {mine.pending ? (
            <Loading rows={3} />
          ) : (
            <EmptyState title="Opportunity not found" body="It may already be closed." />
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Manage" subtitle={o.title} back="/opportunities/mine" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <StatusPill label={o.status} tone={statusTone(o.status)} />
            {o.closesAt ? <span className="text-1 text-muted-foreground">{o.closesAt}</span> : null}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Stored opportunities record no views or shortlist; only their applicant count shows. */}
            {[
              ...(o.applicantSummary ? [{ label: "Views", value: o.views }] : []),
              { label: "Applicants", value: o.applicants },
              ...(o.applicantSummary
                ? [{ label: "Shortlisted", value: o.applicantSummary.shortlisted }]
                : []),
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-subtle p-3">
                <p className="text-1 text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2 font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-2">
          <Row
            icon={<Users size={iconSize.sm} />}
            title="Applicants"
            {...(o.applicantSummary ? { subtitle: `${o.applicantSummary.new} new` } : {})}
            to="/opportunities/$id/applicants"
            params={{ id }}
          />
          <Row
            icon={<BarChart3 size={iconSize.sm} />}
            title="Analytics"
            subtitle="Views, saves, conversion"
            to="/opportunities/$id/analytics"
            params={{ id }}
          />
          <Row
            icon={<Pencil size={iconSize.sm} />}
            title="Edit details"
            subtitle="Title, budget, requirements"
            to="/opportunities/new"
          />
          <Row
            icon={<XCircle size={iconSize.sm} />}
            title="Close opportunity"
            subtitle="Stops new applications"
            onClick={() => setClose(true)}
            right={<span className="text-1 font-semibold text-foreground">Close</span>}
          />
        </div>

        <Card className="space-y-1">
          <p className="text-1 font-semibold">Hired someone?</p>
          <p className="text-1 text-muted-foreground">
            Convert the shortlist into a booking or a collaboration — reviews only come from
            completed work.
          </p>
          <BtnLink to="/bookings" variant="ghost" className="w-full">
            Open Bookings
          </BtnLink>
        </Card>
      </div>

      <Dialog
        open={close}
        title="Close this opportunity?"
        body="It stops accepting new applications. Existing applications stay visible."
        onClose={() => setClose(false)}
      >
        <Btn onClick={() => void closeIt()} disabled={busy}>
          {busy ? "Closing…" : "Close opportunity"}
        </Btn>
        <Btn variant="ghost" onClick={() => setClose(false)} disabled={busy}>
          Keep it open
        </Btn>
      </Dialog>

      <Dialog
        open={closed}
        title="Opportunity closed"
        body="It stays in your archive with all applications."
        onClose={() => setClosed(false)}
      >
        <BtnLink to="/opportunities/mine" className="w-full">
          Back to My Opportunities
        </BtnLink>
      </Dialog>
    </Screen>
  );
}
