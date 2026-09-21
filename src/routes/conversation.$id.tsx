import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Music, Plus, SendHorizontal, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Screen, Sheet } from "@/components/ml/ui";
import { DrawerList, DrawerOptionRow } from "@/components/ml/drawer-list";
import { useViewer } from "@/components/ml/viewer";
import { listMyServices } from "@/lib/services.functions";
import { listMyPortfolio } from "@/lib/portfolio.functions";
import { Loading } from "@/components/ml/kit";
import { CallBtn } from "@/components/ml/person-profile";
import { PersonAvatar } from "@/components/ml/person-avatar";
import { getConversation, sendMessage, type Message } from "@/lib/messages.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

/*
 * One conversation, laid out like the 2026 messengers (LinkedIn, WhatsApp, iMessage): the person
 * up top (photo, name, headline — tap for their profile), what was said grouped by day and by
 * sender, and a composer pinned to the bottom that grows with the message. A sent message shows at
 * once and settles when the database answers. Messages arrive on a reload or on send — there is
 * no live socket yet.
 */
export const Route = createFileRoute("/conversation/$id")({
  head: () => ({
    meta: [
      { title: "Conversation | MusicLinkd" },
      { name: "description", content: "Your conversation on MusicLinkd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { compose?: boolean } =>
    s["compose"] === true || s["compose"] === "true" ? { compose: true } : {},
  component: Conversation,
});

/** Messages from one sender this close together read as one group. */
const GROUP_MS = 5 * 60 * 1000;

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** "Today", "Yesterday", "Mon, 21 Sep", or with the year when it isn't this one. */
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

type Shown = Message & { pending?: boolean };

/**
 * What the + shares into the message: a link to your profile, one of your live services, or one of
 * your published works. Picking one drops its link into the box; nothing sends until you do.
 */
function ShareSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const { username } = useViewer();
  const readServices = useServerFn(listMyServices);
  const readWorks = useServerFn(listMyPortfolio);
  const services = useQuery({
    queryKey: ["services", "mine"],
    queryFn: () => readServices(),
    enabled: open,
  });
  const works = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => readWorks(),
    enabled: open,
  });
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const live = (services.data ?? []).filter((s) => s.status === "active");
  const published = (works.data ?? []).filter((w) => w.published);
  return (
    <Sheet open={open} onClose={onClose} title="Share">
      <h2 className="mb-3 text-3">Share</h2>
      <DrawerList label="Share">
        {username ? (
          <DrawerOptionRow
            option={{
              value: "profile",
              label: "Your profile",
              hint: `@${username}`,
              icon: UserRound,
            }}
            onClick={() => onPick(`${origin}/profile/${username}`)}
          />
        ) : null}
        {live.map((s) => (
          <DrawerOptionRow
            key={s.id}
            option={{ value: s.id, label: s.name, hint: "Service", icon: BriefcaseBusiness }}
            onClick={() => onPick(`${origin}/services/${s.id}`)}
          />
        ))}
        {published.map((w) => (
          <DrawerOptionRow
            key={w.id}
            option={{ value: w.id, label: w.title, hint: "Portfolio", icon: Music }}
            onClick={() => onPick(`${origin}/portfolio/${w.id}`)}
          />
        ))}
      </DrawerList>
    </Sheet>
  );
}

function Conversation() {
  const { id } = Route.useParams();
  const { compose } = Route.useSearch();
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const queryClient = useQueryClient();
  const read = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const [draft, setDraft] = useState("");
  const [outbox, setOutbox] = useState<Shown[]>([]);
  const [sharing, setSharing] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && !signedIn) void navigate({ to: "/welcome", replace: true });
  }, [loading, signedIn, navigate]);

  const q = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => read({ data: { id } }),
    enabled: signedIn,
  });

  const messages: Shown[] = [...(q.data?.messages ?? []), ...outbox];

  // Newest at the bottom, in view.
  useLayoutEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Opened from a Message button, or a thread with nothing in it yet: ready to type.
  const fresh = q.data?.messages.length === 0;
  useEffect(() => {
    if (compose || fresh) box.current?.focus();
  }, [compose, fresh]);

  // The box grows with the message, up to five lines, then scrolls.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  const post = useMutation({
    mutationFn: (m: Shown) => send({ data: { conversationId: id, body: m.body } }),
    onMutate: (m) => setOutbox((o) => [...o, m]),
    onSuccess: async (_r, m) => {
      await queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      setOutbox((o) => o.filter((x) => x.id !== m.id));
      void queryClient.invalidateQueries({ queryKey: ["conversations", "mine"] });
    },
    onError: (_e, m) => {
      setOutbox((o) => o.filter((x) => x.id !== m.id));
      setDraft((d) => d || m.body);
      toast.error("That didn't send. Try again.");
    },
  });

  function submit() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    post.mutate({
      id: `pending-${Date.now()}`,
      body,
      created_at: new Date().toISOString(),
      sender_id: "",
      mine: true,
      pending: true,
    });
    box.current?.focus();
  }

  const person = q.data?.person ?? null;
  const name = person?.display_name ?? person?.username ?? "Conversation";
  const firstName = person ? name.split(" ")[0] : "";

  return (
    <Screen className="pb-0">
      <div className="flex h-[100dvh] flex-col">
        <header className="flex shrink-0 items-center gap-3 bg-background/90 px-5 py-3 backdrop-blur">
          <Link
            to="/messages"
            className="hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-transform duration-200 ease-standard active:scale-97"
            aria-label="Back"
          >
            <ArrowLeft size={iconSize.md} aria-hidden />
          </Link>
          {person?.username ? (
            <Link
              to="/profile/$username"
              params={{ username: person.username }}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <PersonAvatar name={name} photo={person?.avatar_url} className="h-10 w-10 text-1" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold leading-tight">{name}</span>
                {person.headline ? (
                  <span className="block truncate text-1 text-muted-foreground">
                    {person.headline}
                  </span>
                ) : null}
              </span>
            </Link>
          ) : (
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</h1>
          )}
          {person ? <CallBtn profileId={person.id} className="h-10 w-10" /> : null}
        </header>

        <div ref={list} className="flex-1 overflow-y-auto px-5 pb-3">
          {q.isLoading ? <Loading rows={3} /> : null}

          {q.data && messages.length === 0 ? (
            // First contact: who you're writing to, the way LinkedIn opens a new thread.
            <div className="flex flex-col items-center pt-10 text-center">
              <PersonAvatar name={name} photo={person?.avatar_url} className="h-20 w-20 text-sm" />
              <p className="mt-3 text-sm font-semibold">{name}</p>
              {person?.headline ? (
                <p className="mt-0.5 max-w-[28ch] text-1 text-muted-foreground">
                  {person.headline}
                </p>
              ) : null}
              {person?.username ? (
                <Link
                  to="/profile/$username"
                  params={{ username: person.username }}
                  className="mt-3 text-1 font-semibold underline-offset-4 hover:underline"
                >
                  View profile
                </Link>
              ) : null}
            </div>
          ) : null}

          <ol className="flex flex-col">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
              const joinsPrev =
                !newDay &&
                prev?.mine === m.mine &&
                Date.parse(m.created_at) - Date.parse(prev.created_at) < GROUP_MS;
              const joinsNext =
                !!next &&
                next.mine === m.mine &&
                dayKey(next.created_at) === dayKey(m.created_at) &&
                Date.parse(next.created_at) - Date.parse(m.created_at) < GROUP_MS;
              // Round all over, except the sender's side where bubbles in a group meet, and the
              // tail corner on the last one.
              const corners = m.mine
                ? `${joinsPrev ? "rounded-tr-md" : ""} rounded-br-md`
                : `${joinsPrev ? "rounded-tl-md" : ""} rounded-bl-md`;
              return (
                <li key={m.id} className={joinsPrev ? "mt-0.5" : "mt-3"}>
                  {newDay ? (
                    <p className="my-3 text-center text-1 font-medium text-muted-foreground">
                      {dayLabel(m.created_at)}
                    </p>
                  ) : null}
                  <div className={`flex items-end gap-2 ${m.mine ? "justify-end" : ""}`}>
                    {!m.mine ? (
                      joinsNext ? (
                        <span aria-hidden className="w-7 shrink-0" />
                      ) : (
                        <PersonAvatar
                          name={name}
                          photo={person?.avatar_url}
                          className="h-7 w-7 shrink-0 text-[10px]"
                        />
                      )
                    ) : null}
                    <p
                      className={`max-w-[78%] whitespace-pre-wrap break-words rounded-[20px] px-4 py-2.5 text-sm leading-snug ${corners} ${
                        m.mine ? "bg-ink text-background" : "bg-subtle text-foreground"
                      } ${m.pending ? "opacity-60" : ""}`}
                    >
                      {m.body}
                    </p>
                  </div>
                  {!joinsNext ? (
                    <p
                      className={`mt-1 text-[11px] text-muted-foreground ${m.mine ? "text-right" : "pl-9"}`}
                    >
                      {m.pending ? "Sending…" : timeLabel(m.created_at)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        {/* The composer, the 2026 way: a round + for sharing your work, a borderless field that
            grows with the message, and a squared send key that fills in once there is text. */}
        <form
          className="flex shrink-0 items-end gap-2 bg-background px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <button
            type="button"
            aria-label="Share your profile, a service or a work"
            onClick={() => setSharing(true)}
            className="state-layer flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-transform duration-200 ease-standard active:scale-97"
          >
            <Plus size={iconSize.md} strokeWidth={2} aria-hidden />
          </button>
          <div className="flex min-h-12 min-w-0 flex-1 items-center rounded-[26px] bg-card px-5 transition-shadow duration-200 focus-within:shadow-[0_0_0_2px_var(--color-foreground)]">
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <textarea
              ref={box}
              id="message"
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends on a keyboard; Shift+Enter is a new line. Phones keep Enter as a
                // new line and send with the button.
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  window.matchMedia("(pointer: fine)").matches
                ) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={firstName ? `Message ${firstName}` : "Write a message"}
              className="no-scrollbar max-h-[132px] w-full resize-none bg-transparent py-3 text-sm leading-snug outline-none placeholder:text-muted-foreground"
            />
          </div>
          {/* A plain button, because this one submits the form. */}
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim()}
            className="state-layer flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-background transition-[transform,background-color,color,border-radius] duration-200 ease-standard active:scale-97 active:rounded-full disabled:bg-card disabled:text-muted-foreground"
          >
            <SendHorizontal size={iconSize.md} strokeWidth={2} aria-hidden />
          </button>
        </form>

        <ShareSheet
          open={sharing}
          onClose={() => setSharing(false)}
          onPick={(url) => {
            setSharing(false);
            setDraft((d) => (d.trim() ? `${d.trimEnd()} ${url}` : url));
            box.current?.focus();
          }}
        />
      </div>
    </Screen>
  );
}
