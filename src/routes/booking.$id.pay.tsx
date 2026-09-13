import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, Lock, Smartphone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TopBar, Btn } from "@/components/ml/ui";
import { PaymentSummaryCard, StickyBar } from "@/components/ml/booking";
import { useBookingDraft } from "@/components/ml/booking-context";
import { inr } from "@/data/booking";

export const Route = createFileRoute("/booking/$id/pay")({
  head: () => ({
    meta: [
      { title: "Pay your deposit — MusicLinkd booking" },
      {
        name: "description",
        content:
          "Pay the deposit that holds your slot. The balance is settled with the provider on the day.",
      },
      { property: "og:title", content: "Pay your deposit — MusicLinkd booking" },
      { property: "og:description", content: "Secure deposit payment for your studio session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pay,
});

type Phase = "form" | "processing" | "success" | "failed";

function Pay() {
  const { bookable: b, price } = useBookingDraft();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("form");
  const [method, setMethod] = useState<"upi" | "card">("upi");

  if (phase === "success") {
    return (
      <Result
        tone="ok"
        title="Payment successful"
        body="Your deposit is paid and your slot is held."
        rows={[
          ["Amount paid", inr(price.deposit)],
          ["Transaction reference", "TXN-88213047"],
          ["Booking reference", "MLB-NEW-C"],
          ["Balance at the studio", inr(price.balance)],
        ]}
        primary={
          <Link to="/booking/confirmed/$ref" params={{ ref: "MLB-NEW-C" }} className="block">
            <Btn className="w-full">View booking</Btn>
          </Link>
        }
      />
    );
  }

  if (phase === "failed") {
    return (
      <Result
        tone="bad"
        title="Payment could not be completed"
        body="Your bank declined the transaction. Your booking details are saved — nothing was charged."
        rows={[
          ["Amount", inr(price.deposit)],
          ["Method", method === "upi" ? "UPI" : "Card"],
        ]}
        primary={
          <div className="w-full space-y-2">
            <Btn className="w-full" onClick={() => setPhase("form")}>
              Try again
            </Btn>
            <Btn variant="outline" className="w-full" onClick={() => setPhase("form")}>
              Change payment method
            </Btn>
            <Btn
              variant="ghost"
              className="w-full"
              onClick={() => navigate({ to: "/booking/$id/review", params: { id: b.id } })}
            >
              Return to booking
            </Btn>
          </div>
        }
      />
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <TopBar title="Payment" subtitle={`Deposit for ${b.name}`} back={`/booking/${b.id}/review`} />
      <main className="px-5 pt-4">
        <PaymentSummaryCard p={price} />

        <h2 className="mt-6 text-[17px]">Payment method</h2>
        <div className="mt-3 space-y-2">
          <MethodRow
            icon={<Smartphone size={18} />}
            title="UPI"
            body="Pay with any UPI app"
            active={method === "upi"}
            onSelect={() => setMethod("upi")}
          />
          <MethodRow
            icon={<CreditCard size={18} />}
            title="Card"
            body="Credit or debit card"
            active={method === "card"}
            onSelect={() => setMethod("card")}
          />
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-subtle px-4 py-3 text-xs text-muted-foreground">
          <Lock size={14} className="mt-0.5 shrink-0" />
          You'll finish the payment in the provider's secure payment window. MusicLinkd never stores
          card details.
        </p>

        {phase === "processing" ? (
          <p
            role="status"
            className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-xs"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            Processing payment…
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setPhase("failed")}
          className="mt-6 min-h-11 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
        >
          Preview failure state
        </button>
      </main>

      <StickyBar
        price={inr(price.deposit)}
        hint="Deposit due now"
        disabled={phase === "processing"}
        primaryLabel="Pay securely"
        onPrimary={() => {
          setPhase("processing");
          window.setTimeout(() => setPhase("success"), 900);
        }}
      />
    </div>
  );
}

function MethodRow({
  icon,
  title,
  body,
  active,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left ${
        active ? "border-primary" : "border-border"
      }`}
    >
      <span className="text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
      <span
        className={`h-5 w-5 shrink-0 rounded-full border ${active ? "border-primary bg-primary" : "border-border"}`}
        aria-hidden
      />
    </button>
  );
}

function Result({
  tone,
  title,
  body,
  rows,
  primary,
}: {
  tone: "ok" | "bad";
  title: string;
  body: string;
  rows: [string, string][];
  primary: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-16">
      <div>
        {tone === "ok" ? (
          <CheckCircle2 size={44} className="text-primary" />
        ) : (
          <AlertTriangle size={44} className="text-destructive" />
        )}
        <h1 className="mt-4 text-[28px] leading-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <dl className="mt-6 rounded-lg border border-border bg-card p-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 py-1.5">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-8">{primary}</div>
    </div>
  );
}
