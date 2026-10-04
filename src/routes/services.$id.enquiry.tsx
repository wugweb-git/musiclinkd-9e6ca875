import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, EmptyState, Loading, Price, Segmented, StateCard } from "@/components/ml/kit";

import { useService } from "@/hooks/use-services";
import { useAuth } from "@/hooks/use-auth";
import { sendEnquiry } from "@/lib/enquiries.functions";
import { Field, inputClass } from "@/components/ml/listing-form";
import { priceParts } from "@/lib/price";

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
  const { service: s, owner, pending, error, retry } = useService(id);
  const { signedIn } = useAuth();
  const [mode, setMode] = useState<(typeof modes)[number]>("Quick question");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [scope, setScope] = useState("");
  const [sent, setSent] = useState(false);

  // Saved as a lead for the service's owner (their Leads and a notice) and posted into your chat
  // with them, the same as an enquiry from a business page.
  const send = useServerFn(sendEnquiry);
  const enquire = useMutation({
    mutationFn: async (body: string) => {
      if (!s) throw new Error("Service not found");
      await send({
        data: {
          businessProfileId: s.profile_id,
          intent: `${mode === "Custom quote" ? "Custom quote" : "Question"}: ${s.name}`.slice(
            0,
            60,
          ),
          message: body,
        },
      });
    },
    onSuccess: () => setSent(true),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't send. Try again."),
  });

  // A paused service takes no new enquiries; its owner can still preview it.
  if (pending || error || !s || (s.status !== "active" && !owner)) {
    return (
      <Screen>
        <TopBar title="Enquiry" back="/services" />
        <div className="px-5 pt-6">
          {pending ? (
            <Loading />
          ) : error ? (
            <StateCard
              tone="error"
              title="We couldn't load this service"
              body="Check your connection and try again."
              action={<Btn onClick={retry}>Retry</Btn>}
            />
          ) : (
            <EmptyState
              title="Service not found"
              body="This service may have been paused or removed."
            />
          )}
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
            <CheckCircle2 size={40} className="mx-auto text-ink" aria-hidden />
            <h2 className="mt-3 text-3 leading-tight">
              {mode === "Custom quote" ? "Quote request sent" : "Question sent"}
            </h2>
            <p className="mt-2 text-1 text-muted-foreground">
              {mode === "Custom quote"
                ? "You will get a priced answer, usually within a day. Nothing is committed until you accept it."
                : "Replies land in Messages and as a notification."}
            </p>
          </Card>
          <BtnLink to="/inbox" search={{ tab: "messages" }} className="w-full">
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
      <TopBar title="Enquire" subtitle={s.name} back={`/services/${s.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-sm font-semibold">{s.name}</p>
          <Price
            from
            inline
            price={priceParts(s.price_paise, s.price_unit, s.price_note)}
            className="mt-1"
            amountClassName="text-1 font-semibold"
          />
          {s.turnaround ? (
            <p className="mt-1 text-1 text-muted-foreground">Turnaround {s.turnaround}</p>
          ) : null}
        </Card>

        <Segmented value={mode} options={modes} onChange={setMode} />

        {mode === "Quick question" ? (
          <Field label="Your question" id="q">
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Turnaround, revisions, whether stems are included…"
              aria-labelledby="q"
              className="w-full rounded-lg border border-input bg-card p-4 text-sm outline-none focus:border-ink"
            />
          </Field>
        ) : (
          <div className="space-y-4">
            <Field label="What is the work?" id="scope">
              <textarea
                rows={4}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Number of songs, current state of the material, deadline."
                aria-labelledby="scope"
                className="w-full rounded-lg border border-input bg-card p-4 text-sm outline-none focus:border-ink"
              />
            </Field>
            <Field
              label="Budget range"
              id="budget"
              hint={'A range gets a real number back. "Best price" usually gets ignored.'}
            >
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹20,000 – ₹30,000"
                aria-labelledby="budget"
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <Btn
          className="w-full"
          disabled={!ready || enquire.isPending}
          onClick={() => {
            if (!signedIn) {
              toast("Sign in to send this");
              return;
            }
            const body =
              mode === "Quick question"
                ? message.trim()
                : `${scope.trim()}\n\nBudget: ${budget.trim()}`;
            enquire.mutate(body);
          }}
        >
          {enquire.isPending
            ? "Sending…"
            : mode === "Custom quote"
              ? "Request quote"
              : "Send question"}
        </Btn>
      </div>
    </Screen>
  );
}
