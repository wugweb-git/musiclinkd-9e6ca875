import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, CheckCircle2, Circle } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Dialog, Price } from "@/components/ml/kit";
import { getApplication, getOpportunity, applicationTone } from "@/data/opportunities";
import { demoPortfolio, workType } from "@/data/portfolio";

export const Route = createFileRoute("/opportunities/applications/$aid")({
  head: ({ params }) => {
    const a = getApplication(params.aid);
    const o = a ? getOpportunity(a.opportunityId) : undefined;
    const title = `Application · ${o?.title ?? "Opportunity"} | MusicLinkd`;
    return {
      meta: [
        { title },
        { name: "description", content: "Application status, attached portfolio and next steps." },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Follow your application from submitted to shortlisted to agreement.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { aid } = Route.useParams();
  const a = getApplication(aid);
  const o = a ? getOpportunity(a.opportunityId) : undefined;
  const [withdraw, setWithdraw] = useState(false);
  const [done, setDone] = useState(false);

  if (!a) {
    return (
      <Screen>
        <TopBar title="Application" back="/opportunities/applications" />
        <div className="px-5 pt-6">
          <EmptyState title="Application not found" body="It may have been withdrawn." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Your application"
        {...(o ? { subtitle: o.title } : {})}
        back="/opportunities/applications"
      />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <StatusPill label={a.status} tone={applicationTone(a.status)} />
            <span className="text-1 text-muted-foreground">Applied {a.submittedAt}</span>
          </div>
          {a.status === "shortlisted" ? (
            <p className="text-1 text-muted-foreground">
              You're on the shortlist. Keep the conversation going — most shortlists convert within
              a week.
            </p>
          ) : a.status === "rejected" ? (
            <p className="text-1 text-muted-foreground">
              Not selected this time. Your profile stays visible to this poster for future posts.
            </p>
          ) : (
            <p className="text-1 text-muted-foreground">
              The poster has your application. You'll be notified on any change.
            </p>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm">Progress</h2>
          {a.timeline.map((t) => (
            <div key={t.label} className="flex items-start gap-2">
              {t.done ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
              ) : (
                <Circle size={16} className="mt-0.5 shrink-0 text-border" />
              )}
              <div className="min-w-0">
                <p className="text-1 font-semibold">{t.label}</p>
                <p className="text-1 text-muted-foreground">{t.at}</p>
              </div>
            </div>
          ))}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm">What you sent</h2>
          <p className="text-1 text-muted-foreground">{a.message}</p>
          {a.rateQuoted ? (
            <div>
              <p className="text-1 text-muted-foreground">Rate quoted</p>
              <Price
                price={a.rateQuoted}
                amountClassName="text-1 font-semibold"
                unitClassName="text-1"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {a.portfolioIds.map((pid) => {
              const item = demoPortfolio.find((p) => p.id === pid);
              return (
                <span key={pid} className="rounded-full bg-subtle px-3 py-1.5 text-1 font-semibold">
                  {workType(item?.kind ?? "track").emoji} {item?.title ?? "Attached work"}
                </span>
              );
            })}
          </div>
        </Card>

        {a.threadId ? (
          <BtnLink to="/messages" className="w-full">
            <span className="inline-flex items-center gap-2">
              <MessageCircle size={16} /> Open Conversation
            </span>
          </BtnLink>
        ) : null}

        {o ? (
          <BtnLink
            to="/opportunities/$id"
            params={{ id: o.id }}
            variant="outline"
            className="w-full"
          >
            View the Opportunity
          </BtnLink>
        ) : null}

        {["submitted", "viewed", "shortlisted"].includes(a.status) ? (
          <Btn variant="ghost" className="w-full" onClick={() => setWithdraw(true)}>
            Withdraw Application
          </Btn>
        ) : null}
      </div>

      <Dialog
        open={withdraw}
        title="Withdraw this application?"
        body="The poster will no longer see your application. You can apply again while the opportunity is open."
        onClose={() => setWithdraw(false)}
      >
        <Btn
          onClick={() => {
            setWithdraw(false);
            setDone(true);
          }}
        >
          Withdraw
        </Btn>
        <Btn variant="ghost" onClick={() => setWithdraw(false)}>
          Keep It
        </Btn>
      </Dialog>

      <Dialog
        open={done}
        title="Application withdrawn"
        body="It's been removed from the poster's list."
        onClose={() => setDone(false)}
      >
        <BtnLink to="/opportunities/applications" className="w-full">
          Back to Applications
        </BtnLink>
      </Dialog>
    </Screen>
  );
}
