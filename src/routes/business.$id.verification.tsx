import { createFileRoute } from "@tanstack/react-router";
import { Check, ShieldCheck } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, Loading, StatusPill } from "@/components/ml/kit";
import { StateCard } from "@/components/ml/portfolio";
import { statusLabel, statusTone } from "@/data/verification";
import { useAuth } from "@/hooks/use-auth";
import { useMyVerification } from "@/hooks/use-my-verification";
import { businessView, loadBusiness } from "@/lib/business-view";

export const Route = createFileRoute("/business/$id/verification")({
  loader: ({ params }) => loadBusiness(params.id),
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
  const b = businessView(Route.useLoaderData());
  const { user } = useAuth();
  const v = useMyVerification();

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

  // Requests are the owner's only; imported business accounts cannot sign in yet.
  const owner = Boolean(user && user.id === b.profileId);
  const type = v.allTypes?.find((t) => t.key === "business");
  const request = owner ? v.requests.find((r) => r.type === "business") : undefined;
  const checks = (type?.requirements ?? []).map((r) => ({
    key: r.id,
    label: r.label,
    detail: r.why,
    kind: r.kind,
    done: request
      ? r.privateField
        ? Boolean(request.phone)
        : request.items.some((i) => i.requirementId === r.id && i.state === "uploaded")
      : false,
  }));
  const done = checks.filter((c) => c.done).length;
  const status = request?.status ?? "unverified";

  return (
    <Screen>
      <TopBar title="Business verification" subtitle={b.name} back={`/business/${b.id}/manage`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle text-foreground">
              <ShieldCheck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {b.verified ? "Verified business" : "Not verified yet"}
              </p>
              {type ? (
                <p className="text-[12px] text-muted-foreground">
                  {done} of {checks.length} checks complete
                </p>
              ) : null}
            </div>
            <StatusPill
              label={b.verified ? statusLabel.verified : statusLabel[status]}
              tone={b.verified ? statusTone.verified : statusTone[status]}
            />
          </div>
        </Card>

        {v.error ? (
          <StateCard
            tone="error"
            title="We couldn't load your verification"
            body="Check your connection and try again."
            action={<Btn onClick={v.retry}>Retry</Btn>}
          />
        ) : v.pending ? (
          <Loading />
        ) : (
          <div className="space-y-2">
            {checks.map((c) => (
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
                    {owner && !c.done && status === "unverified" ? (
                      <BtnLink
                        to="/verification/$type"
                        params={{ type: "business" }}
                        search={{ step: c.kind === "document" ? 2 : 1, mode: "new" }}
                        variant="outline"
                        className="mt-2"
                      >
                        Upload
                      </BtnLink>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

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

        {owner && !b.verified ? (
          status === "in_review" ? (
            <Btn className="w-full" disabled>
              Submitted for review
            </Btn>
          ) : (
            <BtnLink
              to="/verification/$type"
              params={{ type: "business" }}
              search={{ step: 0 }}
              className="w-full"
            >
              Submit for review
            </BtnLink>
          )
        ) : null}
      </div>
    </Screen>
  );
}
