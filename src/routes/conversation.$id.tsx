import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import { Loading } from "@/components/ml/kit";
import { getConversation, sendMessage } from "@/lib/messages.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

/*
 * One conversation: what was said, oldest first, and the box to say the next thing. Opening the
 * thread marks it read. Messages arrive on a reload or on send — there is no live socket yet.
 */
export const Route = createFileRoute("/conversation/$id")({
  head: () => ({
    meta: [
      { title: "Conversation | MusicLinkd" },
      { name: "description", content: "Your conversation on MusicLinkd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Conversation,
});

function Conversation() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const queryClient = useQueryClient();
  const read = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !signedIn) void navigate({ to: "/welcome", replace: true });
  }, [loading, signedIn, navigate]);

  const q = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => read({ data: { id } }),
    enabled: signedIn,
  });

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [q.data?.messages.length]);

  const post = useMutation({
    mutationFn: (body: string) => send({ data: { conversationId: id, body } }),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      void queryClient.invalidateQueries({ queryKey: ["conversations", "mine"] });
    },
    onError: () => toast.error("That didn't send. Try again."),
  });

  const person = q.data?.person;
  const name = person?.display_name ?? person?.username ?? "Conversation";

  return (
    <Screen className="pb-28">
      <TopBar title={name} back="/messages" />
      <main className="space-y-3 px-5 pt-4">
        {q.isLoading ? <Loading rows={3} /> : null}
        {q.data?.messages.length === 0 ? (
          <p className="py-10 text-center text-1 text-muted-foreground">
            No messages yet. Say hello.
          </p>
        ) : null}
        {q.data?.messages.map((m) => (
          <div key={m.id} className={m.mine ? "flex justify-end" : "flex justify-start"}>
            <p
              className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm ${
                m.mine ? "bg-ink text-background" : "bg-subtle text-foreground"
              }`}
            >
              {m.body}
            </p>
          </div>
        ))}
        <div ref={end} />
      </main>

      <form
        className="fixed inset-x-0 bottom-0 z-bar mx-auto flex w-full max-w-app items-end gap-2 border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (body && !post.isPending) post.mutate(body);
        }}
      >
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message"
          className="min-h-control w-full resize-none rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
        />
        {/* A plain button, because this one submits the form. */}
        <button
          type="submit"
          aria-label="Send"
          disabled={post.isPending || !draft.trim()}
          className="state-layer flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-background transition-transform duration-200 ease-standard active:scale-97 disabled:opacity-50"
        >
          <SendHorizontal size={iconSize.md} aria-hidden />
        </button>
      </form>
    </Screen>
  );
}
