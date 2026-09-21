import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { conversationWith } from "@/lib/messages.functions";

/** Opens the conversation with one person (starting it on first contact) in Messages. */
export function useMessagePerson() {
  const navigate = useNavigate();
  const start = useServerFn(conversationWith);
  const [pending, setPending] = useState(false);
  async function open(profileId: string) {
    setPending(true);
    try {
      const { id } = await start({ data: { profileId } });
      // Like LinkedIn: the thread opens with the message box ready to type in.
      void navigate({ to: "/conversation/$id", params: { id }, search: { compose: true } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open that conversation. Try again.");
    } finally {
      setPending(false);
    }
  }
  return { open, pending };
}
