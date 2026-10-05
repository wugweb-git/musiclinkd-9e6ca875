import { OfflineBanner } from "./kit";
import { SheetSelect } from "./listing-form";
// FLOW-02 — Onboarding UI kit. Extends Gestalt; no new tokens.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  Image as ImageIcon,
  Trash2,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Btn, Chip, IconBtn, Sheet } from "@/components/ml/ui";
import { AuthNotice, AuthTextButton } from "@/components/ml/auth";
import { useAuth } from "@/hooks/use-auth";
import {
  claimMyUsername,
  getMyProfile,
  saveMyProfile,
  type UsernameClaim,
} from "@/lib/portfolio.functions";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  GENDERS,
  getMyPrivateDetails,
  readDeviceContext,
  saveMyPrivateDetails,
} from "@/lib/profile-private.functions";
import { deleteProfileImage, PROFILE_IMAGE_ACCEPT, uploadProfileImage } from "@/lib/profile-images";
import { draftToProfile, profileToDraft } from "@/lib/profile-map";
import {
  emptyDraft,
  validateUsername,
  visibleSteps,
  type OnboardingDraft,
} from "@/data/onboarding";
import type { UsernameStatus } from "@/lib/username";
import {
  choicesFor,
  loadPersonaBucket,
  useTaxonomy,
  type LoadState,
  type PersonaBucket,
  type TaxonomyOption,
} from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";
import { PUBLIC_HOST } from "@/lib/site";
import { sized } from "@/lib/image-url";

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

const PREVIEW_FLAG = "ml.onboarding.preview";
const PREVIEW_DRAFT = "ml.onboarding.preview.draft";

function readDevPreview(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  try {
    const param = new URLSearchParams(window.location.search).get("preview");
    if (param === "off") {
      window.sessionStorage.removeItem(PREVIEW_FLAG);
      window.sessionStorage.removeItem(PREVIEW_DRAFT);
      return false;
    }
    if (param !== null) window.sessionStorage.setItem(PREVIEW_FLAG, "1");
    return window.sessionStorage.getItem(PREVIEW_FLAG) === "1";
  } catch {
    return false;
  }
}

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
  /** The username stored on the profile. Once set it cannot change. Null until claimed. */
  claimedUsername: string | null;
  /** Claim draft.username for this account. In dev preview it always succeeds and nothing is stored. */
  claimUsername: () => Promise<UsernameClaim>;
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
  /*
   * The draft as it is right now, for a patch that arrives later than the render it was written in.
   * A PIN lookup answers a second or two after the digits are typed, and the edge location guess
   * answers whenever it answers; merging either into the draft captured at that render puts the
   * fields typed in between back to what they were. Every patch below reads this instead.
   */
  const latest = useRef(draft);
  latest.current = draft;
  const [hydrated, setHydrated] = useState(false);
  const [sync, setSync] = useState<SyncState>("loading");
  const { user, signedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const persist = useServerFn(saveMyProfile);
  const claim = useServerFn(claimMyUsername);
  const [claimedUsername, setClaimedUsername] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const pending = useRef<OnboardingDraft | null>(null);
  const loadedFor = useRef<string | null>(null);
  const userId = user?.id ?? null;
  // Development only: `?preview` walks onboarding without an account, for design review. It lasts
  // for the tab (`?preview=off` ends it); answers live in sessionStorage and nothing reaches the
  // database. Production builds drop it.
  const devPreview = readDevPreview();

  const writeCache = useCallback(
    (next: OnboardingDraft) => {
      if (devPreview) {
        try {
          window.sessionStorage.setItem(PREVIEW_DRAFT, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return;
      }
      if (!userId) return;
      try {
        window.localStorage.setItem(cacheKey(userId), JSON.stringify(next));
      } catch {
        /* storage may be unavailable */
      }
    },
    [userId, devPreview],
  );

  const push = useCallback(
    async (next: OnboardingDraft) => {
      if (devPreview) return;
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
    [persist, devPreview],
  );

  // Load this account's answers. Signed out: onboarding is not available, go to Welcome.
  useEffect(() => {
    if (devPreview) {
      try {
        const raw = window.sessionStorage.getItem(PREVIEW_DRAFT);
        if (raw) setDraft({ ...emptyDraft, ...(JSON.parse(raw) as OnboardingDraft) });
      } catch {
        /* ignore */
      }
      setHydrated(true);
      setSync("idle");
      return;
    }
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
        const stored = (row as { username?: string | null } | null)?.username ?? null;
        setClaimedUsername(stored);
        const draftFromRow = profileToDraft(row as never) ?? emptyDraft;
        // A claimed username is fixed; an unclaimed one typed earlier stays in the draft.
        const remote = stored ? { ...draftFromRow, username: stored } : draftFromRow;
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
        const merged = stored ? { ...next, username: stored } : next;
        setDraft(merged);
        writeCache(merged);
        setSync("saved");
      })
      .catch(() => {
        if (cached) setDraft(cached);
        setSync(navigator.onLine ? "error" : "offline");
      })
      .finally(() => setHydrated(true));
  }, [authLoading, signedIn, userId, navigate, loadProfile, writeCache, devPreview]);

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
      set: (patch) => persistDraft({ ...latest.current, ...patch }),
      toggle: (field, val) => {
        const list = (latest.current[field] as unknown as string[]) ?? [];
        const next = list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
        persistDraft({ ...latest.current, [field]: next } as OnboardingDraft);
      },
      markComplete: (id) =>
        persistDraft({
          ...latest.current,
          completedSteps: latest.current.completedSteps.includes(id)
            ? latest.current.completedSteps
            : [...latest.current.completedSteps, id],
        }),
      reset: () => persistDraft({ ...emptyDraft, username: claimedUsername ?? "" }),
      claimedUsername,
      claimUsername: async () => {
        if (devPreview || claimedUsername === draft.username) return "claimed";
        const { status } = await claim({ data: { username: draft.username } });
        if (status === "claimed") setClaimedUsername(draft.username);
        return status;
      },
    }),
    [
      draft,
      hydrated,
      sync,
      persistDraft,
      push,
      bucket,
      bucketState,
      claimedUsername,
      claim,
      devPreview,
    ],
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

// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its component
export function useOnboarding(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function resumeTarget(draft: OnboardingDraft, bucket: PersonaBucket | null = null): string {
  const list = visibleSteps(draft, bucket);
  const next = list.find((s) => !draft.completedSteps.includes(s.id));
  return next ? next.id : "contact";
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

/** True once the page has scrolled past its top. */
/** Whether an element has scrolled up under the sticky top bar (about 72px tall). */
function useTucked(ref: RefObject<HTMLElement | null>) {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) setTucked(!entry.isIntersecting && entry.boundingClientRect.top < 72);
      },
      { rootMargin: "-72px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return tucked;
}

/** Whether content sits under the top bar, and whether more of it waits under the bottom bar. */
// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its component
export function useScrollEdges() {
  const [edges, setEdges] = useState({ top: false, bottom: false });
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const top = window.scrollY > 4;
      const bottom = window.scrollY + window.innerHeight < el.scrollHeight - 4;
      setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return edges;
}

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
  status,
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
  /** Quiet save state for the header ("Saving…", "Saved"); never a banner that moves the page. */
  status?: ReactNode;
}) {
  const pct = Math.round((step / total) * 100);
  const edges = useScrollEdges();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleTucked = useTucked(titleRef);

  // Mobile touch swipe gestures (left = next, right = back)
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && e.touches[0]) {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || !e.changedTouches[0]) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const duration = Date.now() - touchStart.current.time;
    touchStart.current = null;

    // Fast horizontal flick (less than 450ms, at least 60px horizontal, dominant over vertical)
    if (duration < 450 && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0 && onSubmit) {
        haptic("select");
        onSubmit();
      } else if (deltaX > 0 && onBack) {
        haptic("select");
        onBack();
      }
    }
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col bg-background"
    >
      {/* Modern top app bar: frosted glass with segmented story-style progress track */}
      <header
        className={`vt-flow-header pt-safe sticky top-0 z-bar border-b bg-background/90 px-5 pb-3.5 backdrop-blur-md transition-colors duration-200 ease-standard ${
          edges.top ? "border-border shadow-2xs" : "border-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          {onBack ? (
            <IconBtn
              label="Back"
              variant="plain"
              className="-ml-2 hover:bg-subtle active:scale-90"
              onClick={onBack}
            >
              <ArrowLeft size={iconSize.md} aria-hidden />
            </IconBtn>
          ) : (
            <span className="h-10 w-8" />
          )}
          <div className="min-w-0 flex-1">
            {/* Step & Group header label */}
            <div className="flex h-5 items-center justify-between gap-2 text-1 text-muted-foreground">
              <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
                <p
                  className={`absolute inset-0 flex items-center truncate transition-[transform,opacity] duration-200 ease-standard ${
                    titleTucked ? "-translate-y-full opacity-0" : ""
                  }`}
                >
                  <span className="font-semibold text-foreground">{group}</span>
                  <span className="mx-1.5 opacity-50">·</span>
                  <span>
                    Step {step} of {total}
                  </span>
                </p>
                <p
                  aria-hidden
                  className={`absolute inset-0 flex items-center truncate text-sm font-bold text-foreground transition-[transform,opacity] duration-200 ease-standard ${
                    titleTucked ? "" : "translate-y-full opacity-0"
                  }`}
                >
                  <span className="truncate">{title}</span>
                </p>
              </div>
              {status}
            </div>

            {/* Segmented story-style progress track (Tinder / Snapchat / Instagram story UX) */}
            <div
              className="mt-2 flex w-full gap-1"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Onboarding progress"
            >
              {Array.from({ length: total }, (_, i) => {
                const filled = i < step;
                const current = i === step - 1;
                return (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300 ease-standard",
                      filled ? "bg-foreground" : "bg-border/60",
                      current && "ring-1 ring-foreground/20",
                    )}
                  />
                );
              })}
            </div>
          </div>
          {/* Same width with or without Skip, so the progress bar never changes length between steps. */}
          <span className="flex w-10 shrink-0 justify-end">
            {onSkip ? (
              <AuthTextButton
                onClick={onSkip}
                className="text-1 font-semibold text-muted-foreground hover:text-foreground"
              >
                Skip
              </AuthTextButton>
            ) : null}
          </span>
        </div>
      </header>

      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 px-5 pb-40 pt-5"
      >
        {banner}
        <div className="flex items-start justify-between gap-3">
          <h1 ref={titleRef} className="text-3 font-bold text-foreground leading-tight">
            {title}
          </h1>
          {optional ? (
            <span className="mt-1 shrink-0 rounded-full bg-subtle px-2.5 py-1 text-1 font-semibold text-muted-foreground border border-border/60">
              Optional
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

        {why ? (
          <div className="mt-2.5 inline-flex items-start gap-1.5 rounded-full bg-subtle/80 px-3 py-1 text-1 text-muted-foreground border border-border/50">
            <Info size={14} className="mt-0.5 shrink-0 text-foreground/60" aria-hidden />
            <span>{why}</span>
          </div>
        ) : null}

        <div className="mt-6">{children}</div>
      </main>

      {/* Frosted floating bottom footer bar */}
      <div
        className={`vt-flow-footer fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-app border-t bg-background/90 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-colors duration-200 ease-standard ${
          edges.bottom ? "border-border shadow-xs" : "border-transparent"
        }`}
      >
        {footer}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Pickers                                                             */
/* ------------------------------------------------------------------ */

export type PickerOption =
  | string
  | {
      value: string;
      label: string;
      /** Icon element or image URL for the chip's circle. */
      media?: ReactNode;
    };

/** Chips from the global `Chip`. Selection is the caller's. */
export function ChipPicker({
  options,
  selected,
  onToggle,
  max,
}: {
  options: PickerOption[];
  selected: string[];
  onToggle: (v: string) => void;
  /** When this many are selected, unselected chips are disabled. */
  max?: number;
}) {
  const full = max !== undefined && selected.length >= max;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const o = typeof opt === "string" ? { value: opt, label: opt } : opt;
        const on = selected.includes(o.value);
        return (
          <Chip
            key={o.value}
            active={on}
            media={o.media}
            atLimit={full && !on}
            onClick={() => {
              haptic("select");
              onToggle(o.value);
            }}
          >
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}

/** Person types from the taxonomy as one list of chips, ordered by group (vocal, instrumentalist, …). */
export function PersonTypePicker({
  groups,
  options,
  selected,
  onToggle,
  max,
  exclude = [],
  icon,
}: {
  groups: readonly { key: string; label: string }[];
  options: TaxonomyOption[];
  selected: string[];
  onToggle: (slug: string) => void;
  max?: number;
  exclude?: string[];
  icon?: (o: TaxonomyOption) => ReactNode;
}) {
  return (
    <ChipPicker
      options={groups
        .flatMap((g) => options.filter((o) => (o.metadata?.group ?? "other") === g.key))
        .filter((o) => !exclude.includes(o.slug))
        .map((o) => ({ value: o.slug, label: o.label, media: icon?.(o) }))}
      selected={selected}
      onToggle={onToggle}
      {...(max !== undefined ? { max } : {})}
    />
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
              className={`state-layer flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-[transform,background-color,border-color,color] duration-200 ease-standard active:scale-97 ${
                on ? "border-foreground" : "border-transparent"
              } bg-subtle`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                  multi ? "rounded-lg" : "rounded-full"
                } ${on ? "border-ink bg-ink text-ink-foreground" : "border-border"}`}
              >
                {on ? <Check size={iconSize.xs} className="animate-pop" aria-hidden /> : null}
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
  leading,
  multiline = false,
  maxLength,
  inputId,
  autoComplete,
  inputMode,
  enterKeyHint = "next",
  type = "text",
  max,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Optional: many fields read better with a label alone. */
  placeholder?: string;
  hint?: string;
  error?: string | null;
  ok?: string;
  prefix?: string;
  /** An icon at the start of the box, e.g. a platform's mark. */
  leading?: ReactNode;
  multiline?: boolean;
  maxLength?: number;
  inputId: string;
  autoComplete?: string;
  inputMode?: "text" | "url" | "email" | "numeric" | "decimal" | "tel";
  /** A date field opens the phone's date picker. */
  type?: "text" | "date";
  /** Latest date allowed, for type="date" (YYYY-MM-DD). */
  max?: string;
  /** The label on the Android keyboard's action key. Next submits the step. */
  enterKeyHint?: "next" | "done" | "go";
  /** Shown but not editable, e.g. a username that is already set. */
  readOnly?: boolean;
}) {
  const messageId = `${inputId}-message`;
  const shared =
    "w-full min-w-0 bg-transparent text-2 outline-none placeholder:text-muted-foreground/60 focus-visible:outline-none";
  return (
    <div className="group">
      {/* Same label states as TextField: grey at rest, ink while focused, red when invalid. */}
      <label
        htmlFor={inputId}
        className={cn(
          "mb-1.5 block text-sm font-medium transition-colors duration-125 ease-standard",
          error ? "text-destructive" : "text-muted-foreground group-focus-within:text-foreground",
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          // One input shape for the app (owner, 24 Sep): a pill, the same shape as the pickers it
          // sits beside. A textarea keeps a rounded rectangle — a pill around four lines reads
          // wrong — which is the shape the other multi-line fields already use.
          "flex items-center gap-1 border bg-card shadow-xs transition-all duration-150 ease-standard",
          multiline ? "rounded-lg px-4 py-3" : "h-13 rounded-full px-5",
          readOnly && "bg-background",
          error
            ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : "border-input focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/10 [@media(hover:hover)]:hover:border-muted-foreground/80",
        )}
      >
        {leading ? (
          <span aria-hidden className="mr-1.5 flex shrink-0 text-foreground">
            {leading}
          </span>
        ) : null}
        {prefix ? <span className="shrink-0 text-2 text-muted-foreground">{prefix}</span> : null}
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            rows={4}
            maxLength={maxLength}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={messageId}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(shared, "resize-none leading-relaxed")}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            max={max}
            value={value}
            maxLength={maxLength}
            autoComplete={autoComplete}
            inputMode={inputMode}
            enterKeyHint={enterKeyHint}
            readOnly={readOnly}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={messageId}
            onKeyDown={(e) => {
              // Some Android keyboards do not submit forms on their own. Next moves to the next
              // field (so the step isn't submitted half filled); the last field or Go submits.
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              const form = e.currentTarget.form;
              if (!form) return;
              e.preventDefault();
              if (enterKeyHint === "next") {
                const fields = [
                  ...form.querySelectorAll<HTMLElement>(
                    "main input:not([disabled]):not([readonly]):not([type=file]):not(.sr-only), main select:not([disabled]), main textarea",
                  ),
                ];
                const next = fields[fields.indexOf(e.currentTarget) + 1];
                if (next) {
                  next.focus();
                  return;
                }
              }
              form.requestSubmit();
            }}
            autoCapitalize={inputMode === "url" ? "none" : undefined}
            spellCheck={inputMode === "url" ? false : undefined}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(shared, "h-full")}
          />
        )}
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        {error ? (
          <p
            key="error"
            id={messageId}
            role="alert"
            className="flex animate-message items-start gap-1.5 text-1 text-destructive"
          >
            <CircleAlert size={iconSize.sm} className="mt-px shrink-0" aria-hidden />
            {error}
          </p>
        ) : ok ? (
          <p
            key="ok"
            id={messageId}
            className="flex animate-message items-start gap-1.5 text-1 text-success-strong"
          >
            <CircleCheck size={iconSize.sm} className="mt-px shrink-0" aria-hidden />
            {ok}
          </p>
        ) : (
          <p id={messageId} className="text-1 text-muted-foreground">
            {hint ?? ""}
          </p>
        )}
        {maxLength ? (
          <p className="shrink-0 text-1 tabular-nums text-muted-foreground" aria-hidden>
            {value.length}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The @username field for talent and business alike: lowercase, no spaces, a live availability
 * check (useUsernameAvailability), and read-only once claimed, since usernames never change.
 */
export function UsernameField({
  value,
  onChange,
  status,
  locked = false,
  claimError,
  inputId = "username",
}: {
  value: string;
  onChange: (v: string) => void;
  status: UsernameStatus;
  locked?: boolean;
  claimError?: string | null;
  inputId?: string;
}) {
  const check = validateUsername(value);
  return (
    <InlineField
      inputId={inputId}
      label="Username"
      prefix={`${PUBLIC_HOST}/@`}
      value={value}
      onChange={(v) => onChange(v.toLowerCase().replace(/\s/g, ""))}
      placeholder="yourname"
      maxLength={30}
      autoComplete="username"
      readOnly={locked}
      {...(locked
        ? { hint: "This is your profile link. Usernames can't be changed." }
        : claimError
          ? { error: claimError }
          : !value
            ? { hint: "Your profile link: lowercase letters, numbers, dots and underscores." }
            : !check.ok
              ? { error: check.message }
              : status === "taken"
                ? { error: "That one's taken. Try another." }
                : status === "available"
                  ? { ok: `${check.message} is available` }
                  : status === "checking"
                    ? { hint: "Checking…" }
                    : { hint: check.message })}
    />
  );
}

/**
 * A labelled field that opens a bottom drawer (owner, 22 Sep 2026: every choice list in onboarding
 * is a drawer). The drawer itself is the shared SheetSelect / SheetMultiSelect.
 */
export function DrawerField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground">{label}</p>
      {children}
      {hint ? <p className="mt-1.5 text-1 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A date picked in a bottom drawer: day, month and year columns, then Done. `value` and
 * `onChange` use YYYY-MM-DD ("" when empty). Years run from `maxYear` back to 1920.
 */
export function DateDrawerField({
  title,
  value,
  onChange,
  placeholder = "Choose",
  maxYear = new Date().getFullYear(),
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const [y0 = "", m0 = "", d0 = ""] = value ? value.split("-") : [];
  const [year, setYear] = useState(y0);
  const [month, setMonth] = useState(m0);
  const [day, setDay] = useState(d0);
  const years = Array.from({ length: maxYear - 1919 }, (_, i) => String(maxYear - i));
  const daysIn = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = Array.from({ length: daysIn }, (_, i) => String(i + 1).padStart(2, "0"));
  const shown = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder;

  function openDrawer() {
    setYear(y0);
    setMonth(m0);
    setDay(d0);
    setOpen(true);
  }

  const column = (
    label: string,
    items: { value: string; label: string }[],
    picked: string,
    pick: (v: string) => void,
  ) => (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-1 font-semibold text-muted-foreground">{label}</p>
      <ul className="max-h-[40dvh] space-y-1 overflow-y-auto" role="listbox" aria-label={label}>
        {items.map((it) => {
          const on = it.value === picked;
          return (
            <li key={it.value} role="option" aria-selected={on}>
              <button
                type="button"
                onClick={() => pick(it.value)}
                className={cn(
                  "state-layer min-h-11 w-full rounded-lg text-sm font-semibold",
                  on ? "bg-foreground text-background" : "bg-subtle",
                )}
              >
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={openDrawer}
        className="flex h-13 w-full items-center justify-between gap-2 rounded-full border border-input bg-card px-5 text-left text-sm"
      >
        <span className={cn("truncate", value ? "text-foreground" : "text-muted-foreground")}>
          {shown}
        </span>
        <ChevronDown size={18} className="shrink-0 text-foreground" aria-hidden />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="flex gap-2">
          {column(
            "Day",
            days.map((d) => ({ value: d, label: String(Number(d)) })),
            day,
            setDay,
          )}
          {column(
            "Month",
            MONTHS.map((m, i) => ({ value: String(i + 1).padStart(2, "0"), label: m })),
            month,
            setMonth,
          )}
          {column(
            "Year",
            years.map((y) => ({ value: y, label: y })),
            year,
            setYear,
          )}
        </div>
        <div className="mt-4 flex gap-2">
          {value ? (
            <Btn
              variant="outline"
              className="flex-1"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Btn>
          ) : null}
          <Btn
            className="flex-1"
            disabled={!day || !month || !year}
            onClick={() => {
              const d = String(Math.min(Number(day), daysIn)).padStart(2, "0");
              onChange(`${year}-${month}-${d}`);
              setOpen(false);
            }}
          >
            Done
          </Btn>
        </div>
      </Sheet>
    </>
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
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {/* The native select opens Android's own picker, which suits a long list on a phone. */}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-12 w-full appearance-none rounded-sm bg-subtle pl-3.5 pr-10 text-2 outline-none transition-[border-color,box-shadow] duration-125 ease-standard focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:bg-subtle disabled:opacity-60 [@media(hover:hover)]:hover:border-muted-foreground",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={iconSize.md}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <AuthNotice
      tone="error"
      title="That didn't save"
      action={<AuthTextButton onClick={onRetry}>Try Again</AuthTextButton>}
    >
      {message}
    </AuthNotice>
  );
}

export function SavingBanner({ label = "Saving your answers…" }: { label?: string }) {
  return (
    <p role="status" className="mb-4 flex items-center gap-2 text-1 text-muted-foreground">
      <LoaderCircle size={iconSize.sm} className="animate-spin" aria-hidden />
      {label}
    </p>
  );
}

/** Offline and failed saves need attention; saving itself is shown quietly by SyncStatus. */
export function SyncBanner({ state, onRetry }: { state: SyncState; onRetry: () => void }) {
  if (state === "loading") return <SavingBanner label="Loading your saved answers…" />;
  if (state === "offline")
    return (
      <OfflineBanner
        variant="warn"
        body="Your answers are kept on this phone and saved to your account when you're back online."
      />
    );
  if (state === "error") {
    return (
      <ErrorBanner
        message="Your answers are safe on this phone. Try again, or carry on and we'll retry."
        onRetry={onRetry}
      />
    );
  }
  return null;
}

/** Save state for a header: "Saving…" with a spinner, then "Saved" with a check. */
export function SyncStatus({ state }: { state: SyncState }) {
  if (state === "saving") {
    return (
      <span role="status" className="flex shrink-0 items-center gap-1">
        <LoaderCircle size={iconSize.xs} className="animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span role="status" className="flex shrink-0 animate-message items-center gap-1">
        <CircleCheck size={iconSize.xs} aria-hidden />
        Saved
      </span>
    );
  }
  return null;
}

export function StepSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-sm bg-ink/5" />
      ))}
    </div>
  );
}

export function LocationHint() {
  return (
    <p className="mt-3 flex items-start gap-2 text-1 text-muted-foreground">
      <MapPin size={iconSize.sm} className="mt-0.5 shrink-0" />
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
  className,
  style,
}: {
  label: string;
  hint: string;
  done: boolean;
  action?: ReactNode;
  className?: string;
  /** For arrival timing (`beat`). */
  style?: CSSProperties;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg bg-subtle p-4", className)} style={style}>
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          done ? "animate-pop bg-success text-background" : "border-2 border-border"
        }`}
        aria-hidden
      >
        {done ? <Check size={iconSize.xs} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {label}
          <span className="sr-only">{done ? ", done" : ", to do"}</span>
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
    <div className="rounded-lg bg-subtle p-5">
      <h3 className="text-2">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1">{action}</div>
        {onLater ? (
          <AuthTextButton onClick={onLater} className="px-3 text-sm">
            Later
          </AuthTextButton>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- private details */

/**
 * Date of birth and gender. Saved to the owner-only profile_private table as they change, never
 * into the draft, and hidden from everyone else by default. In dev preview (no account) they stay on
 * the screen only. Onboarding asks them; Edit profile → Identity edits them.
 */
export function PrivateDetailsFields() {
  const { signedIn } = useAuth();
  const load = useServerFn(getMyPrivateDetails);
  const save = useServerFn(saveMyPrivateDetails);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const genders = useTaxonomy();
  const loaded = useRef(false);
  const today = new Date().toISOString().slice(0, 10);
  const dobError =
    dob && (dob > today || dob < "1900-01-01") ? "Enter your real date of birth." : undefined;

  useEffect(() => {
    if (!signedIn) return;
    load()
      .then((p) => {
        setDob(p.dateOfBirth ?? "");
        setGender(p.gender);
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, [signedIn, load]);

  useEffect(() => {
    if (!signedIn || !loaded.current || dobError) return;
    const t = window.setTimeout(() => {
      void save({
        data: {
          dateOfBirth: dob || null,
          gender: (gender as (typeof GENDERS)[number]["value"] | null) ?? null,
          // Time zone and device come from the browser, with no permission prompt.
          ...readDeviceContext(),
        },
      }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(t);
  }, [dob, gender, signedIn, save, dobError]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <DrawerField label="Date of birth" hint={dobError ?? "Only you can see this."}>
        <DateDrawerField title="Date of birth" value={dob} onChange={setDob} />
      </DrawerField>
      <DrawerField label="Gender" hint="Only you can see this.">
        <SheetSelect
          title="Gender"
          value={gender}
          options={choicesFor(genders.options?.genders)}
          placeholder="Choose"
          onChange={setGender}
        />
      </DrawerField>
    </div>
  );
}

/*
 * One account-type choice on the Select screen, drawn after the owner's reference (4 Oct 2026): a
 * large card with the name top-left, a loose cluster of role icons top-right and the description
 * along the bottom. Tapping it is the choice and the next step. `hollow` is the outlined variant.
 * The cluster is icons only, never people or counts: nothing on a sign-up screen claims who is here.
 */
export function AccountTypeCard({
  title,
  description,
  icon: Icon,
  cluster,
  onSelect,
  hollow = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Up to four role icons for the top-right cluster. */
  cluster: LucideIcon[];
  /** Absent on an upcoming type: the card is shown, disabled, and says so. */
  onSelect?: (() => void) | undefined;
  hollow?: boolean | undefined;
}) {
  // Fixed spots for the cluster, largest first, so the cards read as one family.
  const spots = [
    "right-4 top-4 h-11 w-11",
    "right-16 top-10 h-9 w-9",
    "right-28 top-3 h-8 w-8",
    "right-8 top-16 h-7 w-7",
  ];
  const Root = onSelect ? "button" : "div";
  return (
    <Root
      {...(onSelect ? { type: "button" as const, onClick: onSelect } : { "aria-disabled": true })}
      className={cn(
        "relative flex min-h-36 w-full flex-col justify-between overflow-hidden rounded-lg p-4 text-left transition-transform duration-150 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onSelect ? "active:scale-98" : "",
        hollow
          ? "border border-dashed border-input bg-transparent"
          : "border border-border bg-card shadow-xs",
      )}
    >
      <span className="text-3 font-bold text-foreground">{title}</span>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/2">
        {cluster.slice(0, spots.length).map((C, i) => (
          <span
            key={i}
            className={cn(
              "absolute flex items-center justify-center rounded-full text-muted-foreground",
              // --subtle is white, the card's own colour: the tiles take the page grey.
              hollow ? "border border-dashed border-input" : "bg-background",
              spots[i],
            )}
          >
            <C size={i === 0 ? iconSize.md : iconSize.sm} />
          </span>
        ))}
      </span>
      <span className="mt-6 flex items-center gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            hollow
              ? "border border-dashed border-input text-muted-foreground"
              : "bg-ink text-ink-foreground",
          )}
        >
          <Icon size={iconSize.md} aria-hidden />
        </span>
        <span className="min-w-0 text-sm font-semibold text-foreground">{description}</span>
      </span>
    </Root>
  );
}
