import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { getBusiness } from "@/data/business";

export const Route = createFileRoute("/business/$id/enquiry")({
  head: () => ({
    meta: [
      { title: "Enquire with a business | MusicLinkd" },
      { name: "description", content: "Send a studio, label or venue your dates and requirement, or jump straight to booking a room." },
      { property: "og:title", content: "Enquire with a business | MusicLinkd" },
      { property: "og:description", content: "Send your dates and requirement, or book a room directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessEnquiry,
});

const intents = ["Book a room", "Mixing / mastering", "Event or live", "Something else"];

function BusinessEnquiry() {
  const { id } = Route.useParams();
  const b = getBusiness(id);
  const [intent, setIntent] = useState(intents[0]!);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Enquiry" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This business may have been removed or is no longer public." />
        </div>
      </Screen>
    );
  }

  if (sent) {
    return (
      <Screen>
        <TopBar title="Enquiry sent" back={`/business/${b.id}`} />
        <div className="space-y-4 px-5 pt-6">
          <Card className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-primary" aria-hidden />
            <h2 className="mt-3 text-[19px] leading-tight">Your enquiry is with {b.name}</h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              They usually reply within a couple of hours. You will get a notification and the thread appears in Connections.
            </p>
          </Card>
          <Link to="/messages" className="block">
            <Btn className="w-full">Open Connections</Btn>
          </Link>
          <Link to="/business/$id" params={{ id: b.id }} className="block">
            <Btn variant="ghost" className="w-full">Back to {b.name}</Btn>
          </Link>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Enquire" subtitle={b.name} back={`/business/${b.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-sm font-semibold">What is this about?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {intents.map((i) => (
              <Chip key={i} active={intent === i} onClick={() => setIntent(i)}>
                {i}
              </Chip>
            ))}
          </div>
        </Card>

        <Card>
          <label htmlFor="enq" className="text-sm font-semibold">
            Your message
          </label>
          <textarea
            id="enq"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Dates, how many people, what you need from the room."
            className="mt-2 w-full rounded-[16px] border border-border bg-background p-3 text-sm outline-none"
          />
          <p className="mt-2 text-[12px] text-muted-foreground">Sharing rough dates gets a faster answer than "are you free?".</p>
        </Card>

        <Btn className="w-full" disabled={message.trim().length < 8} onClick={() => setSent(true)}>
          Send enquiry
        </Btn>

        <Card>
          <p className="text-sm font-semibold">Already know what you want?</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Pick a room and a date and skip the back and forth.</p>
          <Link to="/booking/$id" params={{ id: "svc-1" }} className="mt-3 block">
            <Btn variant="outline" className="w-full">Book a room</Btn>
          </Link>
        </Card>
      </div>
    </Screen>
  );
}
