import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, SegmentedField } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import { bandViewFromRow, loadBand } from "@/lib/band-view";
import { conversationWith, sendMessage } from "@/lib/messages.functions";

export const Route = createFileRoute("/bands/$id/contact")({
  loader: ({ params }) => loadBand(params.id),
  head: () => ({
    meta: [
      { title: "Contact a band | MusicLinkd" },
      {
        name: "description",
        content: "Reach a band's booking contact with your date, venue and budget in one message.",
      },
      { property: "og:title", content: "Contact a band | MusicLinkd" },
      { property: "og:description", content: "Send a band your date, venue and budget." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BandContact,
});

const reasons = ["Show", "Session", "Collab", "Press"];

function BandContact() {
  const { band: row, labels } = Route.useLoaderData();
  const { user, signedIn } = useAuth();
  const navigate = useNavigate();
  const band = row ? bandViewFromRow(row, labels, user?.id ?? null) : undefined;
  const [reason, setReason] = useState(reasons[0]!);
  const [message, setMessage] = useState("");
  const open = useServerFn(conversationWith);
  const say = useServerFn(sendMessage);
  // Bookings go to whoever runs the band: an owner or admin on the lineup, else its creator.
  const contact =
    row?.members.find((m) => m.role === "owner")?.profile_id ??
    row?.members.find((m) => m.role === "admin")?.profile_id ??
    row?.created_by;
  const send = useMutation({
    mutationFn: async () => {
      const { id } = await open({ data: { profileId: contact! } });
      await say({
        data: { conversationId: id, body: `${reason} · ${band!.name}\n\n${message.trim()}` },
      });
    },
    onError: () => toast.error("That didn't send. Try again."),
  });
  const sent = send.isSuccess;

  if (!band) {
    return (
      <Screen>
        <TopBar title="Contact" back="/bands" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Band not found"
            body="This band may have been deleted or made private."
          />
        </div>
      </Screen>
    );
  }

  if (sent) {
    return (
      <Screen>
        <TopBar title="Message sent" back={`/bands/${band.id}`} />
        <div className="space-y-4 px-5 pt-6">
          <Card className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-ink" aria-hidden />
            <h2 className="mt-3 text-3 leading-tight">{band.name} has your message</h2>
            <p className="mt-2 text-1 text-muted-foreground">
              It goes to whoever handles bookings for the band. Replies land in Connections.
            </p>
          </Card>
          <BtnLink to="/messages" className="w-full">
            Open Connections
          </BtnLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Contact" subtitle={band.name} back={`/bands/${band.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-sm font-semibold">Why are you reaching out?</p>
          <div className="mt-3">
            <SegmentedField
              label="Why are you reaching out?"
              value={reason}
              options={reasons}
              onChange={setReason}
            />
          </div>
        </Card>

        <Card>
          <label htmlFor="msg" className="text-sm font-semibold">
            Your message
          </label>
          <textarea
            id="msg"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Date, venue, set length and what you can pay."
            className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Card>

        <Btn
          className="w-full"
          disabled={message.trim().length < 8 || !contact || contact === user?.id}
          loading={send.isPending}
          onClick={() => (signedIn ? send.mutate() : void navigate({ to: "/welcome" }))}
        >
          Send to {band.name}
        </Btn>
      </div>
    </Screen>
  );
}
