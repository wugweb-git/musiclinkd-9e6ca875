import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import {
  Check,
  FileText,
  Lock,
  Paperclip,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Eye,
} from "lucide-react";
import { Screen, TopBar, Btn, Sheet, VerifiedBadge } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Row } from "@/components/ml/kit";
import {
  verificationTypes,
  myVerifications,
  statusLabel,
  statusTone,
  verificationSteps,
  eligibility,
  type VerificationType,
} from "@/data/verification";

type Search = { step: number; mode?: "new" };

export const Route = createFileRoute("/verification/$type")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = Number(search["step"]);
    const step = Number.isFinite(raw)
      ? Math.min(Math.max(Math.trunc(raw), 0), verificationSteps.length - 1)
      : 0;
    return search["mode"] === "new" ? { step, mode: "new" } : { step };
  },
  loader: ({ params }) => {
    const def = verificationTypes.find((t) => t.key === params.type);
    if (!def) throw notFound();
    return { key: def.key };
  },
  head: ({ loaderData }) => {
    const def = loaderData ? verificationTypes.find((t) => t.key === loaderData.key) : undefined;
    if (!def) {
      return {
        meta: [
          { title: "Verification unavailable | MusicLinkd" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${def.title} | MusicLinkd` },
        { name: "description", content: def.blurb },
        { property: "og:title", content: `${def.title} | MusicLinkd` },
        { property: "og:description", content: def.verifies },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: TypeNotFound,
  component: VerificationRequestScreen,
});

function TypeNotFound() {
  return (
    <Screen>
      <TopBar title="Verification" back="/verification" />
      <div className="px-5 pt-6">
        <EmptyState
          title="That verification type does not exist"
          body="Pick one of the supported levels instead."
        >
          <Link to="/verification/choose">
            <Btn className="w-full">See verification types</Btn>
          </Link>
        </EmptyState>
      </div>
    </Screen>
  );
}

function VerificationRequestScreen() {
  const { key } = Route.useLoaderData();
  const { step, mode } = Route.useSearch();
  const navigate = useNavigate();
  const def = useMemo(() => verificationTypes.find((t) => t.key === key)!, [key]);
  const existing = myVerifications.find((v) => v.type === key);
  const gate = eligibility(key);

  const resubmitting = mode === "new";
  const status = resubmitting ? "unverified" : (existing?.status ?? "unverified");

  const go = (next: number) =>
    navigate({
      to: "/verification/$type",
      params: { type: key },
      search: { step: next, mode: "new" },
    });

  if (!gate.allowed && status === "unverified") {
    return (
      <Screen>
        <TopBar title={def.title} subtitle="Locked" back="/verification/choose" />
        <div className="px-5 pt-6">
          <EmptyState title="Verify your identity first" body={gate.reason}>
            <Link to="/verification/$type" params={{ type: "identity" }} search={{ step: 0 }}>
              <Btn className="w-full">Start identity verification</Btn>
            </Link>
            <Link to="/verification/choose">
              <Btn variant="outline" className="w-full">
                Back to types
              </Btn>
            </Link>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  if (status === "verified" && existing) {
    return (
      <Screen>
        <TopBar title={def.title} back="/verification" />
        <div className="space-y-4 px-5 pt-4 pb-6">
          <Card className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-subtle">
              <ShieldCheck size={24} className="text-primary" aria-hidden />
            </div>
            <h2 className="text-[18px] leading-tight">Verified</h2>
            <p className="text-[13px] text-muted-foreground">
              Approved on {existing.decided} by {existing.reviewer ?? "the Trust team"}.
            </p>
            <div className="flex items-center justify-center gap-2 rounded-[16px] bg-subtle px-3 py-2">
              <span className="text-[14px] font-semibold">Aarav Mehta</span>
              <VerifiedBadge size={14} />
            </div>
          </Card>
          <p className="text-[13px] text-muted-foreground">{def.whatOthersSee}</p>
          <Row
            title="Where the badge appears"
            subtitle="Profile, search, listings, reviews"
            to="/verification/badge"
          />
          <Row
            title="Document privacy"
            subtitle="What we keep and for how long"
            to="/verification/privacy"
          />
        </div>
      </Screen>
    );
  }

  if (status === "in_review" && existing) {
    return (
      <Screen>
        <TopBar title={def.title} back="/verification" />
        <div className="space-y-4 px-5 pt-4 pb-6">
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] leading-tight">In review</h2>
              <StatusPill label={statusLabel.in_review} tone={statusTone.in_review} />
            </div>
            <p className="text-[13px] text-muted-foreground">
              Submitted {existing.submitted}. A reviewer checks each request by hand —{" "}
              {def.turnaround.toLowerCase()}. You will get a notification with the decision.
            </p>
          </Card>
          <Card className="space-y-2">
            <h3 className="text-[14px]">What you sent</h3>
            {existing.documents.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-2 text-[13px] text-muted-foreground"
              >
                <Check size={14} className="shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 break-words">{d.name}</span>
              </div>
            ))}
          </Card>
          <Card className="py-3">
            <p className="text-[12px] text-muted-foreground">
              You can withdraw this request while it is in review. Withdrawing removes the documents
              from the queue.
            </p>
          </Card>
          <Row
            title="Document privacy"
            subtitle="How this review works"
            to="/verification/privacy"
          />
        </div>
      </Screen>
    );
  }

  if (status === "rejected" && existing) {
    return (
      <Screen>
        <TopBar title={def.title} back="/verification" />
        <div className="space-y-4 px-5 pt-4 pb-6">
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] leading-tight">Needs changes</h2>
              <StatusPill label={statusLabel.rejected} tone={statusTone.rejected} />
            </div>
            <p className="text-[13px] text-muted-foreground">{existing.reason}</p>
            <p className="text-[12px] text-muted-foreground">Reviewed {existing.decided}</p>
          </Card>
          <Card className="space-y-2">
            <h3 className="text-[14px]">What to fix</h3>
            {existing.documents.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="min-w-0 break-words text-muted-foreground">{d.name}</span>
                <StatusPill
                  label={d.state === "rejected" ? "Replace" : "Accepted"}
                  tone={d.state === "rejected" ? "bad" : "good"}
                />
              </div>
            ))}
            <p className="pt-1 text-[12px] text-muted-foreground">
              Accepted documents are kept — you only replace what failed.
            </p>
          </Card>
          <Btn
            className="w-full"
            onClick={() => {
              void go(2);
            }}
          >
            Resubmit
          </Btn>
          <Link to="/verification/choose">
            <Btn variant="outline" className="w-full">
              Review requirements
            </Btn>
          </Link>
        </div>
      </Screen>
    );
  }

  if (status === "expired" && existing) {
    return (
      <Screen>
        <TopBar title={def.title} back="/verification" />
        <div className="space-y-4 px-5 pt-4 pb-6">
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] leading-tight">Verification expired</h2>
              <StatusPill label={statusLabel.expired} tone={statusTone.expired} />
            </div>
            <p className="text-[13px] text-muted-foreground">
              This badge expired on {existing.expiresOn}. It is hidden from your listings until you
              renew.
            </p>
          </Card>
          <Btn
            className="w-full"
            onClick={() => {
              void go(0);
            }}
          >
            Renew verification
          </Btn>
          <Row title="Document privacy" subtitle="What renewal needs" to="/verification/privacy" />
        </div>
      </Screen>
    );
  }

  return <Wizard def={def} step={step} go={go} />;
}

function Wizard({
  def,
  step,
  go,
}: {
  def: VerificationType;
  step: number;
  go: (n: number) => void | Promise<void>;
}) {
  const docs = def.requirements.filter((r) => r.kind === "document");
  const infos = def.requirements.filter((r) => r.kind === "info");

  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const infoDone = infos.every((r) => (values[r.label] ?? "").trim().length > 1);
  const docsDone = docs.every((r) => files[r.label]);

  const label = verificationSteps[step] ?? verificationSteps[0]!;

  return (
    <Screen>
      <TopBar
        title={def.title}
        subtitle={`Step ${step + 1} of ${verificationSteps.length} · ${label}`}
        back="/verification/choose"
      />
      <div className="px-5 pt-3">
        <div className="flex gap-1.5" aria-hidden>
          {verificationSteps.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-subtle"}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 px-5 pt-4 pb-6">
        {step === 0 ? (
          <>
            <Card className="space-y-2">
              <h2 className="text-[16px] leading-tight">What this badge proves</h2>
              <p className="text-[13px] text-muted-foreground">{def.verifies}</p>
              <p className="text-[12px] text-muted-foreground">People see: {def.whatOthersSee}</p>
            </Card>
            <section>
              <h2 className="text-[15px]">What you need</h2>
              <div className="mt-3 space-y-2">
                {def.requirements.map((r) => (
                  <Card key={r.label} className="py-3">
                    <p className="text-[13px] font-semibold break-words">{r.label}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{r.why}</p>
                  </Card>
                ))}
              </div>
            </section>
            <Card className="flex gap-3 py-3">
              <Lock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <p className="text-[12px] text-muted-foreground">
                We never ask for bank details, passwords or your Aadhaar number. Review time:{" "}
                {def.turnaround.toLowerCase()}.
              </p>
            </Card>
            <Btn className="w-full" onClick={() => void go(1)}>
              Start
            </Btn>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-[13px] text-muted-foreground">
              Only the details this badge actually needs.
            </p>
            {infos.length === 0 ? (
              <Card className="py-3">
                <p className="text-[13px] text-muted-foreground">
                  No extra details needed — go straight to documents.
                </p>
              </Card>
            ) : (
              infos.map((r) => (
                <label key={r.label} className="block">
                  <span className="text-[13px] font-semibold">{r.label}</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">{r.why}</span>
                  <input
                    value={values[r.label] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [r.label]: e.target.value }))}
                    maxLength={140}
                    className="mt-2 h-12 w-full rounded-[16px] border border-border bg-card px-4 text-sm outline-none focus:border-primary"
                    placeholder="Type here"
                  />
                </label>
              ))
            )}
            <Card className="py-3">
              <p className="text-[12px] text-muted-foreground">
                These details are read only by the Trust team for this review. They are never shown
                on your profile.
              </p>
            </Card>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1" onClick={() => void go(0)}>
                Back
              </Btn>
              <Btn
                className="flex-1"
                onClick={() => {
                  if (infos.length === 0 || infoDone) void go(2);
                }}
              >
                Continue
              </Btn>
            </div>
            {infos.length > 0 && !infoDone ? (
              <p className="text-center text-[12px] text-muted-foreground">
                Fill every field to continue.
              </p>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-[13px] text-muted-foreground">
              Attach each document. Previews stay on this device until you submit.
            </p>
            {docs.map((r) => {
              const file = files[r.label];
              return (
                <Card key={r.label} className="space-y-2 py-3">
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold break-words">{r.label}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{r.why}</p>
                    </div>
                    {file ? <StatusPill label="Attached" tone="good" /> : null}
                  </div>
                  {file ? (
                    <>
                      <p className="truncate rounded-[14px] bg-subtle px-3 py-2 text-[12px]">
                        {file}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPreview(file)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold"
                        >
                          <Eye size={13} aria-hidden /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((f) => ({
                              ...f,
                              [r.label]: `${r.label.toLowerCase().replace(/\s+/g, "-")}-v2.jpg`,
                            }))
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold"
                        >
                          <RefreshCw size={13} aria-hidden /> Replace
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((f) => {
                              const next = { ...f };
                              delete next[r.label];
                              return next;
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold text-danger"
                        >
                          <Trash2 size={13} aria-hidden /> Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((f) => ({
                          ...f,
                          [r.label]: `${r.label.toLowerCase().replace(/\s+/g, "-")}.jpg`,
                        }))
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-subtle px-3 py-2 text-[12px] font-semibold"
                    >
                      <Paperclip size={13} aria-hidden /> Attach file
                    </button>
                  )}
                </Card>
              );
            })}
            <Card className="flex gap-3 py-3">
              <Lock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <p className="text-[12px] text-muted-foreground">
                Documents are private. Only the Trust team can open them, and they are never shown
                on your profile.
              </p>
            </Card>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1" onClick={() => void go(1)}>
                Back
              </Btn>
              <Btn
                className="flex-1"
                onClick={() => {
                  if (docsDone) void go(3);
                }}
              >
                Continue
              </Btn>
            </div>
            {!docsDone ? (
              <p className="text-center text-[12px] text-muted-foreground">
                Attach every document to continue.
              </p>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Card className="space-y-2">
              <h2 className="text-[16px] leading-tight">Review before you submit</h2>
              <p className="text-[13px] text-muted-foreground">{def.title}</p>
            </Card>
            {infos.length > 0 ? (
              <Card className="space-y-2 py-3">
                <h3 className="text-[14px]">Your details</h3>
                {infos.map((r) => (
                  <div key={r.label} className="text-[13px]">
                    <p className="text-[12px] text-muted-foreground break-words">{r.label}</p>
                    <p className="break-words text-muted-foreground">{values[r.label] || "—"}</p>
                  </div>
                ))}
              </Card>
            ) : null}
            <Card className="space-y-2 py-3">
              <h3 className="text-[14px]">Documents</h3>
              {docs.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2 text-[13px] text-muted-foreground"
                >
                  <Check size={14} className="shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 break-words">{files[r.label] ?? "Missing"}</span>
                </div>
              ))}
            </Card>
            <label className="flex items-start gap-3 rounded-[20px] border border-border bg-card px-4 py-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span className="text-[12px] text-muted-foreground">
                I confirm these documents are mine and accurate, and I allow the MusicLinkd Trust
                team to review them for this verification.
              </span>
            </label>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1" onClick={() => void go(2)}>
                Back
              </Btn>
              <Btn
                className="flex-1"
                onClick={() => {
                  if (consent) void go(4);
                }}
              >
                Submit for review
              </Btn>
            </div>
            {!consent ? (
              <p className="text-center text-[12px] text-muted-foreground">
                Give consent to submit.
              </p>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Card className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-subtle">
                <Check size={24} className="text-primary" aria-hidden />
              </div>
              <h2 className="text-[18px] leading-tight">Submitted for review</h2>
              <StatusPill label={statusLabel.in_review} tone={statusTone.in_review} />
              <p className="text-[13px] text-muted-foreground">
                A reviewer checks each request by hand. {def.turnaround} for{" "}
                {def.title.toLowerCase()}. We will notify you as soon as there is a decision.
              </p>
            </Card>
            <Card className="space-y-2 py-3">
              <h3 className="text-[14px]">What happens next</h3>
              <p className="text-[12px] text-muted-foreground">
                1. The Trust team opens your documents.
              </p>
              <p className="text-[12px] text-muted-foreground">
                2. If anything is unclear you get a note with what to fix.
              </p>
              <p className="text-[12px] text-muted-foreground">
                3. On approval the badge appears everywhere at once.
              </p>
            </Card>
            <Link to="/verification">
              <Btn className="w-full">Back to verification</Btn>
            </Link>
            <Row
              title="Where the badge appears"
              subtitle="Profile, search, listings, reviews"
              to="/verification/badge"
            />
          </>
        ) : null}
      </div>

      <Sheet open={preview !== null} onClose={() => setPreview(null)} title="Document preview">
        <div className="flex h-48 items-center justify-center rounded-[20px] bg-subtle text-[12px] text-muted-foreground">
          {preview}
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Preview only — this file stays on your device until you submit the request.
        </p>
      </Sheet>
    </Screen>
  );
}
