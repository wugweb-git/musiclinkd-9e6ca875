import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, StatusPill } from "@/components/ml/kit";
import { businessVerificationChecks, getBusiness } from "@/data/business";

export const Route = createFileRoute("/business/$id/verification")({
  head: () => ({
    meta: [
      { title: "Verify your business | MusicLinkd" },
      {
        name: "description",
        content:
          "Prove the business is real with registration, address and owner identity to earn the verified badge.",
      },
      { property: "og:title", content: "Verify your business | MusicLinkd" },
      { property: "og:description", content: "Registration, address and owner identity checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessVerification,
});

function BusinessVerification() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const [submitted, setSubmitted] = useState(false);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Verification" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or you no longer have access to it."
          />
        </div>
      </Screen>
    );
  }

  const done = businessVerificationChecks.filter((c) => c.done).length;

  return (
    <Screen>
      <TopBar title="Business verification" subtitle={b.name} back={`/business/${b.id}/manage`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle text-pink-strong">
              <ShieldCheck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {b.verified ? "Verified business" : "Not verified yet"}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {done} of {businessVerificationChecks.length} checks complete
              </p>
            </div>
            <StatusPill
              label={b.verified ? "Verified" : submitted ? "In review" : "Pending"}
              tone={b.verified ? "good" : submitted ? "warn" : "neutral"}
            />
          </div>
        </Card>

        <div className="space-y-2">
          {businessVerificationChecks.map((c) => (
            <Card key={c.key}>
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${c.done ? "bg-primary text-primary-foreground" : "border border-border"}`}
                >
                  {c.done ? <Check size={14} /> : null}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{c.detail}</p>
                  {!c.done ? (
                    <Btn variant="outline" className="mt-2">
                      Upload
                    </Btn>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <p className="text-sm font-semibold">What reviewers see</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Documents are only read by the review team, never shown on your public page. The page
            only ever shows a badge.
          </p>
          <BtnLink to="/verification/privacy" variant="ghost" className="mt-3 w-full">
            How your documents are handled
          </BtnLink>
        </Card>

        <Btn className="w-full" disabled={submitted} onClick={() => setSubmitted(true)}>
          {submitted ? "Submitted for review" : "Submit for review"}
        </Btn>
      </div>
    </Screen>
  );
}
