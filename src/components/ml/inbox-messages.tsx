import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, MessageCircle, Send, SquarePen, UserRoundPlus, X } from "lucide-react";
import { toast } from "sonner";
import { IconBtn, Sheet } from "@/components/ml/ui";
import { EmptyState, LoadError, Loading, Segmented } from "@/components/ml/kit";
import { DrawerList, DrawerOptionRow, DrawerSearch } from "@/components/ml/drawer-list";
import { PersonAvatar } from "@/components/ml/person-avatar";
import { PersonRow, type PersonLike } from "@/components/ml/cards";
import { useMessagePerson } from "@/hooks/use-message-person";
import {
  answerConnection,
  listMyConnections,
  type ConnectionPerson,
} from "@/lib/connections.functions";
import { listConversations } from "@/lib/messages.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

/*
 * Messages and connections, both read from the database, laid out like a 2026 inbox: one search
 * over names, then tabs — Chats (newest first, unread in bold with a count, "You:" on your own last
 * line), Requests (asked to connect, and waiting on them), Connected (a Message button on each).
 */

type Tab = "Chats" | "Requests" | "Connected";
const TABS: readonly Tab[] = ["Chats", "Requests", "Connected"];

/** Today → "11:43 pm"; yesterday → "Yesterday"; this week → "Mon"; older → "17 Sep". */
function whenLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

function nameOf(p: { display_name: string | null; username: string | null } | null) {
  return p?.display_name ?? p?.username ?? "";
}

/** A connection as the shared PersonRow reads a person. */
function asPerson(p: ConnectionPerson): PersonLike {
  return {
    id: p.id,
    username: p.username,
    name: nameOf(p),
    headline: p.headline,
    city: p.city,
    avatarUrl: p.avatar_url,
    verified: p.is_verified,
  };
}

/** Chats, connection requests and connections — the Inbox's Messages tab. */
export function MessagesPanel() {
  const { signedIn, loading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listMyConnections);
  const loadConversations = useServerFn(listConversations);
  const answer = useServerFn(answerConnection);
  const message = useMessagePerson();
  const [tab, setTab] = useState<Tab>("Chats");
  const [query, setQuery] = useState("");
  const [starting, setStarting] = useState(false);
  const [pick, setPick] = useState("");

  const q = useQuery({
    queryKey: ["connections", "mine"],
    queryFn: () => load(),
    enabled: signedIn,
  });

  const threads = useQuery({
    queryKey: ["conversations", "mine"],
    queryFn: () => loadConversations(),
    enabled: signedIn,
    staleTime: 15_000,
    refetchInterval: signedIn ? 30_000 : false,
  });

  const act = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      answer({ data: { id, accept } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connections", "mine"] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  const chats = matchingPeople(threads.data ?? [], query, (t) => t.person);
  const received = matchingPeople(q.data?.received ?? [], query, (c) => c.person);
  const connected = matchingPeople(q.data?.connected ?? [], query, (c) => c.person);
  const sent = matchingPeople(q.data?.sent ?? [], query, (c) => c.person);
  const busy = signedIn && (q.isLoading || threads.isLoading);
  // Without this, a failed fetch shows the error card *and* "No conversations yet" under it.
  const failed = signedIn && (q.isError || threads.isError);

  return (
    <>
      {!signedIn && !loading ? (
        <div className="px-5 pt-4">
          <EmptyState
            icon={<UserRoundPlus size={iconSize.md} className="text-muted-foreground" />}
            title="Sign in to see your connections"
            body="Requests to connect, and the people you are connected to, live here."
          />
        </div>
      ) : (
        <>
          <div className="px-5 pt-1">
            <DrawerSearch
              value={query}
              onChange={setQuery}
              placeholder="Search messages and people"
              label="Search messages and people"
            />
            <Segmented value={tab} options={TABS} onChange={setTab} />
          </div>

          <div className="px-5 pt-2">
            {busy ? <Loading rows={3} /> : null}
            {failed ? (
              <>
                <LoadError what="your messages" />
                <button
                  type="button"
                  onClick={() => {
                    void q.refetch();
                    void threads.refetch();
                  }}
                  className="state-layer min-h-touch w-full rounded-lg border border-border bg-card text-sm font-semibold"
                >
                  Retry
                </button>
              </>
            ) : null}

            {!busy && !failed && tab === "Chats" ? (
              chats.length ? (
                <ul className="divide-y divide-border/70 overflow-hidden rounded-lg bg-card">
                  {chats.map((t) => {
                    const name = nameOf(t.person) || "Conversation";
                    const unreadRow = t.unread > 0;
                    return (
                      <li key={t.id}>
                        <Link
                          to="/conversation/$id"
                          params={{ id: t.id }}
                          className="state-layer flex min-h-18 items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                          <PersonAvatar
                            name={name}
                            photo={t.person?.avatar_url}
                            className="h-13 w-13 shrink-0 text-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span
                                className={`min-w-0 flex-1 truncate text-sm ${unreadRow ? "font-bold" : "font-semibold"}`}
                              >
                                {name}
                              </span>
                              <span
                                className={`shrink-0 text-[11px] ${unreadRow ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                              >
                                {whenLabel(t.lastMessageAt)}
                              </span>
                            </span>
                            <span className="mt-0.5 flex items-center gap-2">
                              <span
                                className={`min-w-0 flex-1 truncate text-1 ${unreadRow ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                              >
                                {t.lastMessage
                                  ? `${t.lastMine ? "You: " : ""}${t.lastMessage}`
                                  : "No messages yet"}
                              </span>
                              {unreadRow ? (
                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-background">
                                  {t.unread}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={<MessageCircle size={iconSize.md} className="text-muted-foreground" />}
                  title={query ? "No chats match" : "No messages yet"}
                  body={
                    query
                      ? "Try another name."
                      : "Message someone from their profile, or from Connected."
                  }
                />
              )
            ) : null}

            {!busy && !failed && tab === "Requests" ? (
              received.length || sent.length ? (
                <div className="space-y-5">
                  {received.length ? (
                    <section>
                      <h2 className="mb-1 text-sm">Asked to connect</h2>
                      <ul>
                        {received.map((c) => (
                          <PersonRow
                            key={c.id}
                            person={asPerson(c.person)}
                            className="px-0 py-2.5"
                            action={
                              <>
                                <span className="flex shrink-0 gap-2">
                                  <IconBtn
                                    label="Ignore"
                                    variant="outline"
                                    className="h-10 w-10"
                                    disabled={act.isPending && act.variables?.id === c.id}
                                    loading={
                                      act.isPending &&
                                      act.variables?.id === c.id &&
                                      !act.variables.accept
                                    }
                                    onClick={() => act.mutate({ id: c.id, accept: false })}
                                  >
                                    <X size={iconSize.md} aria-hidden />
                                  </IconBtn>
                                  <IconBtn
                                    label="Accept"
                                    variant="ink"
                                    className="h-10 w-10"
                                    disabled={act.isPending && act.variables?.id === c.id}
                                    loading={
                                      act.isPending &&
                                      act.variables?.id === c.id &&
                                      act.variables.accept
                                    }
                                    onClick={() => act.mutate({ id: c.id, accept: true })}
                                  >
                                    <Check size={iconSize.md} aria-hidden />
                                  </IconBtn>
                                </span>
                              </>
                            }
                          />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {sent.length ? (
                    <section>
                      <h2 className="mb-1 text-sm">Waiting on them</h2>
                      <ul>
                        {sent.map((c) => (
                          <PersonRow
                            key={c.id}
                            person={asPerson(c.person)}
                            className="px-0 py-2.5"
                            action={
                              <>
                                <span className="shrink-0 text-1 text-muted-foreground">
                                  Requested
                                </span>
                              </>
                            }
                          />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  icon={<UserRoundPlus size={iconSize.md} className="text-muted-foreground" />}
                  title={query ? "No requests match" : "No requests"}
                  body={
                    query ? "Try another name." : "When someone asks to connect, it shows here."
                  }
                />
              )
            ) : null}

            {!busy && !failed && tab === "Connected" ? (
              connected.length ? (
                <ul>
                  {connected.map((c) => (
                    <PersonRow
                      key={c.id}
                      person={asPerson(c.person)}
                      className="px-0 py-2.5"
                      action={
                        <>
                          <IconBtn
                            label={`Message ${nameOf(c.person)}`}
                            variant="outline"
                            className="h-10 w-10"
                            disabled={message.pending}
                            onClick={() => void message.open(c.person.id)}
                          >
                            <Send size={iconSize.sm} aria-hidden />
                          </IconBtn>
                        </>
                      }
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<MessageCircle size={iconSize.md} className="text-muted-foreground" />}
                  title={query ? "No one matches" : "No connections yet"}
                  body={
                    query
                      ? "Try another name."
                      : "Open a profile and tap Connect. Once they accept, they appear here."
                  }
                />
              )
            ) : null}
          </div>

          {/* Start a chat, the 2026 way: one extended button above the nav, then pick a person. */}
          <div className="pointer-events-none fixed inset-x-0 bottom-nav-clear z-bar mx-auto flex w-full max-w-app justify-end px-5">
            <button
              type="button"
              onClick={() => setStarting(true)}
              className="state-layer pointer-events-auto inline-flex h-14 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-ink-foreground shadow-elevation-3 transition-transform duration-200 ease-standard active:scale-97"
            >
              <SquarePen size={iconSize.md} aria-hidden />
              Start chat
            </button>
          </div>

          <Sheet
            open={starting}
            onClose={() => {
              setStarting(false);
              setPick("");
            }}
            title="Start chat"
          >
            {(q.data?.connected.length ?? 0) > 8 ? (
              <DrawerSearch
                value={pick}
                onChange={setPick}
                placeholder="Search your connections"
                label="Search your connections"
              />
            ) : null}
            <DrawerList
              label="Your connections"
              empty="Connect with people from their profiles to message them here."
            >
              {matchingPeople(q.data?.connected ?? [], pick, (c) => c.person).map((c) => (
                <DrawerOptionRow
                  key={c.id}
                  option={{
                    value: c.person.id,
                    label: nameOf(c.person),
                    hint: c.person.headline ?? c.person.city ?? undefined,
                    iconNode: (
                      <PersonAvatar
                        name={nameOf(c.person)}
                        photo={c.person.avatar_url}
                        className="h-10 w-10 text-1"
                      />
                    ),
                  }}
                  disabled={message.pending}
                  onClick={() => void message.open(c.person.id)}
                />
              ))}
            </DrawerList>
          </Sheet>
        </>
      )}
    </>
  );
}

/** Rows whose person's name or username contains the query. */
function matchingPeople<T>(
  rows: readonly T[],
  query: string,
  personOf: (row: T) => { display_name: string | null; username: string | null } | null,
): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  return rows.filter((r) => {
    const p = personOf(r);
    return `${p?.display_name ?? ""} ${p?.username ?? ""}`.toLowerCase().includes(needle);
  });
}
