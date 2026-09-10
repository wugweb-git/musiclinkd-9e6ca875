import { useState } from "react";
import { Btn, Sheet } from "./ui";

const options = [
  { label: "Send message", desc: "Start a direct conversation", emoji: "💬" },
  { label: "Request quote", desc: "Ask for pricing on a brief", emoji: "🧾" },
  { label: "Book session", desc: "Reserve studio or live dates", emoji: "🗓" },
  { label: "Hire for project", desc: "Formal engagement with contract", emoji: "🤝" },
];

export function HireModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "var(--success-container)" }}
          >
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-xl">Request sent</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ananya usually responds within 6 hours.
          </p>
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
          <h2 className="text-xl">Contact professional</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Ananya Sharma · Playback Vocalist · Mumbai
          </p>

          <div className="mb-5 space-y-2">
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setChoice(o.label)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                  choice === o.label ? "border-primary bg-card" : "border-border bg-card"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-subtle">
                  {o.emoji}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="block text-1 text-muted-foreground">{o.desc}</span>
                </span>
                <span
                  className={`h-5 w-5 rounded-full border-2 ${
                    choice === o.label ? "border-primary bg-primary" : "border-border"
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
                className="mb-1.5 block text-1 font-bold uppercase tracking-wide text-muted-foreground"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                defaultValue="Hi Ananya — we're cutting a Hindi-Sufi title track in Mumbai and would love your vocals on the hook."
                className="w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
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
      <label className="mb-1.5 block text-1 font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
