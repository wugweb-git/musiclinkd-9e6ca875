import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { Btn, Screen, TopBar } from "@/components/ml/ui";
import { EmptyState, Loading } from "@/components/ml/kit";
import { TextLink } from "@/components/ml/links";
import { answerConnection, listMyConnections } from "@/lib/connections.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

/*
 * Connections: the people who asked to connect, and the ones you are connected to — both read from
 * the database. Messaging itself is not built yet, so this screen does not pretend to hold
 * conversations.
 */
export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Connections | MusicLinkd" },
      {
        name: "description",
        content: "Requests to connect, and the artists, studios and labels you are connected to.",
      },
      { property: "og:title", content: "Connections | MusicLinkd" },
      { property: "og:description", content: "Your connections on MusicLinkd." },
    ],
  }),
  component: Connections,
});

type Person = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  city: string | null;
};

function PersonRow({ person, children }: { person: Person; children?: React.ReactNode }) {
  const name = person.display_name ?? person.username ?? "";
  const body = (
    <>
      {person.avatar_url ? (
        <img
          src={person.avatar_url}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span aria-hidden className="h-12 w-12 shrink-0 rounded-full bg-background" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="block truncate text-1 text-muted-foreground">
          {joinParts(person.headline ?? "", person.city ?? "")}
        </span>
      </span>
    </>
  );
  return (
    <div className="flex items-center gap-3 py-3">
      {person.username ? (
        <Link
          to="/profile/$username"
          params={{ username: person.username }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {children}
    </div>
  );
}

function Connections() {
  const { signedIn, loading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listMyConnections);
  const answer = useServerFn(answerConnection);

  const q = useQuery({
    queryKey: ["connections", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const act = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      answer({ data: { id, accept } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connections", "mine"] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  const received = q.data?.received ?? [];
  const connected = q.data?.connected ?? [];
  const sent = q.data?.sent ?? [];

  return (
    <Screen>
      <TopBar
        title="Connections"
        subtitle={connected.length ? `${connected.length} connected` : "People you work with"}
        right={
          <TextLink to="/collab" className="pill bg-background text-muted-foreground">
            Collabs
          </TextLink>
        }
      />
      <div className="space-y-6 px-5 pt-4">
        {!signedIn && !loading ? (
          <EmptyState
            icon={<UserRoundPlus size={iconSize.md} className="text-muted-foreground" />}
            title="Sign in to see your connections"
            body="Requests to connect, and the people you are connected to, live here."
          />
        ) : null}

        {signedIn && q.isLoading ? <Loading rows={3} /> : null}

        {received.length ? (
          <section>
            <h2 className="mb-1 text-sm">Requests</h2>
            <ul className="divide-y divide-border">
              {received.map((c) => (
                <li key={c.id}>
                  <PersonRow person={c.person}>
                    <span className="flex shrink-0 gap-2">
                      <Btn
                        variant="outline"
                        className="min-h-10 px-3 text-1"
                        loading={act.isPending}
                        onClick={() => act.mutate({ id: c.id, accept: false })}
                      >
                        Ignore
                      </Btn>
                      <Btn
                        className="min-h-10 px-3 text-1"
                        loading={act.isPending}
                        onClick={() => act.mutate({ id: c.id, accept: true })}
                      >
                        Accept
                      </Btn>
                    </span>
                  </PersonRow>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {signedIn && !q.isLoading ? (
          <section>
            <h2 className="mb-1 text-sm">Connected</h2>
            {connected.length ? (
              <ul className="divide-y divide-border">
                {connected.map((c) => (
                  <li key={c.id}>
                    <PersonRow person={c.person} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<MessageCircle size={iconSize.md} className="text-muted-foreground" />}
                title="No connections yet"
                body="Open a profile and tap Connect. Once they accept, they appear here."
              />
            )}
          </section>
        ) : null}

        {sent.length ? (
          <section className="pb-4">
            <h2 className="mb-1 text-sm">Waiting on them</h2>
            <ul className="divide-y divide-border">
              {sent.map((c) => (
                <li key={c.id}>
                  <PersonRow person={c.person}>
                    <span className="pill shrink-0 bg-subtle text-muted-foreground">Requested</span>
                  </PersonRow>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Screen>
  );
}
