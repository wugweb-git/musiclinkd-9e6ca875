import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Users, Pencil, PauseCircle, XCircle } from "lucide-react";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, Row, StatusPill, EmptyState, Dialog } from "@/components/ml/kit";
import { statusTone } from "@/components/ml/opportunity";
import { myOpportunities, closeReasons } from "@/data/opportunities";

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
  const o = myOpportunities.find((x) => x.id === id);
  const [close, setClose] = useState(false);
  const [closed, setClosed] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  if (!o) {
    return (
      <Screen>
        <TopBar title="Manage" back="/opportunities/mine" />
        <div className="px-5 pt-6">
          <EmptyState title="Opportunity not found" body="It may already be closed." />
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
            <StatusPill
              label={paused ? "paused" : o.status}
              tone={paused ? "warn" : statusTone(o.status)}
            />
            <span className="text-[12px] text-muted-foreground">{o.closesAt}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "Views", value: o.views },
              { label: "Applicants", value: o.applicants },
              { label: "Shortlisted", value: o.applicantSummary.shortlisted },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-subtle p-3">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-[17px] font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-2">
          <Row
            icon={<Users size={16} />}
            title="Applicants"
            subtitle={`${o.applicantSummary.new} new`}
            to="/opportunities/$id/applicants"
            params={{ id }}
          />
          <Row
            icon={<BarChart3 size={16} />}
            title="Analytics"
            subtitle="Views, saves, conversion"
            to="/opportunities/$id/analytics"
            params={{ id }}
          />
          <Row
            icon={<Pencil size={16} />}
            title="Edit details"
            subtitle="Title, budget, requirements"
            to="/opportunities/new"
          />
          <Row
            icon={<PauseCircle size={16} />}
            title={paused ? "Resume opportunity" : "Pause applications"}
            subtitle={
              paused
                ? "Visible and accepting applications"
                : "Stays visible, stops new applications"
            }
            onClick={() => setPaused((p) => !p)}
            right={
              <span className="text-[12px] font-semibold text-primary">
                {paused ? "Resume" : "Pause"}
              </span>
            }
          />
          <Row
            icon={<XCircle size={16} />}
            title="Close opportunity"
            subtitle="Tell applicants the outcome"
            onClick={() => setClose(true)}
            right={<span className="text-[12px] font-semibold text-primary">Close</span>}
          />
        </div>

        <Card className="space-y-1">
          <p className="text-[13px] font-semibold">Hired someone?</p>
          <p className="text-[12px] text-muted-foreground">
            Convert the shortlist into a booking or a collaboration — reviews only come from
            completed work.
          </p>
          <Link to="/bookings">
            <Btn variant="ghost" className="w-full">
              Open bookings
            </Btn>
          </Link>
        </Card>
      </div>

      <Sheet open={close} onClose={() => setClose(false)} title="Why are you closing?">
        <div className="space-y-2">
          {closeReasons.map((r) => (
            <Btn
              key={r}
              variant="outline"
              className="w-full"
              onClick={() => {
                setClose(false);
                setClosed(r);
              }}
            >
              {r}
            </Btn>
          ))}
        </div>
      </Sheet>

      <Dialog
        open={closed !== null}
        title="Opportunity closed"
        body={`Applicants were notified: ${closed ?? ""}. It stays in your archive with all applications.`}
        onClose={() => setClosed(null)}
      >
        <Link to="/opportunities/mine">
          <Btn className="w-full">Back to my opportunities</Btn>
        </Link>
      </Dialog>
    </Screen>
  );
}
