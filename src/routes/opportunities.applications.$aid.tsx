import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Dialog, Loading } from "@/components/ml/kit";
import { applicationTone, type ApplicationStatus } from "@/data/opportunities";
import { workType } from "@/data/portfolio";
import {
  listAttachedWork,
  listMyApplications,
  withdrawApplication,
  type MyApplication,
} from "@/lib/applications.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/opportunities/applications/$aid")({
  head: () => {
    const title = "Application · Opportunity | MusicLinkd";
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

/** The stored "pending" is what the screens call "submitted". */
const shownStatus = (s: MyApplication["status"]): ApplicationStatus =>
  s === "pending" ? "submitted" : s;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Progress from what the row holds: when it was sent, and when its status last changed. */
function timelineFor(a: MyApplication) {
  const applied = { label: "Applied", at: when(a.created_at), done: true };
  const changed = when(a.updated_at);
  if (a.status === "shortlisted")
    return [applied, { label: "Shortlisted", at: changed, done: true }];
  if (a.status === "accepted") return [applied, { label: "Accepted", at: changed, done: true }];
  if (a.status === "rejected") return [applied, { label: "Not selected", at: changed, done: true }];
  if (a.status === "withdrawn") return [applied, { label: "Withdrawn", at: changed, done: true }];
  return [applied, { label: "Shortlist decision", at: "—", done: false }];
}

/** One of your own applications, from the database, with a real withdraw. */
function ApplicationDetail() {
  const { aid } = Route.useParams();
  const { signedIn, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listMyApplications);
  const loadWork = useServerFn(listAttachedWork);
  const pullOut = useServerFn(withdrawApplication);
  const [withdraw, setWithdraw] = useState(false);
  const [done, setDone] = useState(false);

  const q = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const a = q.data?.find((x) => x.id === aid);
  const o = a?.opportunity ?? undefined;

  const work = useQuery({
    queryKey: ["applications", "mine", aid, "work"],
    queryFn: () => loadWork({ data: { ids: a?.portfolio_item_ids ?? [] } }),
    enabled: !!a?.portfolio_item_ids.length,
  });

  const pull = useMutation({
    mutationFn: (slug: string) => pullOut({ data: { slug } }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["applications", "mine"] });
      const prev = queryClient.getQueryData<MyApplication[]>(["applications", "mine"]);
      queryClient.setQueryData<MyApplication[]>(["applications", "mine"], (list) =>
        list?.map((x) => (x.id === aid ? { ...x, status: "withdrawn" } : x)),
      );
      return { prev };
    },
    onSuccess: () => {
      setDone(true);
      void queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      if (o) void queryClient.invalidateQueries({ queryKey: ["application", o.slug] });
    },
    onError: (_e, _slug, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["applications", "mine"], ctx.prev);
      toast.error("That didn't save. Try again.");
    },
  });

  if (authLoading || (signedIn && q.isLoading)) {
    return (
      <Screen>
        <TopBar title="Your application" back="/opportunities/applications" />
        <div className="px-5 pt-4">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

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

  const status = shownStatus(a.status);

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
            <StatusPill label={status} tone={applicationTone(status)} />
            <span className="text-1 text-muted-foreground">Applied {when(a.created_at)}</span>
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
          {timelineFor(a).map((t) => (
            <div key={t.label} className="flex items-start gap-2">
              {t.done ? (
                <CheckCircle2 size={iconSize.sm} className="mt-0.5 shrink-0 text-primary" />
              ) : (
                <Circle size={iconSize.sm} className="mt-0.5 shrink-0 text-border" />
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
          {a.message ? <p className="text-1 text-muted-foreground">{a.message}</p> : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {a.portfolio_item_ids.map((pid) => {
              const item = work.data?.find((p) => p.id === pid);
              return (
                <span
                  key={pid}
                  className="rounded-full bg-background px-3 py-1.5 text-1 font-semibold"
                >
                  {workType(item?.kind ?? "track").emoji} {item?.title ?? "Attached work"}
                </span>
              );
            })}
          </div>
        </Card>

        {o ? (
          <BtnLink
            to="/opportunities/$id"
            params={{ id: o.slug }}
            variant="outline"
            className="w-full"
          >
            View the Opportunity
          </BtnLink>
        ) : null}

        {["pending", "shortlisted"].includes(a.status) ? (
          <Btn
            variant="ghost"
            className="w-full"
            loading={pull.isPending}
            onClick={() => setWithdraw(true)}
          >
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
          loading={pull.isPending}
          onClick={() => {
            setWithdraw(false);
            if (o) pull.mutate(o.slug);
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
