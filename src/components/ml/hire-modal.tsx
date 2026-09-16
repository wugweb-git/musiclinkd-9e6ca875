import { useState } from "react";
import {
  Check,
  Handshake,
  CalendarDays,
  MessageCircle,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { Btn, Sheet } from "./ui";

const options: { label: string; desc: string; Icon: LucideIcon }[] = [
  { label: "Send message", desc: "Start a direct conversation", Icon: MessageCircle },
  { label: "Request quote", desc: "Ask for pricing on a brief", Icon: ReceiptText },
  { label: "Book session", desc: "Reserve studio or live dates", Icon: CalendarDays },
  { label: "Hire for project", desc: "Formal engagement with contract", Icon: Handshake },
];

export function HireModal({
  open,
  onClose,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  /** Who the request is for. Without one, the sheet names no one. */
  subject?: { name: string; detail?: string | undefined } | undefined;
}) {
  const [choice, setChoice] = useState("Hire for project");
  const [sent, setSent] = useState(false);

  return (
    <Sheet
      open={open}
      onClose={() => {
        setSent(false);
        onClose();
      }}
    >
      {sent ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-container text-success">
            <Check size={32} aria-hidden />
          </div>
          <h2 className="text-3">Request sent</h2>
          <Btn
            className="mt-6 w-full"
            onClick={() => {
              setSent(false);
              onClose();
            }}
          >
            Done
          </Btn>
        </div>
      ) : (
        <>
          <h2 className="text-3">Contact professional</h2>
          <p className="mb-4 text-1 text-muted-foreground">
            {subject ? [subject.name, subject.detail].filter(Boolean).join(" · ") : null}
          </p>

          <div className="mb-5 space-y-2">
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setChoice(o.label)}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left ${
                  choice === o.label ? "border-foreground bg-subtle" : "border-transparent bg-subtle"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-subtle">
                  <o.Icon size={20} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="block text-1 text-muted-foreground">{o.desc}</span>
                </span>
                <span
                  className={`h-5 w-5 rounded-full border-2 ${
                    choice === o.label ? "border-foreground bg-subtle" : "border-transparent bg-subtle"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Field label="Project name" placeholder="Neon Monsoon — title track" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Budget" placeholder="₹75,000" />
              <Field label="Timeline" placeholder="Mid-Sept 2026" />
            </div>
            <div>
              <label
                htmlFor="message"
                className="mb-1.5 block text-1 font-medium text-muted-foreground"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full rounded-lg bg-subtle p-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <Btn className="mt-5 w-full" onClick={() => setSent(true)}>
            Submit request
          </Btn>
        </>
      )}
    </Sheet>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-1 font-medium text-muted-foreground">{label}</label>
      <input
        placeholder={placeholder}
        className="h-12 w-full rounded-sm bg-subtle px-4 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
