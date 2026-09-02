import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, StatusPill, Meter, EmptyState, Dialog, Row } from "@/components/ml/kit";
import { verificationTypes, myVerifications, statusLabel, statusTone, verificationSteps } from "@/data/verification";

export const Route = createFileRoute("/verification/$type")({
  head: () => ({
    meta: [
      { title: "Verification Request | MusicLinkd" },
      { name: "description", content: "Submit documents and track the review of your MusicLinkd verification request." },
      { property: "og:title", content: "Verification Request | MusicLinkd" },
      { property: "og:description", content: "Submit documents and track your verification review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificationDetail,
});

function VerificationDetail() {
  const { type } = Route.useParams();
  const def = verificationTypes.find((t) => t.key === type);
  const req = myVerifications.find((v) => v.type === type);
  const [step, setStep] = useState(req ? 3 : 1);
  const [uploaded, setUploaded] = useState<string[]>(req?.documents.filter((d) => d.state === "uploaded").map((d) => d.name) ?? []);
  const [submitted, setSubmitted] = useState(false);

  if (!def) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Verification" back="/verification" />
        <div className="px-5 pt-8"><EmptyState title="Unknown verification type" body="This badge is not available for your account type." /></div>
      </Screen>
    );
  }

  const status = req?.status ?? "unverified";
  const stepLabel = verificationSteps[Math.min(step, verificationSteps.length - 1)]!;

  return (
    <Screen bottomNav={false}>
      <TopBar title={def.title} subtitle={stepLabel} back="/verification" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <div className="flex items-center justify-between gap-3">
          <StatusPill label={statusLabel[status]} tone={statusTone[status]} />
          <span className="text-[12px] text-muted-foreground">{def.turnaround}</span>
        </div>
        <Meter label="Progress" value={step + 1} max={verificationSteps.length} hint={`${step + 1}/${verificationSteps.length}`} />

        {status === "verified" ? (
          <Card className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-success" aria-hidden />
              <h2 className="text-[17px] leading-tight">Verified</h2>
            </div>
            <p className="text-[13px] text-text2">Approved on {req?.decided} by {req?.reviewer}. The badge now shows on your profile, listings, reviews and messages.</p>
            <Link to="/me"><Btn variant="outline" className="w-full">View my profile</Btn></Link>
          </Card>
        ) : null}

        {status === "in_review" ? (
          <Card className="space-y-2">
            <h2 className="text-[17px] leading-tight">In review</h2>
            <p className="text-[13px] text-text2">Submitted {req?.submitted}. A reviewer checks each document by hand — you will get a notification when there is a decision.</p>
            <p className="text-[12px] text-muted-foreground">You can withdraw and resubmit while it is in review.</p>
            <Btn variant="ghost" className="w-full">Withdraw request</Btn>
          </Card>
        ) : null}

        {status === "rejected" ? (
          <Card className="space-y-2">
            <h2 className="text-[17px] leading-tight">Needs changes</h2>
            <p className="text-[13px] text-text2">{req?.reason}</p>
            <p className="text-[12px] text-muted-foreground">Reviewed {req?.decided}</p>
          </Card>
        ) : null}

        <Card>
          <h2 className="text-[15px]">What we need</h2>
          <ul className="mt-3 space-y-2">
            {def.requirements.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] text-text2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-[15px]">Documents</h2>
          {def.requirements.map((r) => {
            const doc = req?.documents.find((d) => d.name.startsWith(r.split(" ")[0] ?? ""));
            const done = uploaded.includes(r) || doc?.state === "uploaded";
            return (
              <button
                key={r}
                type="button"
                onClick={() => setUploaded((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}
                className="flex w-full items-center gap-3 rounded-[20px] border border-border bg-background px-4 py-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-primary">
                  {done ? <FileText size={16} aria-hidden /> : <Upload size={16} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{r}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{done ? "Attached · tap to remove" : "Tap to attach"}</span>
                </span>
                {doc?.state === "rejected" ? <StatusPill label="Rejected" tone="bad" /> : done ? <StatusPill label="Ready" tone="good" /> : null}
              </button>
            );
          })}
          <p className="text-[12px] text-muted-foreground">Documents are used only for this review and never appear on your public profile.</p>
        </Card>

        <Row title="How verification works" subtitle="What each badge means" to="/help/$slug" params={{ slug: "how-verification-works" }} />

        {status !== "verified" && status !== "in_review" ? (
          <Btn
            className="w-full"
            onClick={() => {
              setStep(verificationSteps.length - 1);
              setSubmitted(true);
            }}
          >
            {uploaded.length >= def.requirements.length ? "Submit for review" : `Attach ${def.requirements.length - uploaded.length} more to submit`}
          </Btn>
        ) : null}
      </div>

      <Dialog open={submitted} title="Submitted for review" body={`We will review this within ${def.turnaround.toLowerCase()}. You will get a notification with the decision.`} onClose={() => setSubmitted(false)}>
        <Link to="/verification"><Btn className="w-full">Back to verification</Btn></Link>
      </Dialog>
    </Screen>
  );
}
