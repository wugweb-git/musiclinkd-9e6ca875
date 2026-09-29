import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { ApplicationCard } from "@/components/ml/opportunity";
import { EmptyState, LoadError, Loading, Segmented } from "@/components/ml/kit";
import { listMyApplications, withdrawApplication } from "@/lib/applications.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/opportunities/applications/")({
  head: () => ({
    meta: [
      { title: "My applications | MusicLinkd" },
      {
        name: "description",
        content:
          "Track every opportunity you applied to — viewed, shortlisted, accepted or closed.",
      },
      { property: "og:title", content: "My applications | MusicLinkd" },
      {
        property: "og:description",
        content: "Application status across music-industry opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Applications,
});

const tabs = ["Active", "Shortlisted", "Closed"] as const;

/** Your own applications, from the database: what you sent, and where each one stands. */
function Applications() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Active");
  const { signedIn, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listMyApplications);
  const pullOut = useServerFn(withdrawApplication);

  const q = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const withdraw = useMutation({
    mutationFn: (slug: string) => pullOut({ data: { slug } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  const all = q.data ?? [];
  const list = all.filter((a) =>
    tab === "Active"
      ? ["pending", "shortlisted"].includes(a.status)
      : tab === "Shortlisted"
        ? a.status === "shortlisted"
        : ["rejected", "withdrawn", "accepted"].includes(a.status),
  );

  return (
    <Screen>
      <TopBar
        title="My applications"
        subtitle="Applications never expire silently"
        back="/opportunities"
      />
      <div className="space-y-4 px-5 pt-4">
        <Segmented value={tab} options={tabs} onChange={setTab} />
        {!signedIn && !authLoading ? (
          <EmptyState
            title="Sign in to see your applications"
            body="Everything you apply to is tracked here."
          >
            <BtnLink to="/welcome" className="w-full">
              Sign In
            </BtnLink>
          </EmptyState>
        ) : q.isLoading ? (
          <Loading rows={3} />
        ) : q.isError ? (
          <LoadError what="your applications" />
        ) : list.length === 0 ? (
          <EmptyState
            title="Nothing here"
            body="Apply to an opportunity and you'll be able to track it from this screen."
          >
            <BtnLink to="/opportunities" className="w-full">
              Find Opportunities
            </BtnLink>
          </EmptyState>
        ) : (
          <ul className="space-y-3 pb-4">
            {list.map((a) => (
              <li key={a.id}>
                <ApplicationCard
                  a={a}
                  withdrawing={withdraw.isPending && withdraw.variables === a.opportunity?.slug}
                  {...(a.opportunity?.slug
                    ? { onWithdraw: () => withdraw.mutate(a.opportunity!.slug) }
                    : {})}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}
