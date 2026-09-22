import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { EmptyState, Loading } from "@/components/ml/kit";
import { joinCollabByLink } from "@/lib/collabs.functions";
import { useAuth } from "@/hooks/use-auth";

/*
 * A project's join link (owner, 22 Sep 2026: the invite link comes back). Opening it signed in
 * joins through the database: straight in, or asked to join when the owner approves each join.
 * Either way it lands on the project, which says where you stand.
 */
export const Route = createFileRoute("/collab/join/$token")({
  head: () => ({
    meta: [
      { title: "Join a collaboration | MusicLinkd" },
      { name: "description", content: "Join a project on MusicLinkd by link." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinByLink,
});

function JoinByLink() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const join = useServerFn(joinCollabByLink);
  const started = useRef(false);

  const go = useMutation({
    mutationFn: () => join({ data: { token } }),
    onSuccess: (r) => {
      void navigate({ to: "/collab/$id", params: { id: r.collab_id }, replace: true });
    },
  });

  useEffect(() => {
    if (!signedIn || started.current) return;
    started.current = true;
    go.mutate();
  }, [signedIn, go]);

  return (
    <Screen>
      <TopBar title="Join" back="/collab" />
      <div className="px-5 pt-6">
        {!signedIn && !loading ? (
          <EmptyState
            title="Sign in to join"
            body="Sign in, then open the link again to join the project."
          >
            <BtnLink to="/welcome" className="w-full">
              Sign In
            </BtnLink>
          </EmptyState>
        ) : go.isError ? (
          <EmptyState
            title="This link doesn't work"
            body={go.error instanceof Error ? go.error.message : "Ask the owner for a new link."}
          >
            <BtnLink to="/collab" className="w-full">
              Back to Collaborations
            </BtnLink>
          </EmptyState>
        ) : (
          <Loading rows={2} />
        )}
      </div>
    </Screen>
  );
}
