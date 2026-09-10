import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { getBand } from "@/data/band";

export const Route = createFileRoute("/bands/$id/contact")({
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

const reasons = ["Book for a show", "Studio session", "Collaboration", "Press or feature"];

function BandContact() {
  const { id } = Route.useParams();
  const band = getBand(id);
  const [reason, setReason] = useState(reasons[0]!);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

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
            <CheckCircle2 size={40} className="mx-auto text-primary" aria-hidden />
            <h2 className="mt-3 text-[19px] leading-tight">{band.name} has your message</h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              It goes to whoever handles bookings for the band. Replies land in Connections.
            </p>
          </Card>
          <Link to="/messages" className="block">
            <Btn className="w-full">Open Connections</Btn>
          </Link>
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
          <div className="mt-3 flex flex-wrap gap-2">
            {reasons.map((r) => (
              <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
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
            className="mt-2 w-full rounded-[16px] border border-border bg-background p-3 text-sm outline-none"
          />
        </Card>

        <Btn className="w-full" disabled={message.trim().length < 8} onClick={() => setSent(true)}>
          Send to {band.name}
        </Btn>
      </div>
    </Screen>
  );
}
