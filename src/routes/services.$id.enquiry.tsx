import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, EmptyState, Price } from "@/components/ml/kit";
import { getService, servicePrice } from "@/data/services";

export const Route = createFileRoute("/services/$id/enquiry")({
  head: () => ({
    meta: [
      { title: "Enquire about a service | MusicLinkd" },
      {
        name: "description",
        content:
          "Ask about a service or request a custom quote when your project does not fit a standard package.",
      },
      { property: "og:title", content: "Enquire about a service | MusicLinkd" },
      { property: "og:description", content: "Ask a question or request a custom quote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServiceEnquiry,
});

const modes = ["Quick question", "Custom quote"] as const;

function ServiceEnquiry() {
  const { id } = Route.useParams();
  const s = getService(id);
  const [mode, setMode] = useState<(typeof modes)[number]>("Quick question");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [scope, setScope] = useState("");
  const [sent, setSent] = useState(false);

  if (!s) {
    return (
      <Screen>
        <TopBar title="Enquiry" back="/services" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Service not found"
            body="This service may have been paused or removed."
          />
        </div>
      </Screen>
    );
  }

  if (sent) {
    return (
      <Screen>
        <TopBar title="Sent" back={`/services/${s.id}`} />
        <div className="space-y-4 px-5 pt-6">
          <Card className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-primary" aria-hidden />
            <h2 className="mt-3 text-[19px] leading-tight">
              {mode === "Custom quote" ? "Quote request sent" : "Question sent"}
            </h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {mode === "Custom quote"
                ? "You will get a priced answer, usually within a day. Nothing is committed until you accept it."
                : "Replies land in Connections and as a notification."}
            </p>
          </Card>
          <BtnLink to="/messages" className="w-full">
            Open Connections
          </BtnLink>
        </div>
      </Screen>
    );
  }

  const ready =
    mode === "Quick question"
      ? message.trim().length > 7
      : scope.trim().length > 7 && budget.trim().length > 0;

  return (
    <Screen>
      <TopBar title="Enquire" subtitle={s.title} back={`/services/${s.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-sm font-semibold">{s.title}</p>
          <Price
            price={servicePrice({ price: s.basePrice, unit: s.unit })}
            className="mt-1"
            amountClassName="text-[13px] font-semibold"
          />
          <p className="mt-1 text-[13px] text-muted-foreground">Turnaround {s.turnaround}</p>
        </Card>

        <div className="flex gap-2">
          {modes.map((m) => (
            <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
              {m}
            </Chip>
          ))}
        </div>

        {mode === "Quick question" ? (
          <Card>
            <label htmlFor="q" className="text-sm font-semibold">
              Your question
            </label>
            <textarea
              id="q"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Turnaround, revisions, whether stems are included…"
              className="mt-2 w-full rounded-[16px] border border-border bg-background p-3 text-sm outline-none"
            />
          </Card>
        ) : (
          <Card className="space-y-3">
            <div>
              <label htmlFor="scope" className="text-sm font-semibold">
                What is the work?
              </label>
              <textarea
                id="scope"
                rows={4}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Number of songs, current state of the material, deadline."
                className="mt-2 w-full rounded-[16px] border border-border bg-background p-3 text-sm outline-none"
              />
            </div>
            <div>
              <label htmlFor="budget" className="text-sm font-semibold">
                Budget range
              </label>
              <input
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹20,000 – ₹30,000"
                className="mt-2 w-full rounded-[16px] border border-border bg-background p-3 text-sm outline-none"
              />
            </div>
            <p className="text-[12px] text-muted-foreground">
              A range gets a real number back. "Best price" usually gets ignored.
            </p>
          </Card>
        )}

        <Btn className="w-full" disabled={!ready} onClick={() => setSent(true)}>
          {mode === "Custom quote" ? "Request quote" : "Send question"}
        </Btn>
      </div>
    </Screen>
  );
}
