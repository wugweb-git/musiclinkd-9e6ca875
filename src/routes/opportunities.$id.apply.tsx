import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, Price, StatusPill } from "@/components/ml/kit";
import { getOpportunity, payParts } from "@/data/opportunities";
import { demoPortfolio, workType } from "@/data/portfolio";
import { loadDbOpportunity } from "@/lib/opportunity-view";

type Step = "portfolio" | "message" | "review" | "done";
const order: Step[] = ["portfolio", "message", "review", "done"];

export const Route = createFileRoute("/opportunities/$id/apply")({
  validateSearch: (s: Record<string, unknown>): { step: Step } => ({
    step: (order as string[]).includes(String(s["step"])) ? (s["step"] as Step) : "portfolio",
  }),
  // Static opportunities first; any other id is looked up as a stored opportunity slug.
  loader: async ({ params }) => ({
    db: getOpportunity(params.id) ? null : await loadDbOpportunity(params.id),
  }),
  head: ({ params, loaderData }) => {
    const o = getOpportunity(params.id) ?? loaderData?.db ?? undefined;
    const title = `Apply · ${o?.title ?? "Opportunity"} | MusicLinkd`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: "Attach portfolio work, write a short pitch and submit your application.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Apply with proof of fit — portfolio first, pitch second.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ApplyFlow,
});

function ApplyFlow() {
  const { id } = Route.useParams();
  const { step } = Route.useSearch();
  const nav = useNavigate();
  const { db } = Route.useLoaderData();
  const o = getOpportunity(id) ?? db ?? undefined;
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [rate, setRate] = useState("");

  if (!o) {
    return (
      <Screen>
        <TopBar title="Apply" back="/opportunities" />
        <div className="px-5 pt-6">
          <EmptyState title="Opportunity unavailable" body="It closed while you were away." />
        </div>
      </Screen>
    );
  }

  const go = (s: Step) =>
    nav({ to: "/opportunities/$id/apply", params: { id }, search: { step: s } });
  const idx = order.indexOf(step);

  if (step === "done") {
    return (
      <Screen>
        <TopBar title="Application sent" back="/opportunities" />
        <div className="space-y-4 px-5 pt-6">
          <Card className="space-y-3 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check size={26} />
            </span>
            <h2 className="text-[20px] leading-tight">You're in for {o.title}</h2>
            <p className="text-[13px] text-muted-foreground">
              {o.poster.name} usually responds within 2 days. You'll get a notification when your
              application is viewed.
            </p>
          </Card>
          <BtnLink to="/opportunities/applications" className="w-full">
            Track My Applications
          </BtnLink>
          <BtnLink to="/opportunities" variant="outline" className="w-full">
            Browse More Opportunities
          </BtnLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Apply" subtitle={o.title} back="/opportunities" />
      <div className="space-y-4 px-5 pt-4 pb-28">
        <div className="flex items-center gap-1.5">
          {order.slice(0, 3).map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-subtle"}`}
            />
          ))}
        </div>

        {step === "portfolio" ? (
          <>
            <div>
              <h2 className="text-[19px] leading-tight">Prove the fit</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Attach up to 3 pieces of work. Posters review portfolios before messages.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoPortfolio.slice(0, 6).map((p) => {
                const on = picked.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setPicked((prev) =>
                        on
                          ? prev.filter((x) => x !== p.id)
                          : prev.length < 3
                            ? [...prev, p.id]
                            : prev,
                      )
                    }
                    className={`overflow-hidden rounded-[20px] border text-left ${on ? "border-primary" : "border-border"} bg-card`}
                  >
                    <span className="flex h-20 w-full items-center justify-center bg-subtle text-2xl">
                      {workType(p.kind).emoji}
                    </span>
                    <span className="block p-3">
                      <span className="block truncate text-[13px] font-semibold">{p.title}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {workType(p.kind).label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <BtnLink to="/portfolio/new" variant="ghost" className="w-full">
              Add New Work to Portfolio
            </BtnLink>
          </>
        ) : null}

        {step === "message" ? (
          <>
            <div>
              <h2 className="text-[19px] leading-tight">Your pitch</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Three lines beats three paragraphs. Say why you fit this brief.
              </p>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              maxLength={600}
              placeholder={`Why you're right for "${o.title}"…`}
              className="w-full rounded-[20px] border border-border bg-card p-4 text-[14px] outline-none"
            />
            <p className="text-right text-[11px] text-muted-foreground">{message.length}/600</p>
            <Card className="space-y-2">
              <p className="text-[13px] font-semibold">Your rate (optional)</p>
              {payParts(o) ? (
                <div>
                  <p className="text-[12px] text-muted-foreground">Budget listed</p>
                  <Price
                    price={payParts(o)}
                    amountClassName="text-[12px] font-semibold"
                    unitClassName="text-[11px]"
                  />
                </div>
              ) : null}
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. ₹32,000 per song"
                className="w-full rounded-[16px] border border-border bg-background px-4 py-3 text-[14px] outline-none"
              />
            </Card>
          </>
        ) : null}

        {step === "review" ? (
          <>
            <h2 className="text-[19px] leading-tight">Review and send</h2>
            <Card className="space-y-2">
              <StatusPill label="Attached work" tone="brand" />
              {picked.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No portfolio attached — applications with work are 4× more likely to be
                  shortlisted.
                </p>
              ) : (
                picked.map((pid) => (
                  <p key={pid} className="text-[13px]">
                    {demoPortfolio.find((p) => p.id === pid)?.title ?? pid}
                  </p>
                ))
              )}
            </Card>
            <Card className="space-y-2">
              <StatusPill label="Your pitch" />
              <p className="text-[13px] text-muted-foreground">{message || "No message added."}</p>
              {rate ? <p className="text-[12px] text-muted-foreground">Rate: {rate}</p> : null}
            </Card>
            <p className="text-[12px] text-muted-foreground">
              Your public profile, verification badges and reviews are shared with {o.poster.name}{" "}
              when you apply.
            </p>
          </>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-2">
          {idx > 0 ? (
            <Btn variant="outline" className="flex-1" onClick={() => go(order[idx - 1]!)}>
              Back
            </Btn>
          ) : null}
          <Btn
            className="flex-1"
            disabled={step === "message" && message.trim().length < 10}
            onClick={() => go(order[idx + 1]!)}
          >
            {step === "review" ? "Send application" : "Continue"}
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
