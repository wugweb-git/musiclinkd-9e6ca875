import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, StatusPill } from "@/components/ml/kit";
import { opportunityCategories } from "@/data/opportunities";

type Step =
  | "basics"
  | "location"
  | "availability"
  | "compensation"
  | "requirements"
  | "preview"
  | "published";
const order: Step[] = [
  "basics",
  "location",
  "availability",
  "compensation",
  "requirements",
  "preview",
  "published",
];
const labels: Record<Step, string> = {
  basics: "The basics",
  location: "Where",
  availability: "When",
  compensation: "Compensation",
  requirements: "Requirements",
  preview: "Preview",
  published: "Published",
};

export const Route = createFileRoute("/opportunities/new")({
  validateSearch: (s: Record<string, unknown>): { step: Step } => ({
    step: (order as string[]).includes(String(s["step"])) ? (s["step"] as Step) : "basics",
  }),
  head: () => ({
    meta: [
      { title: "Post an opportunity | MusicLinkd" },
      {
        name: "description",
        content:
          "Post a structured music-industry requirement and receive applications with portfolios attached.",
      },
      { property: "og:title", content: "Post an opportunity | MusicLinkd" },
      {
        property: "og:description",
        content: "Tell the industry what you need — role, dates, budget, requirements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateOpportunity,
});

const modes = ["On-site", "Remote", "Hybrid"] as const;
const payTypes = ["Paid", "Revenue share", "Unpaid"] as const;

function CreateOpportunity() {
  const { step } = Route.useSearch();
  const nav = useNavigate();
  const idx = order.indexOf(step);

  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState<string>("On-site");
  const [dates, setDates] = useState("");
  const [payType, setPayType] = useState<string>("Paid");
  const [budget, setBudget] = useState("");
  const [reqs, setReqs] = useState<string[]>([]);
  const [req, setReq] = useState("");

  const go = (s: Step) => nav({ to: "/opportunities/new", search: { step: s } });

  if (step === "published") {
    return (
      <Screen>
        <TopBar title="Published" back="/opportunities/mine" />
        <div className="space-y-4 px-5 pt-6">
          <Card className="space-y-3 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check size={26} />
            </span>
            <h2 className="text-[20px] leading-tight">Your opportunity is live</h2>
            <p className="text-[13px] text-muted-foreground">
              It's now in Discover and in recommendations for matching professionals. You'll be
              notified on every application.
            </p>
          </Card>
          <BtnLink to="/opportunities/mine" className="w-full">
            Manage it
          </BtnLink>
          <BtnLink to="/opportunities" variant="outline" className="w-full">
            Back to opportunities
          </BtnLink>
        </div>
      </Screen>
    );
  }

  const canContinue =
    step === "basics"
      ? title.trim().length > 4 && !!cat
      : step === "location"
        ? city.trim().length > 1
        : true;

  return (
    <Screen>
      <TopBar
        title="Post an opportunity"
        subtitle={`Step ${idx + 1} of 6 · ${labels[step]}`}
        back="/opportunities"
      />
      <div className="space-y-4 px-5 pt-4 pb-28">
        <div className="flex items-center gap-1.5">
          {order.slice(0, 6).map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-subtle"}`}
            />
          ))}
        </div>

        {step === "basics" ? (
          <>
            <Field label="What do you need?" hint="Write it like you'd say it out loud.">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Female playback singer for indie-pop single"
                className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-[14px] outline-none"
              />
            </Field>
            <Field label="Requirement type">
              <div className="flex flex-wrap gap-2">
                {opportunityCategories.map((c) => (
                  <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
                    {c.emoji} {c.label}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Short summary" hint="Two lines. Detail comes later.">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="w-full rounded-[20px] border border-border bg-card p-4 text-[14px] outline-none"
              />
            </Field>
          </>
        ) : null}

        {step === "location" ? (
          <>
            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-[14px] outline-none"
              />
            </Field>
            <Field label="Work mode">
              <div className="flex flex-wrap gap-2">
                {modes.map((m) => (
                  <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
                    {m}
                  </Chip>
                ))}
              </div>
            </Field>
          </>
        ) : null}

        {step === "availability" ? (
          <>
            <Field label="Dates or window" hint="Applicants filter on this.">
              <input
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="18–22 Sep 2026"
                className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-[14px] outline-none"
              />
            </Field>
            <Card className="space-y-1">
              <p className="text-[13px] font-semibold">Already have a booking calendar?</p>
              <p className="text-[12px] text-muted-foreground">
                Confirmed hires can be converted into a booking in one tap — availability stays
                owned by Booking.
              </p>
              <BtnLink to="/provider/availability" variant="ghost" className="w-full">
                Open availability
              </BtnLink>
            </Card>
          </>
        ) : null}

        {step === "compensation" ? (
          <>
            <Field label="Compensation type">
              <div className="flex flex-wrap gap-2">
                {payTypes.map((p) => (
                  <Chip key={p} active={payType === p} onClick={() => setPayType(p)}>
                    {p}
                  </Chip>
                ))}
              </div>
            </Field>
            {payType === "Paid" ? (
              <Field label="Budget" hint="Posts with a budget get 3× more applications.">
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="₹25,000–₹40,000 per song"
                  className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-[14px] outline-none"
                />
              </Field>
            ) : (
              <Card>
                <p className="text-[13px] text-muted-foreground">
                  Unpaid and revenue-share posts are labelled clearly to applicants. Asking
                  applicants to pay you is not allowed.
                </p>
              </Card>
            )}
          </>
        ) : null}

        {step === "requirements" ? (
          <>
            <Field label="Add requirements" hint="Mark the deal-breakers as must-haves.">
              <div className="flex gap-2">
                <input
                  value={req}
                  onChange={(e) => setReq(e.target.value)}
                  placeholder="Hindi + English diction"
                  className="min-w-0 flex-1 rounded-[16px] border border-border bg-card px-4 py-3 text-[14px] outline-none"
                />
                <Btn
                  onClick={() => {
                    if (req.trim()) {
                      setReqs((p) => [...p, req.trim()]);
                      setReq("");
                    }
                  }}
                >
                  Add
                </Btn>
              </div>
            </Field>
            <div className="space-y-2">
              {reqs.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No requirements yet.</p>
              ) : (
                reqs.map((r, i) => (
                  <div
                    key={`${r}-${i}`}
                    className="flex items-center gap-2 rounded-[16px] border border-border bg-card px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px]">{r}</span>
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-foreground"
                      onClick={() => setReqs((p) => p.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

        {step === "preview" ? (
          <>
            <h2 className="text-[19px] leading-tight">This is what applicants see</h2>
            <Card className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <StatusPill
                  label={
                    cat
                      ? (opportunityCategories.find((c) => c.key === cat)?.label ?? "Requirement")
                      : "Requirement"
                  }
                  tone="brand"
                />
                <StatusPill label={mode} />
              </div>
              <h3 className="text-[17px] leading-snug">{title || "Untitled opportunity"}</h3>
              <p className="text-[13px] text-muted-foreground">{summary || "No summary yet."}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                <span>{city || "City not set"}</span>
                <span>{dates || "Dates not set"}</span>
                <span>{payType === "Paid" ? budget || "Budget not set" : payType}</span>
              </div>
              {reqs.length ? (
                <ul className="list-disc space-y-1 pl-5 text-[13px]">
                  {reqs.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
            <p className="text-[12px] text-muted-foreground">
              Posting shares your profile, verification status and reviews with applicants.
            </p>
          </>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-2">
          {idx > 0 ? (
            <Btn variant="outline" className="flex-1" onClick={() => go(order[idx - 1]!)}>
              Back
            </Btn>
          ) : (
            <BtnLink to="/opportunities/mine" variant="outline" className="flex-1 w-full">
              Save draft
            </BtnLink>
          )}
          <Btn className="flex-1" disabled={!canContinue} onClick={() => go(order[idx + 1]!)}>
            {step === "preview" ? "Publish" : "Continue"}
          </Btn>
        </div>
      </div>
    </Screen>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[14px] font-semibold">{label}</p>
        {hint ? <p className="text-[12px] text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
