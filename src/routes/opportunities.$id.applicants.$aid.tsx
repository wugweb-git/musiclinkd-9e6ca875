import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Star, CalendarDays } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet, VerifiedBadge } from "@/components/ml/ui";
import { Card, StatusPill, ReasonChip, EmptyState, Dialog } from "@/components/ml/kit";
import { applicants } from "@/data/opportunities";

export const Route = createFileRoute("/opportunities/$id/applicants/$aid")({
  head: ({ params }) => {
    const a = applicants.find((x) => x.id === params.aid && x.opportunityId === params.id);
    const title = `${a?.name ?? "Applicant"} · application | MusicLinkd`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: "Applicant profile, attached portfolio, fit reasons and shortlist actions.",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: "Review an applicant's work before you shortlist." },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ApplicantDetail,
});

function ApplicantDetail() {
  const { id, aid } = Route.useParams();
  // An applicant only opens under the opportunity they applied to.
  const a = applicants.find((x) => x.id === aid && x.opportunityId === id);
  const [decision, setDecision] = useState<"shortlist" | "reject" | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [hire, setHire] = useState(false);

  if (!a) {
    return (
      <Screen>
        <TopBar title="Applicant" back="/opportunities/mine" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Applicant not found"
            body="This application may have been withdrawn."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Applicant" subtitle={a.appliedAt} back="/opportunities/mine" />
      <div className="space-y-4 px-5 pt-4 pb-28">
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <img src={a.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-2.5 leading-tight">{a.name}</h1>
                {a.verified ? <VerifiedBadge size={15} /> : null}
              </div>
              <p className="truncate text-1 text-muted-foreground">{a.headline}</p>
              <p className="mt-0.5 flex items-center gap-1 text-1 text-muted-foreground">
                <Star size={12} className="text-primary" fill="currentColor" /> {a.rating} ·{" "}
                {a.city}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <StatusPill label={a.status} tone={a.status === "shortlisted" ? "brand" : "neutral"} />
            <span className="text-1 font-bold text-foreground">{a.matchScore}% fit</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {a.matchReasons.map((r) => (
              <ReasonChip key={r}>{r}</ReasonChip>
            ))}
          </div>
          <BtnLink
            to="/profile/$username"
            params={{ username: a.username }}
            variant="outline"
            className="w-full"
          >
            View Full Profile
          </BtnLink>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm">Their message</h2>
          <p className="text-1 text-muted-foreground">{a.message}</p>
        </Card>

        <section>
          <h2 className="mb-2 text-sm">Attached work</h2>
          <div className="grid grid-cols-2 gap-2">
            {a.portfolio.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-[20px] border border-border bg-card"
              >
                <img src={p.cover} alt="" className="h-24 w-full object-cover" />
                <div className="p-3">
                  <p className="truncate text-1 font-semibold">{p.title}</p>
                  <p className="text-0 text-muted-foreground">{p.kind}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <BtnLink to="/messages" variant="outline" className="w-full">
          <span className="inline-flex items-center gap-2">
            <MessageCircle size={16} /> Message {a.name.split(" ")[0]}
          </span>
        </BtnLink>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-2">
          <Btn variant="outline" className="flex-1" onClick={() => setDecision("reject")}>
            Not a Fit
          </Btn>
          {a.status === "shortlisted" ? (
            <Btn className="flex-1" onClick={() => setHire(true)}>
              Hire
            </Btn>
          ) : (
            <Btn className="flex-1" onClick={() => setDecision("shortlist")}>
              Shortlist
            </Btn>
          )}
        </div>
      </div>

      <Dialog
        open={decision !== null}
        title={decision === "reject" ? "Tell them it's a no?" : "Shortlist this applicant?"}
        body={
          decision === "reject"
            ? "They'll see a polite 'not selected' update. Their profile stays saved for future posts."
            : "Shortlisting opens a conversation and moves them to the top of your list."
        }
        onClose={() => setDecision(null)}
      >
        <Btn
          onClick={() => {
            setConfirmed(
              decision === "reject" ? "Applicant declined" : "Shortlisted — conversation opened",
            );
            setDecision(null);
          }}
        >
          {decision === "reject" ? "Send decline" : "Shortlist"}
        </Btn>
        <Btn variant="ghost" onClick={() => setDecision(null)}>
          Cancel
        </Btn>
      </Dialog>

      <Dialog open={confirmed !== null} title={confirmed ?? ""} onClose={() => setConfirmed(null)}>
        <BtnLink to="/opportunities/$id/applicants" params={{ id }} className="w-full">
          Back to Applicants
        </BtnLink>
      </Dialog>

      <Sheet open={hire} onClose={() => setHire(false)} title="How do you want to work together?">
        <div className="space-y-2">
          {a?.serviceId ? (
            <BtnLink to="/services/$id/enquiry" params={{ id: a.serviceId }} className="w-full">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} /> Enquire About Their Service
              </span>
            </BtnLink>
          ) : null}
          <BtnLink
            to="/collab/new"
            variant={a?.serviceId ? "outline" : "primary"}
            className="w-full"
          >
            Start a Collaboration
          </BtnLink>
          <BtnLink to="/messages" variant="ghost" className="w-full">
            Keep Talking First
          </BtnLink>
        </div>
      </Sheet>
    </Screen>
  );
}
