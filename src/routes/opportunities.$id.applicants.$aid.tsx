import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet, VerifiedBadge } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Dialog, Loading } from "@/components/ml/kit";
import {
  listApplicants,
  listAttachedWork,
  setApplicationStatus,
} from "@/lib/applications.functions";
import { ApplicantFit } from "@/components/ml/opportunity";
import { loadDbOpportunity } from "@/lib/opportunity-view";
import { personFit, fitTarget } from "@/lib/fit";
import { useTaxonomy } from "@/lib/taxonomy";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/opportunities/$id/applicants/$aid")({
  // The opportunity the fit is measured against; the id is its slug.
  loader: async ({ params }) => ({ db: await loadDbOpportunity(params.id) }),
  head: () => ({
    meta: [
      { title: "Applicant · application | MusicLinkd" },
      {
        name: "description",
        content: "An applicant's message, the work they attached, and shortlist actions.",
      },
      { property: "og:title", content: "Applicant | MusicLinkd" },
      { property: "og:description", content: "Review an applicant's work before you shortlist." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplicantDetail,
});

/*
 * One application, from the database: who applied, how well their profile fits the opportunity
 * (src/lib/fit.ts) and their review average, what they wrote, and the published work they attached.
 */
function ApplicantDetail() {
  const { id, aid } = Route.useParams();
  const { db: opportunity } = Route.useLoaderData();
  const { options: taxonomy } = useTaxonomy();
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listApplicants);
  const loadWork = useServerFn(listAttachedWork);
  const decide = useServerFn(setApplicationStatus);

  const q = useQuery({
    queryKey: ["applicants", id],
    queryFn: () => load({ data: { slug: id } }),
    enabled: signedIn,
    retry: false,
  });
  const a = q.data?.find((x) => x.id === aid);

  const work = useQuery({
    queryKey: ["applicants", id, aid, "work"],
    queryFn: () => loadWork({ data: { ids: a?.portfolio_item_ids ?? [] } }),
    enabled: !!a?.portfolio_item_ids.length,
  });

  const [decision, setDecision] = useState<"shortlist" | "reject" | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [hire, setHire] = useState(false);
  const [busy, setBusy] = useState(false);

  async function apply(next: "shortlisted" | "rejected") {
    if (!a) return;
    setBusy(true);
    try {
      await decide({ data: { id: a.id, status: next } });
      await queryClient.invalidateQueries({ queryKey: ["applicants", id] });
      setDecision(null);
      setConfirmed(next === "rejected" ? "Applicant declined" : "Applicant shortlisted");
    } catch {
      toast.error("That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (q.isLoading) {
    return (
      <Screen>
        <TopBar title="Applicant" back="/opportunities/mine" />
        <div className="px-5 pt-6">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

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

  const name = a.person?.display_name ?? a.person?.username ?? "Applicant";
  const where = [a.person?.headline, a.person?.city].filter(Boolean).join(" · ");
  const fit =
    opportunity && taxonomy
      ? personFit(a.person ?? {}, fitTarget(opportunity), taxonomy, { withRating: true })
      : null;

  return (
    <Screen>
      <TopBar
        title="Applicant"
        subtitle={new Date(a.created_at).toLocaleDateString("en-IN")}
        back="/opportunities/mine"
      />
      <div className="space-y-4 px-5 pt-4 pb-28">
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            {a.person?.avatar_url ? (
              <img
                src={a.person.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="h-16 w-16 shrink-0 rounded-full bg-subtle" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-3 leading-tight">{name}</h1>
                {a.person?.is_verified ? <VerifiedBadge size={16} /> : null}
              </div>
              {where ? <p className="truncate text-1 text-muted-foreground">{where}</p> : null}
            </div>
          </div>
          <ApplicantFit fit={fit} rating={a.person?.rating} reviews={a.person?.review_count} />
          <StatusPill label={a.status} tone={a.status === "shortlisted" ? "brand" : "neutral"} />
          {a.person?.username ? (
            <BtnLink
              to="/profile/$username"
              params={{ username: a.person.username }}
              variant="outline"
              className="w-full"
            >
              View Full Profile
            </BtnLink>
          ) : null}
        </Card>

        {a.message ? (
          <Card className="space-y-2">
            <h2 className="text-sm">Their message</h2>
            <p className="text-1 text-muted-foreground">{a.message}</p>
          </Card>
        ) : null}

        {a.portfolio_item_ids.length ? (
          <section>
            <h2 className="mb-2 text-sm">Attached work</h2>
            {work.isLoading ? (
              <Loading rows={2} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(work.data ?? []).map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-[20px] bg-subtle">
                    {p.cover_url ? (
                      <img src={p.cover_url} alt="" className="h-24 w-full object-cover" />
                    ) : (
                      <div className="h-24 w-full bg-background" aria-hidden />
                    )}
                    <div className="p-3">
                      <p className="truncate text-1 font-semibold">{p.title}</p>
                      {p.kind ? <p className="text-1 text-muted-foreground">{p.kind}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <BtnLink to="/messages" variant="outline" className="w-full">
          <span className="inline-flex items-center gap-2">
            <MessageCircle size={iconSize.sm} /> Message {name.split(" ")[0]}
          </span>
        </BtnLink>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
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
            ? "Their application moves to declined. Their profile stays saved for future posts."
            : "Shortlisting moves them to the top of your list."
        }
        onClose={() => setDecision(null)}
      >
        <Btn
          disabled={busy}
          onClick={() => void apply(decision === "reject" ? "rejected" : "shortlisted")}
        >
          {busy ? "Saving…" : decision === "reject" ? "Send decline" : "Shortlist"}
        </Btn>
        <Btn variant="ghost" disabled={busy} onClick={() => setDecision(null)}>
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
          <BtnLink to="/collab/new" className="w-full">
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
