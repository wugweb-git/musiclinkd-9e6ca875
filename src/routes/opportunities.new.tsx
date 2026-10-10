import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, ArrowLeft, ArrowRight, Send, Sparkles } from "lucide-react";
import { ActionBar, Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, StatusPill } from "@/components/ml/kit";
import { createOpportunity } from "@/lib/applications.functions";
import { draftHiringCopy } from "@/lib/hiring-copy.functions";
import { useAuth } from "@/hooks/use-auth";
import { PersonTypePicker } from "@/components/ml/onboarding";
import { labelFor, talentGroups, useTaxonomy, type TaxonomyOption } from "@/lib/taxonomy";
import { roleIcon } from "@/lib/role-icons";
import { CityField, Field as SharedField, inputClass } from "@/components/ml/listing-form";
import { iconSize } from "@/lib/tokens";
import type { ReactNode } from "react";

type Step = "basics" | "location" | "availability" | "compensation" | "requirements" | "preview";
const order: Step[] = [
  "basics",
  "location",
  "availability",
  "compensation",
  "requirements",
  "preview",
];
const labels: Record<Step, string> = {
  basics: "The basics",
  location: "Where",
  availability: "When",
  compensation: "Compensation",
  requirements: "Requirements",
  preview: "Preview",
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

// Every person type, talent groups then business types: the same list onboarding asks from.
const roleGroups = [...talentGroups, { key: "business", label: "Business" }] as const;

function typeIcon(o: TaxonomyOption) {
  const Icon = roleIcon(o);
  return <Icon size={16} aria-hidden />;
}
const payTypes = ["Paid", "Revenue share", "Unpaid"] as const;

function CreateOpportunity() {
  const { step } = Route.useSearch();
  const nav = useNavigate();
  const idx = order.indexOf(step);

  const [title, setTitle] = useState("");
  // The role needed is a person-type slug from the taxonomy (owner, 10 Oct 2026).
  const [cat, setCat] = useState<string | null>(null);
  const { options: taxonomy } = useTaxonomy();
  const roleLabel = cat ? labelFor(taxonomy?.person_types, cat) : null;
  const [summary, setSummary] = useState("");
  const [roughBrief, setRoughBrief] = useState("");
  const [approvedCopy, setApprovedCopy] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [city, setCity] = useState("");
  const [mode, setMode] = useState<string>("On-site");
  const [dates, setDates] = useState("");
  const [payType, setPayType] = useState<string>("Paid");
  // No "kind of work" field: that taxonomy (Work for Hire, Royalties Split…) is retired;
  // Compensation type below says how it is paid (owner, 10 Oct 2026).
  const [budget, setBudget] = useState("");
  const [reqs, setReqs] = useState<string[]>([]);
  const [req, setReq] = useState("");
  const { signedIn } = useAuth();
  const post = useServerFn(createOpportunity);
  const writeCopy = useServerFn(draftHiringCopy);
  const aiDraft = useMutation({
    mutationFn: () =>
      writeCopy({
        data: {
          title: title.trim(),
          ...(roleLabel ? { role: roleLabel } : {}),
          ...(summary.trim() ? { summary: summary.trim() } : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
          ...(dates.trim() ? { dates: dates.trim() } : {}),
          ...(budget.trim() && payType === "Paid" ? { budget: budget.trim() } : {}),
          requirements: reqs,
          roughBrief,
        },
      }),
    onSuccess: ({ copy }) => {
      setApprovedCopy(copy);
      setReviewed(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't prepare the copy. Try again."),
  });

  // Rupees in the box, paise in the database. A budget that is not a number is kept as the note.
  const budgetPaise =
    payType === "Paid" && /^\s*₹?\s*\d[\d,]*(?:\.\d{1,2})?\s*$/.test(budget)
      ? Math.round(Number(budget.replace(/[₹,\s]/g, "")) * 100)
      : undefined;

  // Stored rows hold the person-type slug; screens show its label (owner, 10 Oct 2026).
  const payload = (status: "draft" | "open") => ({
    title: title.trim(),
    status,
    ...(cat ? { roleRequired: cat } : {}),
    ...(budgetPaise === undefined ? {} : { budgetPaise }),
    ...(payType === "Paid"
      ? budget.trim() && budgetPaise === undefined
        ? { budgetNote: budget.trim() }
        : {}
      : { budgetNote: payType }),
    ...(city.trim() ? { location: city.trim() } : {}),
    ...(approvedCopy ? { summary: approvedCopy } : {}),
    workMode: mode as "On-site" | "Remote" | "Hybrid",
    ...(dates.trim() ? { dateWindow: dates.trim() } : {}),
    requirements: reqs,
  });

  const publish = useMutation({
    mutationFn: () => post({ data: payload("open") }),
    onSuccess: (row) => void nav({ to: "/opportunities/$id", params: { id: row.slug } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't post. Try again."),
  });

  const saveDraft = useMutation({
    mutationFn: () => post({ data: payload("draft") }),
    onSuccess: () => {
      toast.success("Saved as a draft");
      void nav({ to: "/opportunities/mine" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  const go = (s: Step) => {
    if (s === "preview" && !approvedCopy) setApprovedCopy(summary);
    void nav({ to: "/opportunities/new", search: { step: s } });
  };

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
              className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-ink" : "bg-background"}`}
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
                className={inputClass}
              />
            </Field>
            <Field label="Role needed">
              <PersonTypePicker
                groups={roleGroups}
                options={taxonomy?.person_types ?? []}
                selected={cat ? [cat] : []}
                icon={typeIcon}
                onToggle={(slug) => setCat(slug === cat ? null : slug)}
              />
            </Field>
            <Field label="Short summary" hint="Two lines. Detail comes later.">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-input bg-card p-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          </>
        ) : null}

        {step === "location" ? (
          <>
            <CityField id="opportunity-city" value={city} onChange={setCity} />
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
                className={inputClass}
              />
            </Field>
            <Card className="space-y-1">
              <p className="text-1 font-semibold">Already have a booking calendar?</p>
              <p className="text-1 text-muted-foreground">
                Confirmed hires can be converted into a booking in one tap — availability stays
                owned by Booking.
              </p>
              <BtnLink to="/business/availability" variant="ghost" className="w-full">
                Open Availability
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
              <Field label="Budget">
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="₹25,000–₹40,000 per song"
                  className={inputClass}
                />
              </Field>
            ) : (
              <Card>
                <p className="text-1 text-muted-foreground">
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
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <Btn
                  icon={<Plus size={iconSize.sm} aria-hidden />}
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
                <p className="text-1 text-muted-foreground">No requirements yet.</p>
              ) : (
                reqs.map((r, i) => (
                  <div
                    key={`${r}-${i}`}
                    className="flex items-center gap-2 rounded-lg bg-subtle px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-1">{r}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${r}`}
                      className="state-layer flex min-h-touch items-center gap-1 text-1 font-semibold text-foreground"
                      onClick={() => setReqs((p) => p.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={iconSize.sm} aria-hidden /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

        {step === "preview" ? (
          <>
            <Field
              label="Rough hiring brief"
              hint="Optional. AI uses only what you write here and in the earlier steps."
            >
              <textarea
                value={roughBrief}
                onChange={(e) => setRoughBrief(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Describe the role in your own words"
                className="w-full rounded-lg border border-input bg-card p-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
            <Btn
              variant="outline"
              className="w-full"
              icon={<Sparkles size={iconSize.sm} aria-hidden />}
              loading={aiDraft.isPending}
              disabled={!signedIn || roughBrief.trim().length < 10}
              onClick={() => aiDraft.mutate()}
            >
              Draft copy with AI
            </Btn>
            <Field
              label="Job copy"
              hint="Edit this text before publishing. Only the text below is saved as the published description."
            >
              <textarea
                value={approvedCopy}
                onChange={(e) => {
                  setApprovedCopy(e.target.value);
                  setReviewed(false);
                }}
                rows={10}
                maxLength={2000}
                className="w-full rounded-lg border border-input bg-card p-4 text-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
            <label className="flex min-h-touch items-center gap-3 text-1 font-semibold">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                className="h-5 w-5 accent-ink"
              />
              I have reviewed and approve this copy
            </label>
            <h2 className="text-3 leading-tight">This is what applicants see</h2>
            <Card className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <StatusPill label={roleLabel ?? "Role needed"} tone="brand" />
                <StatusPill label={mode} />
              </div>
              <h3 className="text-2 leading-snug">{title || "Untitled opportunity"}</h3>
              <p className="whitespace-pre-wrap text-1 text-muted-foreground">
                {approvedCopy || "No description yet."}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-1 text-muted-foreground">
                <span>{city || "City not set"}</span>
                <span>{dates || "Dates not set"}</span>
                <span>{payType === "Paid" ? budget || "Budget not set" : payType}</span>
              </div>
              {reqs.length ? (
                <ul className="list-disc space-y-1 pl-5 text-1">
                  {reqs.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
            <p className="text-1 text-muted-foreground">
              Posting shares your profile, verification status and reviews with applicants.
            </p>
          </>
        ) : null}
      </div>

      <ActionBar>
        <div className="flex gap-2">
          {idx > 0 ? (
            <Btn
              variant="outline"
              className="flex-1"
              icon={<ArrowLeft size={iconSize.sm} aria-hidden />}
              onClick={() => go(order[idx - 1]!)}
            >
              Back
            </Btn>
          ) : (
            <Btn
              variant="outline"
              icon={<Save size={iconSize.sm} aria-hidden />}
              className="flex-1"
              disabled={title.trim().length < 3 || !signedIn || saveDraft.isPending}
              loading={saveDraft.isPending}
              onClick={() => saveDraft.mutate()}
            >
              Save Draft
            </Btn>
          )}
          <Btn
            className="flex-1"
            icon={
              step === "preview" ? (
                <Send size={iconSize.sm} aria-hidden />
              ) : (
                <ArrowRight size={iconSize.sm} aria-hidden />
              )
            }
            disabled={
              !canContinue ||
              (step === "preview" && (!signedIn || !reviewed || !approvedCopy.trim()))
            }
            loading={publish.isPending}
            onClick={() => (step === "preview" ? publish.mutate() : go(order[idx + 1]!))}
          >
            {step === "preview" ? "Publish" : "Continue"}
          </Btn>
        </div>
      </ActionBar>
    </Screen>
  );
}

/**
 * The shared field wrapper, with an id derived from its label. This was a copy that gave the
 * label no association with its control at all, so a screen reader read the two apart.
 */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const id = `opportunity-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <SharedField label={label} id={id} {...(hint ? { hint } : {})}>
      {children}
    </SharedField>
  );
}
