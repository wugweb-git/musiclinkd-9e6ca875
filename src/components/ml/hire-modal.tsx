import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Handshake,
  CalendarDays,
  MessageCircle,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { Btn, BtnLink, Sheet } from "./ui";
import { DrawerList, DrawerOptionRow } from "./drawer-list";
import { Field, SheetSelect, inputClass } from "./listing-form";
import { useFieldErrors } from "./auth";
import { useMessagePerson } from "@/hooks/use-message-person";
import { sendEnquiry } from "@/lib/enquiries.functions";
import { iconSize } from "@/lib/tokens";

type Intent = "message" | "quote" | "book" | "hire";

const options: { value: Intent; label: string; hint: string; icon: LucideIcon; send: string }[] = [
  {
    value: "message",
    label: "Send message",
    hint: "Start a direct conversation",
    icon: MessageCircle,
    send: "Open chat",
  },
  {
    value: "quote",
    label: "Request quote",
    hint: "Ask for pricing on a brief",
    icon: ReceiptText,
    send: "Request quote",
  },
  {
    value: "book",
    label: "Book session",
    hint: "Reserve studio or live dates",
    icon: CalendarDays,
    send: "Request booking",
  },
  {
    value: "hire",
    label: "Hire for project",
    hint: "Formal engagement with contract",
    icon: Handshake,
    send: "Send hire request",
  },
];

const timelines = [
  { value: "This week", label: "This week" },
  { value: "Within 2 weeks", label: "Within 2 weeks" },
  { value: "This month", label: "This month" },
  { value: "1–3 months", label: "1–3 months" },
  { value: "Flexible", label: "Flexible" },
] as const;

type FieldName = "project" | "budget" | "timeline" | "date" | "message";

const today = () => new Date().toISOString().slice(0, 10);
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Contact a professional from their profile. A message opens the chat; a quote, a booking or a
 * hire request is saved as an enquiry (their Leads) and posted into the conversation with them, so
 * both sides carry on in Messages. Nothing says "sent" until the database has it.
 */
export function HireModal({
  open,
  onClose,
  subject,
  profileId,
}: {
  open: boolean;
  onClose: () => void;
  /** Who the request is for. Without one, the sheet names no one. */
  subject?: { name: string; detail?: string | undefined } | undefined;
  /** The profile the request goes to; without one the sheet can't send. */
  profileId?: string | undefined;
}) {
  const [intent, setIntent] = useState<Intent>("hire");
  const [project, setProject] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<{ conversationId: string | null } | null>(null);
  const errors = useFieldErrors<FieldName>();
  const chat = useMessagePerson();
  const queryClient = useQueryClient();
  const send = useServerFn(sendEnquiry);

  const option = options.find((o) => o.value === intent) ?? options[3]!;
  const amount = Number(budget.replace(/[^\d]/g, ""));

  // What each field needs, in plain words. Budget is optional only when asking for a quote.
  const problems: Record<FieldName, string | null> = {
    project: project.trim().length < 3 ? "Name the project in a few words." : null,
    budget:
      !budget.trim() && intent === "quote"
        ? null
        : !budget.trim()
          ? "Add a budget in rupees."
          : !amount || amount < 500
            ? "Enter a budget of at least ₹500."
            : null,
    timeline: intent !== "book" && !timeline ? "Pick when you need this done." : null,
    date: intent === "book" && !date ? "Pick the date you want to book." : null,
    message:
      message.trim().length < 20 ? "Describe what you need in at least 20 characters." : null,
  };

  function reset() {
    setProject("");
    setBudget("");
    setTimeline(null);
    setDate("");
    setMessage("");
    setSent(null);
    errors.reset();
  }

  function close() {
    reset();
    onClose();
  }

  const request = useMutation({
    mutationFn: () => {
      const when =
        intent === "book"
          ? `Date: ${new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`
          : `Timeline: ${timeline}`;
      const lines = [
        `Project: ${project.trim()}`,
        amount ? `Budget: ${rupees(amount)}` : null,
        when,
        "",
        message.trim(),
      ].filter((l) => l !== null);
      return send({
        data: {
          businessProfileId: profileId ?? "",
          intent: option.label,
          message: lines.join("\n"),
        },
      });
    },
    onSuccess: (r) => {
      setSent({ conversationId: r.conversationId });
      void queryClient.invalidateQueries({ queryKey: ["conversations", "mine"] });
    },
  });

  function submit() {
    if (intent === "message") {
      if (profileId) void chat.open(profileId);
      return;
    }
    errors.submitted();
    if (Object.values(problems).some(Boolean) || !profileId) return;
    request.mutate();
  }

  const err = (name: FieldName) => errors.errorFor(name, problems[name]);

  return (
    <Sheet open={open} onClose={close} title="Contact professional">
      {sent ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-container text-success">
            <Check size={iconSize.xl} aria-hidden />
          </div>
          <h2 className="text-3">{option.label} sent</h2>
          <p className="mt-1 text-1 text-muted-foreground">
            {subject?.name ?? "They"} will see it in Messages and reply there.
          </p>
          <div className="mt-6 flex gap-2">
            <Btn variant="outline" className="flex-1" onClick={close}>
              Done
            </Btn>
            {sent.conversationId ? (
              <BtnLink
                to="/conversation/$id"
                params={{ id: sent.conversationId }}
                onClick={close}
                className="flex-1"
              >
                Open chat
              </BtnLink>
            ) : null}
          </div>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h2 className="text-3">Contact professional</h2>
          <p className="mb-4 text-1 text-muted-foreground">
            {subject ? [subject.name, subject.detail].filter(Boolean).join(" · ") : null}
          </p>

          <DrawerList label="What you want to do">
            {options.map((o) => (
              <DrawerOptionRow
                key={o.value}
                option={{ value: o.value, label: o.label, hint: o.hint, icon: o.icon }}
                selected={intent === o.value}
                onClick={() => setIntent(o.value)}
              />
            ))}
          </DrawerList>

          {intent !== "message" ? (
            <div className="mt-5 space-y-4">
              <Field label="Project name" id="hire-project" error={err("project")}>
                <input
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  onBlur={() => errors.touch("project")}
                  aria-invalid={Boolean(err("project"))}
                  placeholder="Neon Monsoon — title track"
                  maxLength={120}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={intent === "quote" ? "Budget (optional)" : "Budget"}
                  id="hire-budget"
                  error={err("budget")}
                >
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    >
                      ₹
                    </span>
                    <input
                      value={budget}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 9);
                        setBudget(digits ? Number(digits).toLocaleString("en-IN") : "");
                      }}
                      onBlur={() => errors.touch("budget")}
                      aria-invalid={Boolean(err("budget"))}
                      inputMode="numeric"
                      placeholder="75,000"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>
                {intent === "book" ? (
                  <Field label="Date" id="hire-date" error={err("date")}>
                    <input
                      type="date"
                      value={date}
                      min={today()}
                      onChange={(e) => {
                        setDate(e.target.value);
                        errors.touch("date");
                      }}
                      aria-invalid={Boolean(err("date"))}
                      className={inputClass}
                    />
                  </Field>
                ) : (
                  <Field label="Timeline" id="hire-timeline" error={err("timeline")}>
                    <SheetSelect
                      title="Timeline"
                      value={timeline}
                      options={timelines}
                      onChange={(v) => {
                        setTimeline(v);
                        errors.touch("timeline");
                      }}
                      placeholder="Pick one"
                    />
                  </Field>
                )}
              </div>
              <Field label="Message" id="hire-message" error={err("message")}>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onBlur={() => errors.touch("message")}
                  aria-invalid={Boolean(err("message"))}
                  maxLength={1500}
                  placeholder="What you need, and anything they should know"
                  className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
                />
              </Field>
              {request.isError ? (
                <p role="alert" className="text-1 text-destructive">
                  {request.error instanceof Error
                    ? request.error.message
                    : "The request didn't send. Try again."}
                </p>
              ) : null}
            </div>
          ) : null}

          <Btn
            type="submit"
            className="mt-5 w-full"
            loading={request.isPending || chat.pending}
            disabled={!profileId}
          >
            {option.send}
          </Btn>
        </form>
      )}
    </Sheet>
  );
}
