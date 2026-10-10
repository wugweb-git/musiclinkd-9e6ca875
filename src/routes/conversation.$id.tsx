import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PUBLIC_ORIGIN } from "@/lib/site";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronRight,
  Music,
  Plus,
  SendHorizontal,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Screen, Sheet } from "@/components/ml/ui";
import { DrawerList, DrawerOptionRow } from "@/components/ml/drawer-list";
import { useViewer } from "@/components/ml/viewer";
import { listMyServices } from "@/lib/services.functions";
import { listMyPortfolio } from "@/lib/portfolio.functions";
import { Loading, Price } from "@/components/ml/kit";
import { priceParts } from "@/lib/price";
import { CallBtn } from "@/components/ml/talent-profile";
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
function ShareWorkSheet({
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
  const origin = PUBLIC_ORIGIN;
  const live = (services.data ?? []).filter((s) => s.status === "active");
  const published = (works.data ?? []).filter((w) => w.published);
  return (
    <Sheet open={open} onClose={onClose} title="Share">
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
    staleTime: 15_000,
    refetchInterval: signedIn ? 15_000 : false,
  });

  // Older pages, read as the reader scrolls to the top of the thread.
  const [older, setOlder] = useState<Message[]>([]);
  const [olderMore, setOlderMore] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const keepFromBottom = useRef<number | null>(null);
  const hasMore = olderMore ?? q.data?.hasMore ?? false;

  async function loadOlder() {
    const first = older[0] ?? q.data?.messages[0];
    if (!first || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const el = list.current;
    keepFromBottom.current = el ? el.scrollHeight - el.scrollTop : null;
    try {
      const page = await read({ data: { id, before: first.created_at } });
      setOlder((o) => [...page.messages, ...o]);
      setOlderMore(page.hasMore);
    } catch {
      keepFromBottom.current = null;
      toast.error("Earlier messages couldn't load.");
    } finally {
      setLoadingOlder(false);
    }
  }

  /*
   * The newest page is a sliding window of the latest messages. Once earlier ones are loaded, a new
   * message pushes the window's oldest out of it, and that message was not in `older` either (that
   * page ends just before it), so it vanished. Anything that slides out is kept with the older
   * pages, and every message is shown once by id.
   */
  const lastPage = useRef<Message[]>([]);
  useEffect(() => {
    const page = q.data?.messages ?? [];
    const prev = lastPage.current;
    lastPage.current = page;
    if (!older.length || !prev.length || !page.length) return;
    const inPage = new Set(page.map((m) => m.id));
    const slid = prev.filter((m) => !inPage.has(m.id) && m.created_at < page[0]!.created_at);
    if (slid.length) setOlder((o) => [...o, ...slid.filter((m) => !o.some((x) => x.id === m.id))]);
  }, [q.data?.messages, older.length]);

  const seen = new Set<string>();
  const messages: Shown[] = [...older, ...(q.data?.messages ?? []), ...outbox].filter((m) =>
    seen.has(m.id) ? false : (seen.add(m.id), true),
  );
  const newestId = messages[messages.length - 1]?.id;

  // Newest at the bottom, in view; after loading older ones, stay where the reader was.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    if (keepFromBottom.current !== null) {
      el.scrollTop = el.scrollHeight - keepFromBottom.current;
      keepFromBottom.current = null;
    } else el.scrollTop = el.scrollHeight;
  }, [messages.length, newestId]);

  /*
   * Opened from a Message button, or a thread with nothing in it yet: ready to type — where there
   * is a mouse. On a phone, focusing the box opens the keyboard over half the screen, so the chat
   * arrived hidden behind a keypad nobody asked for (owner, 29 Sep 2026). Tapping the box still
   * opens it.
   */
  const fresh = q.data?.messages.length === 0;
  useEffect(() => {
    if (!compose && !fresh) return;
    if (window.matchMedia("(pointer: fine)").matches) box.current?.focus();
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
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-warm/90 px-5 py-3 pt-safe backdrop-blur">
          <Link
            to="/inbox"
            search={{ tab: "messages" }}
            className="hit-area flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 ease-standard active:scale-97"
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

        <div
          ref={list}
          onScroll={(e) => {
            if (e.currentTarget.scrollTop < 120) void loadOlder();
          }}
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3"
        >
          {q.isError ? (
            <div role="alert" className="py-6 text-sm text-muted-foreground">
              This conversation couldn't load. Check your connection and try again.
              <button
                type="button"
                onClick={() => void q.refetch()}
                className="state-layer mt-3 flex min-h-touch w-full items-center justify-center rounded-lg border border-border bg-card font-semibold text-foreground"
              >
                Retry
              </button>
            </div>
          ) : null}
          {q.isLoading ? <Loading rows={3} /> : null}
          {hasMore ? (
            <button
              type="button"
              disabled={loadingOlder}
              onClick={() => void loadOlder()}
              className="state-layer min-h-touch w-full py-3 text-center text-1 font-semibold text-foreground disabled:text-muted-foreground"
              aria-live="polite"
            >
              {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
            </button>
          ) : null}

          {q.data?.service ? (
            // Started from an enquiry about a service: the thread opens with what was asked about.
            <Link
              to="/services/$id"
              params={{ id: q.data.service.id }}
              className="state-layer mt-4 flex min-h-touch items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-1 text-muted-foreground">Enquiry about</span>
                <span className="block truncate text-sm font-semibold">{q.data.service.name}</span>
                <Price
                  from
                  inline
                  price={priceParts(
                    q.data.service.price_paise,
                    q.data.service.price_unit,
                    q.data.service.price_note,
                  )}
                  className="mt-0.5"
                  amountClassName="text-1 font-semibold"
                />
              </span>
              <ChevronRight size={iconSize.sm} className="text-muted-foreground" aria-hidden />
            </Link>
          ) : null}
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
                ? `${joinsPrev ? "rounded-tr-sm" : ""} rounded-br-sm`
                : `${joinsPrev ? "rounded-tl-sm" : ""} rounded-bl-sm`;
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
                      className={`max-w-[78%] whitespace-pre-wrap break-words rounded-lg px-4 py-2.5 text-sm leading-snug ${corners} ${
                        m.mine ? "bg-ink text-background" : "bg-card text-foreground"
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
          noValidate
          className="flex shrink-0 items-end gap-2 border-t border-border bg-warm px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <button
            type="button"
            aria-label="Share your profile, a service or a work"
            onClick={() => setSharing(true)}
            className="state-layer flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-foreground transition-transform duration-200 ease-standard active:scale-97"
          >
            <Plus size={iconSize.md} aria-hidden />
          </button>
          <div className="flex min-h-12 min-w-0 flex-1 items-center rounded-full border border-input bg-card px-5 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-ring">
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
              className="no-scrollbar max-h-[132px] w-full resize-none bg-transparent py-3 text-2 leading-snug outline-none placeholder:text-muted-foreground"
            />
          </div>
          {/* A plain button, because this one submits the form. */}
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim()}
            className="state-layer flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-ink-foreground transition-[transform,background-color,color] duration-200 ease-standard active:scale-97 disabled:bg-subtle disabled:text-muted-foreground"
          >
            <SendHorizontal size={iconSize.md} aria-hidden />
          </button>
        </form>

        <ShareWorkSheet
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
