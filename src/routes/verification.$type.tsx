import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useRouter, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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
import { Screen, TopBar, Btn, BtnLink, Sheet, VerifiedBadge } from "@/components/ml/ui";
import { Card, Dialog, StatusPill, EmptyState, Loading, Row } from "@/components/ml/kit";
import { StateCard } from "@/components/ml/portfolio";
import { statusLabel, statusTone, verificationSteps } from "@/data/verification";
import { formatDay, gateFor, useMyVerification } from "@/hooks/use-my-verification";
import { haptic } from "@/lib/haptics";
import {
  documentProblem,
  uploadVerificationDocument,
  VERIFICATION_DOCUMENT_ACCEPT,
} from "@/lib/verification-documents";
import {
  getVerificationTypes,
  resubmitVerificationRequest,
  startVerificationRequest,
  submitVerificationRequest,
  withdrawVerificationRequest,
  type VerificationRequestInfo,
  type VerificationTypeInfo,
} from "@/lib/verification.functions";

type Search = { step: number; mode?: "new" };

export const Route = createFileRoute("/verification/$type")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = Number(search["step"]);
    const step = Number.isFinite(raw)
      ? Math.min(Math.max(Math.trunc(raw), 0), verificationSteps.length - 1)
      : 0;
    return search["mode"] === "new" ? { step, mode: "new" } : { step };
  },
  // A type the database does not have is not found. When the types cannot be read the screen loads
  // them again itself.
  loader: async ({ params }) => {
    const result = await getVerificationTypes({ data: { roles: [] } }).catch(() => null);
    const def = result?.types.find((t) => t.key === params.type) ?? null;
    if (result && !def) throw notFound();
    return { key: params.type, def };
  },
  head: ({ loaderData }) => {
    const def = loaderData?.def;
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
          <BtnLink to="/verification/choose" className="w-full">
            See Verification Types
          </BtnLink>
        </EmptyState>
      </div>
    </Screen>
  );
}

function VerificationRequestScreen() {
  const { key, def: loaded } = Route.useLoaderData();
  const { step, mode } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const v = useMyVerification();
  const def = v.allTypes?.find((t) => t.key === key) ?? loaded;
  const withdraw = useServerFn(withdrawVerificationRequest);
  const resubmit = useServerFn(resubmitVerificationRequest);
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const go = (next: number) =>
    navigate({
      to: "/verification/$type",
      params: { type: key },
      search: { step: next, mode: "new" },
    });

  if (!def || v.pending || v.error) {
    return (
      <Screen>
        <TopBar title={def?.title ?? "Verification"} back="/verification" />
        <div className="px-5 pt-6">
          {v.error || (!def && !v.pending) ? (
            <StateCard
              tone="error"
              title="We couldn't load your verification"
              body="Check your connection and try again."
              action={
                <Btn
                  onClick={() => {
                    v.retry();
                    void router.invalidate();
                  }}
                >
                  Retry
                </Btn>
              }
            />
          ) : (
            <Loading />
          )}
        </div>
      </Screen>
    );
  }

  const existing = v.requests.find((r) => r.type === key);
  const gate = gateFor(def, v.history);

  const resubmitting = mode === "new";
  const status = resubmitting ? "unverified" : (existing?.status ?? "unverified");
  // The open draft the wizard continues, if the newest request is one.
  const draft = existing?.status === "unverified" ? existing : null;
  const label = (id: string) => def.requirements.find((r) => r.id === id)?.label ?? "";
  const phoneRequirement = def.requirements.find((r) => r.privateField === "phone");

  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      return true;
    } catch (err) {
      haptic("error");
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!gate.allowed && status === "unverified") {
    return (
      <Screen>
        <TopBar title={def.title} subtitle="Locked" back="/verification/choose" />
        <div className="px-5 pt-6">
          <EmptyState title="Verify your identity first" body={gate.reason}>
            <BtnLink
              to="/verification/$type"
              params={{ type: gate.needs ?? "identity" }}
              search={{ step: 0 }}
              className="w-full"
            >
              Start Identity Verification
            </BtnLink>
            <BtnLink to="/verification/choose" variant="outline" className="w-full">
              Back to Types
            </BtnLink>
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
              Approved on {formatDay(existing.reviewedAt)} by the Trust team.
              {existing.expiresAt ? ` Renew by ${formatDay(existing.expiresAt)}.` : ""}
            </p>
            {v.name ? (
              <div className="flex items-center justify-center gap-2 rounded-[16px] bg-subtle px-3 py-2">
                <span className="text-[14px] font-semibold">{v.name}</span>
                <VerifiedBadge size={14} />
              </div>
            ) : null}
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
    const sent = [
      ...existing.items.map((i) => label(i.requirementId)),
      ...(existing.phone && phoneRequirement ? [phoneRequirement.label] : []),
    ].filter(Boolean);
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
              Submitted {formatDay(existing.submittedAt)}. A reviewer checks each request by hand —{" "}
              {def.turnaround.toLowerCase()}. You will get a notification with the decision.
            </p>
          </Card>
          <Card className="space-y-2">
            <h3 className="text-[14px]">What you sent</h3>
            {sent.map((name) => (
              <div key={name} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Check size={14} className="shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 break-words">{name}</span>
              </div>
            ))}
          </Card>
          <Card className="space-y-3 py-3">
            <p className="text-[12px] text-muted-foreground">
              You can withdraw this request while it is in review. Withdrawing removes the documents
              from the queue.
            </p>
            <Btn variant="outline" className="w-full" onClick={() => setConfirmWithdraw(true)}>
              Withdraw
            </Btn>
          </Card>
          <Row
            title="Document privacy"
            subtitle="How this review works"
            to="/verification/privacy"
          />
        </div>
        <Dialog
          open={confirmWithdraw}
          title="Withdraw this request?"
          body="Withdrawing removes the documents from the queue."
          onClose={() => setConfirmWithdraw(false)}
        >
          <Btn
            loading={busy}
            onClick={() =>
              void act(async () => {
                await withdraw({ data: { id: existing.id } });
                await v.refresh();
              }).then((ok) => ok && setConfirmWithdraw(false))
            }
          >
            Withdraw
          </Btn>
          <Btn variant="ghost" onClick={() => setConfirmWithdraw(false)}>
            Keep It
          </Btn>
        </Dialog>
      </Screen>
    );
  }

  if (status === "rejected" && existing) {
    // Every requirement the request should have had, and whether what was sent was accepted.
    const checks = def.requirements.flatMap((r) => {
      const item = existing.items.find((i) => i.requirementId === r.id);
      const accepted = r.privateField ? Boolean(existing.phone) : item?.state === "uploaded";
      if (r.isOptional && !item) return [];
      return [{ id: r.id, name: r.label, accepted }];
    });
    return (
      <Screen>
        <TopBar title={def.title} back="/verification" />
        <div className="space-y-4 px-5 pt-4 pb-6">
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] leading-tight">Needs changes</h2>
              <StatusPill label={statusLabel.rejected} tone={statusTone.rejected} />
            </div>
            <p className="text-[13px] text-muted-foreground">{existing.rejectionReason}</p>
            <p className="text-[12px] text-muted-foreground">
              Reviewed {formatDay(existing.reviewedAt)}
            </p>
          </Card>
          <Card className="space-y-2">
            <h3 className="text-[14px]">What to fix</h3>
            {checks.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="min-w-0 break-words text-muted-foreground">{c.name}</span>
                <StatusPill
                  label={c.accepted ? "Accepted" : "Replace"}
                  tone={c.accepted ? "good" : "bad"}
                />
              </div>
            ))}
            <p className="pt-1 text-[12px] text-muted-foreground">
              Accepted documents are kept — you only replace what failed.
            </p>
          </Card>
          <Btn
            className="w-full"
            loading={busy}
            onClick={() =>
              void act(async () => {
                await resubmit({ data: { fromId: existing.id } });
                await v.refresh();
                await go(2);
              })
            }
          >
            Resubmit
          </Btn>
          <BtnLink to="/verification/choose" variant="outline" className="w-full">
            Review Requirements
          </BtnLink>
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
              This badge expired on {formatDay(existing.expiresAt)}. It is hidden from your listings
              until you renew.
            </p>
          </Card>
          <Btn
            className="w-full"
            onClick={() => {
              void go(0);
            }}
          >
            Renew Verification
          </Btn>
          <Row title="Document privacy" subtitle="What renewal needs" to="/verification/privacy" />
        </div>
      </Screen>
    );
  }

  return (
    <Wizard
      def={def}
      step={step}
      go={go}
      draft={draft}
      signedIn={v.signedIn}
      onSubmitted={v.refresh}
    />
  );
}

/** Ten digits typed with or without the country code, as +91 and the number; null otherwise. */
function indianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[1-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

type Attached = { name: string; file?: File; path?: string };

function Wizard({
  def,
  step,
  go,
  draft,
  signedIn,
  onSubmitted,
}: {
  def: VerificationTypeInfo;
  step: number;
  go: (n: number) => void | Promise<void>;
  /** The open draft of this type, whose details and documents the form starts from. */
  draft: VerificationRequestInfo | null;
  signedIn: boolean;
  onSubmitted: () => Promise<unknown>;
}) {
  const navigate = useNavigate();
  const start = useServerFn(startVerificationRequest);
  const submitRequest = useServerFn(submitVerificationRequest);
  const docs = def.requirements.filter((r) => r.kind === "document");
  const infos = def.requirements.filter((r) => r.kind === "info");

  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, Attached>>({});
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filledFrom, setFilledFrom] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [pickFor, setPickFor] = useState<string | null>(null);

  // Continue a draft: its typed details, phone and attached documents.
  useEffect(() => {
    if (!draft || filledFrom === draft.id) return;
    setFilledFrom(draft.id);
    const nextValues: Record<string, string> = {};
    const nextFiles: Record<string, Attached> = {};
    for (const item of draft.items) {
      if (item.kind === "info" && item.infoText) nextValues[item.requirementId] = item.infoText;
      if (item.kind === "document" && item.filePath) {
        nextFiles[item.requirementId] = { name: item.fileName ?? "", path: item.filePath };
      }
    }
    const phone = def.requirements.find((r) => r.privateField === "phone");
    if (phone && draft.phone) nextValues[phone.id] = draft.phone.replace(/^\+91/, "");
    setValues(nextValues);
    setFiles(nextFiles);
  }, [draft, filledFrom, def.requirements]);

  const filledIn = (r: VerificationTypeInfo["requirements"][number]) =>
    r.privateField === "phone"
      ? indianPhone(values[r.id] ?? "") !== null
      : (values[r.id] ?? "").trim().length > 1;
  const infoDone = infos.every((r) => r.isOptional || filledIn(r));
  const docsDone = docs.every((r) => r.isOptional || files[r.id]);

  function pick(requirementId: string) {
    setPickFor(requirementId);
    picker.current?.click();
  }

  async function submit() {
    if (!signedIn) {
      void navigate({ to: "/welcome" });
      return;
    }
    setSubmitting(true);
    try {
      const { id } = await start({ data: { type: def.key } });
      const items = [];
      for (const r of def.requirements) {
        if (r.privateField) continue;
        if (r.kind === "info") {
          const text = (values[r.id] ?? "").trim();
          if (text) {
            items.push({
              requirementId: r.id,
              kind: r.kind,
              filePath: null,
              fileName: null,
              infoText: text,
            });
          }
          continue;
        }
        const attached = files[r.id];
        // A file picked now is uploaded; one already in the draft keeps its stored path.
        const path = attached?.file
          ? await uploadVerificationDocument(id, r.slug, attached.file)
          : attached?.path;
        if (!attached || !path) continue;
        items.push({
          requirementId: r.id,
          kind: r.kind,
          filePath: path,
          fileName: attached.name,
          infoText: null,
        });
      }
      const phoneRequirement = def.requirements.find((r) => r.privateField === "phone");
      const phone = phoneRequirement ? indianPhone(values[phoneRequirement.id] ?? "") : null;
      await submitRequest({ data: { requestId: id, items, phone } });
      haptic("confirm");
      await onSubmitted();
      void go(4);
    } catch (err) {
      haptic("error");
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const label = verificationSteps[step] ?? verificationSteps[0]!;

  return (
    <Screen>
      <TopBar
        title={def.title}
        subtitle={`Step ${step + 1} of ${verificationSteps.length} · ${label}`}
        back="/verification/choose"
      />
      <input
        ref={picker}
        type="file"
        accept={VERIFICATION_DOCUMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !pickFor) return;
          const problem = documentProblem(file);
          if (problem) {
            haptic("error");
            toast.error(problem);
            return;
          }
          setFiles((f) => ({ ...f, [pickFor]: { name: file.name, file } }));
        }}
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
                  <Card key={r.id} className="py-3">
                    <p className="text-[13px] font-semibold break-words">{r.label}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{r.why}</p>
                  </Card>
                ))}
              </div>
            </section>
            <Card className="flex gap-3 py-3">
              <Lock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <p className="text-[12px] text-muted-foreground">
                Review time: {def.turnaround.toLowerCase()}.
              </p>
            </Card>
            <Btn
              className="w-full"
              onClick={() => {
                if (!signedIn) {
                  void navigate({ to: "/welcome" });
                  return;
                }
                void go(1);
              }}
            >
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
                <label key={r.id} className="block">
                  <span className="text-[13px] font-semibold">{r.label}</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">{r.why}</span>
                  {r.privateField === "phone" ? (
                    <span className="mt-2 flex h-12 w-full items-center gap-2 rounded-[16px] border border-border bg-card px-4 focus-within:border-primary">
                      <span className="text-sm text-muted-foreground">+91</span>
                      <input
                        value={values[r.id] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [r.id]: e.target.value }))}
                        maxLength={16}
                        inputMode="tel"
                        autoComplete="tel-national"
                        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                        placeholder="Type here"
                      />
                    </span>
                  ) : (
                    <input
                      value={values[r.id] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [r.id]: e.target.value }))}
                      maxLength={140}
                      className="mt-2 h-12 w-full rounded-[16px] border border-border bg-card px-4 text-sm outline-none focus:border-primary"
                      placeholder="Type here"
                    />
                  )}
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
              const file = files[r.id]?.name;
              return (
                <Card key={r.id} className="space-y-2 py-3">
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
                          onClick={() => pick(r.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold"
                        >
                          <RefreshCw size={13} aria-hidden /> Replace
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((f) => {
                              const next = { ...f };
                              delete next[r.id];
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
                      onClick={() => pick(r.id)}
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
                  <div key={r.id} className="text-[13px]">
                    <p className="text-[12px] text-muted-foreground break-words">{r.label}</p>
                    <p className="break-words text-muted-foreground">
                      {r.privateField === "phone"
                        ? (indianPhone(values[r.id] ?? "") ?? "—")
                        : values[r.id] || "—"}
                    </p>
                  </div>
                ))}
              </Card>
            ) : null}
            <Card className="space-y-2 py-3">
              <h3 className="text-[14px]">Documents</h3>
              {docs.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 text-[13px] text-muted-foreground"
                >
                  <Check size={14} className="shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 break-words">{files[r.id]?.name ?? "Missing"}</span>
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
                loading={submitting}
                onClick={() => {
                  if (consent) void submit();
                }}
              >
                Submit for Review
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
            <BtnLink to="/verification" className="w-full">
              Back to Verification
            </BtnLink>
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
