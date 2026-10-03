import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { ActionBar, Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, Price, StatusPill } from "@/components/ml/kit";
import { payParts } from "@/data/opportunities";
import { workType } from "@/data/portfolio";
import { loadDbOpportunity } from "@/lib/opportunity-view";
import { applyToOpportunity } from "@/lib/applications.functions";
import { listMyPortfolio } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { workIconFor } from "@/components/ml/portfolio";

type Step = "portfolio" | "message" | "review" | "done";
const order: Step[] = ["portfolio", "message", "review", "done"];

export const Route = createFileRoute("/opportunities/$id/apply")({
  validateSearch: (s: Record<string, unknown>): { step: Step } => ({
    step: (order as string[]).includes(String(s["step"])) ? (s["step"] as Step) : "portfolio",
  }),
  // The id is a stored opportunity slug.
  loader: async ({ params }) => ({ db: await loadDbOpportunity(params.id) }),
  head: ({ loaderData }) => {
    const o = loaderData?.db ?? undefined;
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
  const o = db ?? undefined;
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [rate, setRate] = useState("");
  const { signedIn } = useAuth();
  const send = useServerFn(applyToOpportunity);
  const fetchPortfolio = useServerFn(listMyPortfolio);

  // Your own work, so an application carries real pieces. Signed out, the demo set stands in.
  const portfolio = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => fetchPortfolio(),
    enabled: signedIn,
  });
  // The applicant's own works; signed out there are none to attach.
  const work = signedIn
    ? (portfolio.data ?? []).map((item) => ({ id: item.id, title: item.title, kind: item.kind }))
    : [];

  const apply = useMutation({
    mutationFn: () =>
      send({
        data: {
          slug: id,
          ...(message.trim() ? { message: message.trim() } : {}),
          // A seed portfolio id is not a real row, so only a signed-in pick is sent.
          ...(signedIn && picked.length ? { portfolioItemIds: picked } : {}),
        },
      }),
    onSuccess: () =>
      void nav({ to: "/opportunities/$id/apply", params: { id }, search: { step: "done" } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't send. Try again."),
  });

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
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink text-ink-foreground">
              <Check size={iconSize.lg} />
            </span>
            <h2 className="text-3 leading-tight">You're in for {o.title}</h2>
            <p className="text-1 text-muted-foreground">
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
              className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-ink" : "bg-background"}`}
            />
          ))}
        </div>

        {step === "portfolio" ? (
          <>
            <div>
              <h2 className="text-3 leading-tight">Prove the fit</h2>
              <p className="mt-1 text-1 text-muted-foreground">
                Attach up to 3 pieces of work. Posters review portfolios before messages.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {work.slice(0, 6).map((p) => {
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
                    className={`overflow-hidden rounded-lg border-2 text-left ${on ? "border-foreground" : "border-transparent"} bg-subtle`}
                  >
                    <span className="flex h-20 w-full items-center justify-center bg-background">
                      {(() => {
                        const Icon = workIconFor(p.kind);
                        return <Icon size={iconSize.lg} aria-hidden />;
                      })()}
                    </span>
                    <span className="block p-3">
                      <span className="block truncate text-1 font-semibold">{p.title}</span>
                      <span className="block text-1 text-muted-foreground">
                        {workType(p.kind).label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <BtnLink to="/portfolio" search={{ add: "1" }} variant="ghost" className="w-full">
              Add New Work to Portfolio
            </BtnLink>
          </>
        ) : null}

        {step === "message" ? (
          <>
            <div>
              <h2 className="text-3 leading-tight">Your pitch</h2>
              <p className="mt-1 text-1 text-muted-foreground">
                Three lines beats three paragraphs. Say why you fit this brief.
              </p>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              maxLength={600}
              placeholder={`Why you're right for "${o.title}"…`}
              className="w-full rounded-lg border border-input bg-card p-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-right text-1 text-muted-foreground">{message.length}/600</p>
            <Card className="space-y-2">
              <p className="text-1 font-semibold">Your rate (optional)</p>
              {payParts(o) ? (
                <div>
                  <p className="text-1 text-muted-foreground">Budget listed</p>
                  <Price
                    price={payParts(o)}
                    amountClassName="text-1 font-semibold"
                    unitClassName="text-1"
                  />
                </div>
              ) : null}
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. ₹32,000 per song"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Card>
          </>
        ) : null}

        {step === "review" ? (
          <>
            <h2 className="text-3 leading-tight">Review and send</h2>
            <Card className="space-y-2">
              <StatusPill label="Attached work" tone="brand" />
              {picked.length === 0 ? (
                <p className="text-1 text-muted-foreground">No portfolio attached.</p>
              ) : (
                picked.map((pid) => (
                  <p key={pid} className="text-1">
                    {work.find((w) => w.id === pid)?.title ?? pid}
                  </p>
                ))
              )}
            </Card>
            <Card className="space-y-2">
              <StatusPill label="Your pitch" />
              <p className="text-1 text-muted-foreground">{message || "No message added."}</p>
              {rate ? <p className="text-1 text-muted-foreground">Rate: {rate}</p> : null}
            </Card>
            <p className="text-1 text-muted-foreground">
              Your public profile, verification badges and reviews are shared with {o.poster.name}{" "}
              when you apply.
            </p>
          </>
        ) : null}
      </div>

      <ActionBar>
        <div className="flex gap-2">
          {idx > 0 ? (
            <Btn variant="outline" className="flex-1" onClick={() => go(order[idx - 1]!)}>
              Back
            </Btn>
          ) : null}
          <Btn
            className="flex-1"
            disabled={step === "message" && message.trim().length < 10}
            loading={apply.isPending}
            onClick={() => (step === "review" ? apply.mutate() : go(order[idx + 1]!))}
          >
            {step === "review" ? "Send application" : "Continue"}
          </Btn>
        </div>
      </ActionBar>
    </Screen>
  );
}
