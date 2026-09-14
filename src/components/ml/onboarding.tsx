// FLOW-02 — Onboarding UI kit. Extends Gestalt; no new tokens.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  WifiOff,
  MapPin,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Btn, Sheet } from "@/components/ml/ui";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, saveMyProfile } from "@/lib/portfolio.functions";
import { haptic } from "@/lib/haptics";
import { deleteProfileImage, PROFILE_IMAGE_ACCEPT, uploadProfileImage } from "@/lib/profile-images";
import { draftToProfile, profileToDraft } from "@/lib/profile-map";
import { emptyDraft, visibleSteps, type OnboardingDraft } from "@/data/onboarding";
import {
  loadPersonaBucket,
  type LoadState,
  type PersonaBucket,
  type TaxonomyOption,
} from "@/lib/taxonomy";

/* ------------------------------------------------------------------ */
/* Draft store — the account is the source of truth                    */
/* ------------------------------------------------------------------ */

/*
 * Answers are saved to the signed-in account (profiles.onboarding_draft in the Lovable Cloud
 * database) as the user goes. Onboarding is account-only: a signed-out visitor is sent to Welcome.
 * A per-account copy in this browser is a cache for a failed or offline save and is never read for
 * another account, so a shared device cannot carry one person's answers into the next sign-up.
 */
const LEGACY_KEY = "ml.onboarding.draft";
const cacheKey = (userId: string) => `ml.onboarding.draft:${userId}`;

export type SyncState = "idle" | "loading" | "saving" | "saved" | "offline" | "error";

type Store = {
  draft: OnboardingDraft;
  set: (patch: Partial<OnboardingDraft>) => void;
  toggle: (field: keyof OnboardingDraft, value: string) => void;
  markComplete: (id: string) => void;
  reset: () => void;
  hydrated: boolean;
  sync: SyncState;
  retry: () => void;
  /** Instruments and genres for the draft's roles and languages (persona_bucket). */
  bucket: PersonaBucket | null;
  bucketState: LoadState;
  retryBucket: () => void;
};

const Ctx = createContext<Store | null>(null);

function readCache(userId: string): OnboardingDraft | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    return raw
      ? ({ ...emptyDraft, ...(JSON.parse(raw) as OnboardingDraft) } as OnboardingDraft)
      : null;
  } catch {
    return null;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [sync, setSync] = useState<SyncState>("loading");
  const { user, signedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const persist = useServerFn(saveMyProfile);
  const timer = useRef<number | null>(null);
  const pending = useRef<OnboardingDraft | null>(null);
  const loadedFor = useRef<string | null>(null);
  const userId = user?.id ?? null;

  const writeCache = useCallback(
    (next: OnboardingDraft) => {
      if (!userId) return;
      try {
        window.localStorage.setItem(cacheKey(userId), JSON.stringify(next));
      } catch {
        /* storage may be unavailable */
      }
    },
    [userId],
  );

  const push = useCallback(
    async (next: OnboardingDraft) => {
      if (!navigator.onLine) {
        setSync("offline");
        return;
      }
      setSync("saving");
      try {
        const step = resumeTarget(next, bucketRef.current);
        await persist({ data: draftToProfile(next, step) });
        setSync("saved");
      } catch {
        setSync("error");
      }
    },
    [persist],
  );

  // Load this account's answers. Signed out: onboarding is not available, go to Welcome.
  useEffect(() => {
    if (authLoading) return;
    try {
      // The old unscoped draft was shared by every account on this browser. It is never read now.
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    if (!signedIn || !userId) {
      void navigate({ to: "/welcome", replace: true });
      return;
    }
    if (loadedFor.current === userId) return;
    loadedFor.current = userId;
    const cached = readCache(userId);
    setSync("loading");
    loadProfile()
      .then((row) => {
        const remote = profileToDraft(row as never) ?? emptyDraft;
        // A cached copy is only ahead when a save failed; whichever is further along wins.
        const next =
          cached && cached.completedSteps.length > remote.completedSteps.length
            ? ({
                ...remote,
                ...prune(cached),
                completedSteps: Array.from(
                  new Set([...remote.completedSteps, ...cached.completedSteps]),
                ),
              } as OnboardingDraft)
            : remote;
        setDraft(next);
        writeCache(next);
        setSync("saved");
      })
      .catch(() => {
        if (cached) setDraft(cached);
        setSync(navigator.onLine ? "error" : "offline");
      })
      .finally(() => setHydrated(true));
  }, [authLoading, signedIn, userId, navigate, loadProfile, writeCache]);

  // Refetch the persona bucket whenever the roles or languages change.
  const [bucket, setBucket] = useState<PersonaBucket | null>(null);
  const [bucketState, setBucketState] = useState<LoadState>("loading");
  const [bucketAttempt, setBucketAttempt] = useState(0);
  const bucketRef = useRef<PersonaBucket | null>(null);
  const bucketKey = [
    draft.primaryRole ?? "",
    draft.secondaryRoles.join(","),
    draft.languages.join(","),
  ].join("|");
  useEffect(() => {
    if (!hydrated) return;
    // A stale bucket from the previous roles would hide or show the wrong steps; clear it first.
    bucketRef.current = null;
    setBucket(null);
    const primary = draft.primaryRole;
    if (!primary) {
      bucketRef.current = null;
      setBucket(null);
      setBucketState("ready");
      return;
    }
    let active = true;
    setBucketState("loading");
    loadPersonaBucket(primary, draft.secondaryRoles, draft.languages)
      .then((b) => {
        if (!active) return;
        bucketRef.current = b;
        setBucket(b);
        setBucketState("ready");
      })
      .catch(() => active && setBucketState("error"));
    return () => {
      active = false;
    };
    // bucketKey stands in for the three draft fields it is built from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, bucketKey, bucketAttempt]);

  const persistDraft = useCallback(
    (next: OnboardingDraft) => {
      setDraft(next);
      writeCache(next);
      pending.current = next;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const payload = pending.current;
        pending.current = null;
        if (payload) void push(payload);
      }, 700);
    },
    [push, writeCache],
  );

  const value = useMemo<Store>(
    () => ({
      draft,
      hydrated,
      sync,
      retry: () => void push(draft),
      bucket,
      bucketState,
      retryBucket: () => setBucketAttempt((n) => n + 1),
      set: (patch) => persistDraft({ ...draft, ...patch }),
      toggle: (field, val) => {
        const list = (draft[field] as unknown as string[]) ?? [];
        const next = list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
        persistDraft({ ...draft, [field]: next } as OnboardingDraft);
      },
      markComplete: (id) =>
        persistDraft({
          ...draft,
          completedSteps: draft.completedSteps.includes(id)
            ? draft.completedSteps
            : [...draft.completedSteps, id],
        }),
      reset: () => persistDraft(emptyDraft),
    }),
    [draft, hydrated, sync, persistDraft, push, bucket, bucketState],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Drop empty values so a merge never blanks out the other copy. */
function prune(d: OnboardingDraft): Partial<OnboardingDraft> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (!Array.isArray(v) && typeof v === "object" && Object.keys(v as object).length === 0)
      continue;
    out[k] = v;
  }
  return out as Partial<OnboardingDraft>;
}

export function useOnboarding(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}

export function resumeTarget(draft: OnboardingDraft, bucket: PersonaBucket | null = null): string {
  const list = visibleSteps(draft, bucket);
  const next = list.find((s) => !draft.completedSteps.includes(s.id));
  return next ? next.id : "visibility";
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export function StepShell({
  step,
  total,
  group,
  title,
  subtitle,
  why,
  onBack,
  onSkip,
  children,
  footer,
  banner,
  onSubmit,
  optional = false,
}: {
  step: number;
  total: number;
  group: string;
  title: string;
  subtitle: string;
  why: string;
  onBack?: () => void;
  onSkip?: () => void;
  children: ReactNode;
  footer: ReactNode;
  banner?: ReactNode;
  /** Continue, from the footer button or the keyboard's Next/Go key. */
  onSubmit?: () => void;
  /** Optional steps say so beside the question, so nobody abandons a step they could skip. */
  optional?: boolean;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col bg-background"
    >
      <header className="vt-flow-header sticky top-0 z-30 border-b border-border bg-background/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="hit-area state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-transform duration-200 ease-standard active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <span className="h-10 w-10" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-1 font-bold uppercase tracking-wide text-muted-foreground">
              {group} · Step {step} of {total}
            </p>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-subtle"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Onboarding progress"
            >
              <div
                className="vt-flow-progress h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="hit-area shrink-0 text-1 font-semibold text-muted-foreground"
            >
              Skip
            </button>
          ) : (
            <span className="w-8" />
          )}
        </div>
      </header>

      <main className="flex-1 px-5 pb-40 pt-5">
        {banner}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3 leading-tight">{title}</h1>
          {optional ? (
            <span className="mt-1.5 shrink-0 rounded-full bg-card px-2.5 py-1 text-1 font-semibold text-muted-foreground">
              Optional
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        <p className="mt-3 rounded-lg px-4 py-3 text-1 leading-relaxed text-muted-foreground bg-subtle">
          {why}
        </p>
        <div className="mt-6">{children}</div>
      </main>

      <div className="vt-flow-footer fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {footer}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Pickers                                                             */
/* ------------------------------------------------------------------ */

export type PickerOption = string | { value: string; label: string };

export function ChipPicker({
  options,
  selected,
  onToggle,
  columns = false,
  max,
}: {
  options: PickerOption[];
  selected: string[];
  onToggle: (v: string) => void;
  columns?: boolean;
  /** When this many are selected, unselected chips are disabled. */
  max?: number;
}) {
  const full = max !== undefined && selected.length >= max;
  return (
    <div className={columns ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
      {options.map((opt) => {
        const o = typeof opt === "string" ? opt : opt.value;
        const text = typeof opt === "string" ? opt : opt.label;
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            disabled={full && !on}
            onClick={() => {
              haptic("select");
              onToggle(o);
            }}
            className={`state-layer flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-[transform,background-color,border-color,color] duration-200 ease-standard active:scale-97 ${
              on
                ? "border-transparent bg-selected-bg text-selected-text"
                : "border-border bg-card text-foreground"
            }`}
          >
            {on ? <Check size={14} className="animate-pop" aria-hidden /> : null}
            {text}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Person types come from the taxonomy, grouped (vocal, instrumentalist, …). Pick a group, then a
 * type, so no screen shows more than 12 choices. The group opens on the one holding the selection.
 */
export function PersonTypePicker({
  groups,
  options,
  selected,
  onToggle,
  multi = false,
  max,
  exclude = [],
  icon,
}: {
  groups: readonly { key: string; label: string }[];
  options: TaxonomyOption[];
  selected: string[];
  onToggle: (slug: string) => void;
  multi?: boolean;
  max?: number;
  exclude?: string[];
  icon?: (o: TaxonomyOption) => ReactNode;
}) {
  const shown = options.filter((o) => !exclude.includes(o.slug));
  const available = groups.filter((g) => shown.some((o) => o.metadata?.group === g.key));
  const initial =
    shown.find((o) => selected.includes(o.slug))?.metadata?.group ?? available[0]?.key ?? "";
  const [group, setGroup] = useState(initial);
  const inGroup = shown.filter((o) => o.metadata?.group === group);
  return (
    <div>
      <div className="rail -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar" role="tablist">
        {available.map((g) => {
          const on = g.key === group;
          const count = shown.filter(
            (o) => o.metadata?.group === g.key && selected.includes(o.slug),
          ).length;
          return (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                haptic("select");
                setGroup(g.key);
              }}
              className={`state-layer flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-[transform,background-color,border-color,color] duration-200 ease-standard active:scale-97 ${
                on
                  ? "border-transparent bg-selected-bg text-selected-text"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {g.label}
              {count ? <span className="text-1 tabular-nums opacity-70">{count}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-4" role="tabpanel">
        {multi ? (
          <ChipPicker
            options={inGroup.map((o) => ({ value: o.slug, label: o.label }))}
            selected={selected}
            onToggle={onToggle}
            {...(max !== undefined ? { max } : {})}
          />
        ) : (
          <ChoiceGrid
            options={inGroup.map((o) => ({
              key: o.slug,
              label: o.label,
              hint: "",
              icon: icon?.(o),
            }))}
            value={selected[0] ?? null}
            onSelect={onToggle}
          />
        )}
      </div>
    </div>
  );
}

export function ChoiceGrid({
  options,
  value,
  onSelect,
}: {
  options: { key: string; label: string; hint: string; icon?: ReactNode }[];
  value: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => {
              haptic("select");
              onSelect(o.key);
            }}
            className={`state-layer flex min-h-[104px] flex-col items-start justify-between rounded-lg border p-4 text-left transition-[transform,background-color,border-color,color] duration-200 ease-standard active:scale-97 ${
              on ? "border-primary bg-card ring-1 ring-primary" : "border-border bg-card"
            }`}
          >
            <span className={on ? "text-foreground" : "text-muted-foreground"}>{o.icon}</span>
            <span>
              <span className="block text-sm font-semibold">{o.label}</span>
              {o.hint ? (
                <span className="mt-0.5 block text-1 leading-snug text-muted-foreground">
                  {o.hint}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function OptionList({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: { key: string; label: string; hint: string }[];
  selected: string[];
  onToggle: (key: string) => void;
  multi?: boolean;
}) {
  return (
    <ul className="space-y-2.5">
      {options.map((o) => {
        const on = selected.includes(o.key);
        return (
          <li key={o.key}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => {
                haptic("select");
                onToggle(o.key);
              }}
              className={`state-layer flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-[transform,background-color,border-color,color] duration-200 ease-standard active:scale-97 ${
                on ? "border-primary" : "border-border"
              } bg-card`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                  multi ? "rounded-lg" : "rounded-full"
                } ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
              >
                {on ? (
                  <Check size={12} strokeWidth={3} className="animate-pop" aria-hidden />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="mt-0.5 block text-1 leading-snug text-muted-foreground">
                  {o.hint}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function InlineField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  ok,
  prefix,
  multiline = false,
  maxLength,
  inputId,
  autoComplete,
  inputMode,
  enterKeyHint = "next",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  error?: string;
  ok?: string;
  prefix?: string;
  multiline?: boolean;
  maxLength?: number;
  inputId: string;
  autoComplete?: string;
  inputMode?: "text" | "url" | "email";
  /** The label on the Android keyboard's action key. Next submits the step. */
  enterKeyHint?: "next" | "done" | "go";
}) {
  const shared = "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground";
  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-1 font-bold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={`flex min-h-14 items-center gap-1 rounded-lg border px-4 py-3 ${
          error ? "border-destructive" : "border-border"
        } bg-card`}
      >
        {prefix ? <span className="text-sm text-muted-foreground">{prefix}</span> : null}
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            rows={4}
            maxLength={maxLength}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${shared} resize-none`}
          />
        ) : (
          <input
            id={inputId}
            value={value}
            maxLength={maxLength}
            autoComplete={autoComplete}
            inputMode={inputMode}
            enterKeyHint={enterKeyHint}
            onKeyDown={(e) => {
              // Some Android keyboards do not trigger implicit form submission; do it once here.
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }}
            autoCapitalize={inputMode === "url" ? "none" : undefined}
            spellCheck={inputMode === "url" ? false : undefined}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={shared}
          />
        )}
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p
          className={`text-1 ${error ? "text-destructive" : ok ? "text-success" : "text-muted-foreground"}`}
        >
          {error ?? ok ?? hint ?? ""}
        </p>
        {maxLength ? (
          <p className="shrink-0 text-1 tabular-nums text-muted-foreground">
            {value.length}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PhotoPicker({
  photo,
  onChange,
  label = "Profile photo",
}: {
  photo: string | null;
  onChange: (v: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  // Uploads to the avatars bucket under the signed-in user's folder; the draft stores the public URL.
  const upload = async (file: File | undefined) => {
    setOpen(false);
    if (!file) return;
    setError(null);
    setUploading(true);
    const previous = photo;
    try {
      const url = await uploadProfileImage("avatar", file);
      onChange(url);
      haptic("confirm");
      void deleteProfileImage("avatar", previous);
    } catch (err) {
      haptic("error");
      setError(err instanceof Error ? err.message : "The photo did not upload. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const fileInput = (ref: typeof camera, capture: boolean) => (
    <input
      ref={ref}
      type="file"
      accept={PROFILE_IMAGE_ACCEPT}
      {...(capture ? { capture: "user" as const } : {})}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(e) => {
        void upload(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  return (
    <div>
      {fileInput(camera, true)}
      {fileInput(gallery, false)}
      <div className="flex items-center gap-4">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-subtle"
          aria-live="polite"
        >
          {uploading ? (
            <span className="text-1 font-semibold text-muted-foreground">Uploading…</span>
          ) : photo ? (
            <img src={photo} alt={`${label} preview`} className="h-full w-full object-cover" />
          ) : (
            <Camera size={22} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Btn
            variant="outline"
            className="w-full"
            disabled={uploading}
            onClick={() => setOpen(true)}
          >
            {photo ? "Replace photo" : "Add photo"}
          </Btn>
          {photo && !uploading ? (
            <button
              type="button"
              onClick={() => {
                const previous = photo;
                onChange(null);
                void deleteProfileImage("avatar", previous);
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 text-1 font-semibold text-muted-foreground"
            >
              <Trash2 size={14} /> Remove
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-1 text-destructive">
          {error}
        </p>
      ) : null}

      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <ul className="space-y-2">
          {[
            { icon: <Camera size={18} />, label: "Take photo", input: camera },
            { icon: <ImageIcon size={18} />, label: "Choose from gallery", input: gallery },
          ].map((o) => (
            <li key={o.label}>
              <button
                type="button"
                onClick={() => o.input.current?.click()}
                className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 text-sm font-semibold"
              >
                {o.icon}
                {o.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-1 text-muted-foreground">JPEG, PNG or WebP, up to 5 MB.</p>
      </Sheet>
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  selectId,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
  selectId: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={selectId}
        className="mb-1.5 block text-1 font-bold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-14 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function OfflineBanner() {
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-card p-4"
    >
      <WifiOff size={16} className="mt-0.5 shrink-0 text-warn" />
      <p className="text-1 leading-relaxed text-muted-foreground">
        You're offline. Your answers are kept on this device and will sync when you're back online —
        nothing has been saved to your profile yet.
      </p>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-card p-4">
      <p className="text-sm font-semibold text-destructive">We couldn't save that</p>
      <p className="mt-1 text-1 text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 text-1 font-bold text-foreground"
      >
        Try again
      </button>
    </div>
  );
}

export function SavingBanner({ label = "Saving your answers…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-1 text-muted-foreground">{label}</p>
    </div>
  );
}

/** Renders the real sync state of the draft (local, saving, offline, error). */
export function SyncBanner({ state, onRetry }: { state: SyncState; onRetry: () => void }) {
  if (state === "saving" || state === "loading") {
    return (
      <SavingBanner
        label={state === "loading" ? "Loading your saved answers…" : "Saving to your account…"}
      />
    );
  }
  if (state === "offline") return <OfflineBanner />;
  if (state === "error") {
    return (
      <ErrorBanner
        message="Your answers are safe on this device. We'll try again, or you can retry now."
        onRetry={onRetry}
      />
    );
  }
  return null;
}

export function StepSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-md bg-subtle" />
      ))}
    </div>
  );
}

export function LocationHint() {
  return (
    <p className="mt-3 flex items-start gap-2 text-1 text-muted-foreground">
      <MapPin size={14} className="mt-0.5 shrink-0" />
      City level is all we publish. Your exact address is never shown.
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Readiness + hand-offs                                               */
/* ------------------------------------------------------------------ */

export function ReadinessCard({
  label,
  hint,
  done,
  action,
}: {
  label: string;
  hint: string;
  done: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          done
            ? "bg-success text-background"
            : "border border-border bg-subtle text-muted-foreground"
        }`}
        aria-hidden
      >
        {done ? <Check size={13} strokeWidth={3} /> : <span className="text-1 font-bold">·</span>}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {label}{" "}
          <span className="text-1 font-bold uppercase tracking-wide text-muted-foreground">
            {done ? "Done" : "To do"}
          </span>
        </p>
        <p className="mt-0.5 text-1 text-muted-foreground">{hint}</p>
        {!done && action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function HandoffCard({
  title,
  body,
  action,
  onLater,
}: {
  title: string;
  body: string;
  action: ReactNode;
  onLater?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-2">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1">{action}</div>
        {onLater ? (
          <button
            type="button"
            onClick={onLater}
            className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold"
          >
            Later
          </button>
        ) : null}
      </div>
    </div>
  );
}
