import { OfflineBanner } from "./kit";
import { SheetSelect } from "./listing-form";
// FLOW-02 — Onboarding UI kit. Extends Gestalt; no new tokens.

import {
  useLayoutEffect,
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
  Plus,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Btn, Chip, IconBtn, Sheet } from "@/components/ml/ui";
import { AuthNotice, AuthTextButton, RequiredMark } from "@/components/ml/auth";
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
import { choicesFor, useTaxonomy, type LoadState, type TaxonomyOption } from "@/lib/taxonomy";
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
  /** Save now, skipping the autosave wait, and resolve when it is stored. */
  flush: () => Promise<void>;
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
        const step = resumeTarget(next);
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
      flush: () => {
        if (timer.current) window.clearTimeout(timer.current);
        pending.current = null;
        return push(latest.current);
      },
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
    [draft, hydrated, sync, persistDraft, push, claimedUsername, claim, devPreview],
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
export function resumeTarget(draft: OnboardingDraft): string {
  const list = visibleSteps(draft);
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
  editing = false,
}: {
  /** Opened from Edit profile (owner, 10 Oct 2026): no step count or progress, just the question. */
  editing?: boolean | undefined;
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
      className="mx-auto flex min-h-[100dvh] w-full max-w-[414px] flex-col bg-warm"
    >
      {/* Modern top app bar: frosted glass with segmented story-style progress track */}
      <header
        className={`vt-flow-header pt-safe sticky top-0 z-bar border-b bg-warm/90 px-5 pb-3.5 backdrop-blur-md transition-colors duration-200 ease-standard ${
          edges.top ? "border-border shadow-2xs" : "border-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          {onBack ? (
            <IconBtn
              label="Back"
              variant="plain"
              className="-ml-2.5 hover:bg-subtle active:scale-90"
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
                  <span className="font-semibold text-foreground">
                    {editing ? "Edit profile" : `Step ${step} of ${total}`}
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
              hidden={editing}
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
          {/* No Skip (owner, 10 Oct 2026): an optional step goes on with Continue, answered or not.
              The slot keeps the progress bar centred against the back arrow. */}
          <span aria-hidden className="w-10 shrink-0" />
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
          {/* No Optional chip, group label or "why" note (owner, 6 Oct 2026): Skip says it's optional. */}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-6">{children}</div>
      </main>

      {/* Frosted floating bottom footer bar */}
      <div
        className={`vt-flow-footer fixed inset-x-0 bottom-0 z-bar mx-auto w-full max-w-[414px] border-t bg-warm/90 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-colors duration-200 ease-standard ${
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

export type PickerLayout = "cloud" | "stack" | "script";

/*
 * Adaptive order for wrapping pills (owner, 6 & 10 Oct 2026): pills move so each row is filled and
 * none is left half empty. The real pill widths are measured, then packed first-fit, widest first,
 * into rows of the container's width; repacked when the width changes.
 */
const PILL_GAP = 8;
function packByWidth(values: string[], widths: Map<string, number>, row: number): string[] {
  const sorted = [...values].sort((x, y) => (widths.get(y) ?? 0) - (widths.get(x) ?? 0));
  const rows: { left: number; items: string[] }[] = [];
  for (const v of sorted) {
    const w = Math.min((widths.get(v) ?? 0) + PILL_GAP, row);
    const fit = rows.find((r) => r.left >= w);
    if (fit) {
      fit.items.push(v);
      fit.left -= w;
    } else rows.push({ left: row - w, items: [v] });
  }
  return rows.flatMap((r) => r.items);
}

function usePackedOrder(values: string[], enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const key = values.join("|");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const pack = () => {
      const widths = new Map<string, number>();
      for (const child of Array.from(el.children) as HTMLElement[]) {
        const v = child.dataset["value"];
        if (v) widths.set(v, child.getBoundingClientRect().width);
      }
      if (widths.size !== values.length) return;
      const next = packByWidth(values, widths, el.clientWidth + PILL_GAP);
      setOrder((cur) => (cur && cur.join("|") === next.join("|") ? cur : next));
    };
    pack();
    const ro = new ResizeObserver(pack);
    ro.observe(el);
    return () => ro.disconnect();
    // `key` stands in for the values list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  const ordered =
    enabled && order && order.length === values.length && order.every((v) => values.includes(v))
      ? order
      : values;
  return { ref, ordered };
}

/*
 * Chips from the global `Chip`, in one of three layouts (owner refs, 6 Oct 2026). Selection is the
 * caller's.
 *   cloud  — centred, wrapping: long lists of short labels (roles, instruments, genres, types).
 *   stack  — one pill per row, centred: short lists where each choice is a statement (intent).
 *   script — big centred words: languages, written in their own script.
 */
export function ChipPicker({
  options,
  selected,
  onToggle,
  max,
  layout = "cloud",
}: {
  options: PickerOption[];
  selected: string[];
  onToggle: (v: string) => void;
  /** When this many are selected, unselected chips are disabled. */
  max?: number;
  layout?: PickerLayout | undefined;
}) {
  const full = max !== undefined && max > 1 && selected.length >= max;
  const items = options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));
  const byValue = new Map(items.map((o) => [o.value, o]));
  const { ref, ordered } = usePackedOrder(
    items.map((o) => o.value),
    layout !== "stack",
  );
  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-2",
        layout === "stack" ? "flex-col items-center" : "flex-wrap justify-center",
      )}
    >
      {ordered.map((value) => {
        const o = byValue.get(value)!;
        const on = selected.includes(o.value);
        return (
          <span key={o.value} data-value={o.value} className="inline-flex">
            <Chip
              variant="select"
              size={layout === "script" ? "lg" : "md"}
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
          </span>
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
  layout = "cloud",
}: {
  groups: readonly { key: string; label: string }[];
  options: TaxonomyOption[];
  selected: string[];
  onToggle: (slug: string) => void;
  max?: number;
  exclude?: string[];
  icon?: (o: TaxonomyOption) => ReactNode;
  layout?: PickerLayout | undefined;
}) {
  return (
    // One list, in group order, no group headings (owner, 6 Oct 2026). "Other" stays last.
    <ChipPicker
      layout={layout}
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
  required = false,
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
  /** Adds a muted " *" after the label (owner, 10 Oct 2026). Never on an "(optional)" label. */
  required?: boolean | undefined;
}) {
  const messageId = `${inputId}-message`;
  const shared =
    "w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/60 focus-visible:outline-none";
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
        {required ? <RequiredMark /> : null}
      </label>
      <div
        className={cn(
          // Phone plan: one field shape — 8px corners, 44px tall, 16px text — for inputs and the
          // pickers beside them. A textarea keeps the same corners and grows. field-focus is the
          // one focus look for text fields (owner, 10 Oct 2026).
          "field-focus flex items-center gap-1 border bg-card transition-all duration-150 ease-standard",
          multiline ? "rounded-sm px-3.5 py-3" : "h-11 rounded-sm px-3.5",
          readOnly && "bg-background",
          error
            ? "border-destructive"
            : "border-input [@media(hover:hover)]:hover:not-focus-within:border-muted-foreground/80",
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
            aria-required={required || undefined}
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
            aria-required={required || undefined}
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
      prefix="@"
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
            ? {
                hint: `Your link: ${PUBLIC_HOST}/@yourname. Lowercase letters, numbers, dots, underscores.`,
              }
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
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  /** Shown under the picker after Continue is pressed without a choice. */
  error?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <p
        className={cn(
          "mb-1.5 block text-sm font-medium",
          error ? "text-destructive" : "text-foreground",
        )}
      >
        {label}
      </p>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-1 text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-1 text-muted-foreground">{hint}</p>
      ) : null}
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
        className="flex h-11 w-full items-center justify-between gap-2 rounded-sm border border-input bg-card px-3.5 text-left text-[16px]"
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
 * One account-type choice on the Select screen, as a banner (owner refs, 5 Oct 2026): a soft
 * grey panel, a quiet meta row, a centred title and line, and a few tilted objects rising from the
 * bottom edge. Tapping it is the choice. `hollow` is the coming-soon banner: dashed, one dashed
 * "+" tile, not tappable. Objects are icons only: nothing on a sign-up screen claims who is here.
 */
export function AccountTypeCard({
  title,
  label,
  tag,
  art,
  photo,
  sticker,
  tone = "light",
  onSelect,
  hollow = false,
}: {
  title: string;
  /** Accessible name for the tap, e.g. "Create my profile". The banner shows only the arrow. */
  label: string;
  /** The frosted label top-left (ml-widgets .ml-glass): an icon and a few words. */
  tag: { text: string };
  /** Up to three branded art pieces (select-art.tsx): back left, front, back right. */
  art?: ReactNode[] | undefined;
  /** Photo behind the banner, under an ink scrim; the title sits on it in white. */
  photo?: string | undefined;
  /** A rotated pink stamp over the art (ml-widgets "sticker"), e.g. "Coming soon". */
  sticker?: string | undefined;
  /** The round arrow button: brand pink, or white on a darker photo. */
  tone?: "brand" | "light" | undefined;
  /** Absent on an upcoming type: the banner is shown, not tappable, and says so. */
  onSelect?: (() => void) | undefined;
  /** The upcoming banner: a frosted light panel, no photo, no arrow. */
  hollow?: boolean | undefined;
}) {
  // Resting place of each piece in the top-right composition, and where it fans to on press.
  // The two back pieces sit smaller and fainter, so the cluster has depth.
  const slots = [
    "right-32 top-9 h-16 w-14 -rotate-[16deg] opacity-80 group-hover:-rotate-[22deg] group-hover:-translate-x-2 group-active:-rotate-[22deg]",
    "right-11 top-3 z-10 h-22 w-22 rotate-6 group-hover:-translate-y-1 group-active:-translate-y-1",
    "right-3 top-14 h-14 w-12 rotate-12 opacity-80 group-hover:rotate-[22deg] group-hover:translate-x-1 group-active:rotate-[22deg]",
  ];
  const Root = onSelect ? "button" : "div";
  return (
    <Root
      {...(onSelect
        ? { type: "button" as const, onClick: onSelect, "aria-label": `${title}: ${label}` }
        : { "aria-disabled": true, "aria-label": `${title}: ${label}` })}
      className={cn(
        "group relative flex min-h-44 w-full flex-col justify-between overflow-hidden rounded-lg p-4 text-left transition-[transform,box-shadow] duration-200 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        hollow
          ? "ml-grain bg-card/60 backdrop-blur-md"
          : "bg-ink text-white shadow-md active:scale-98 [@media(hover:hover)]:hover:shadow-lg",
      )}
    >
      {photo && !hollow ? (
        <>
          <img
            src={photo}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-standard group-hover:scale-105"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-ink/90 via-ink/45 to-ink/5"
          />
        </>
      ) : null}
      {art?.length && !hollow ? (
        // Brand glow behind the art: allowed in branded banners (owner, 6 Oct 2026).
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/35 blur-2xl"
        />
      ) : null}
      {art?.length ? (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/2">
          {art.map((piece, i) => (
            <span
              key={i}
              className={cn(
                "absolute animate-art-rise transition-[rotate,translate] duration-300 ease-standard motion-reduce:transition-none [&>*]:h-full [&>*]:w-full",
                slots[i],
              )}
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              <span
                className="block h-full w-full animate-art-float"
                style={{ animationDelay: `${i * 600}ms` }}
              >
                {piece}
              </span>
            </span>
          ))}
          {sticker ? (
            <span
              data-brand-id="brand-0007"
              className="absolute right-3 top-24 z-20 -rotate-6 animate-art-rise whitespace-nowrap rounded-full bg-brand px-3 py-1 text-sm font-bold text-white shadow-md"
              style={{ animationDelay: "360ms" }}
            >
              {sticker}
            </span>
          ) : null}
        </span>
      ) : null}
      {/* The glass label: the Market product card's badge (market.tsx), text only, no outline. */}
      <span
        className={cn(
          "relative self-start rounded-full px-2.5 py-1.5 text-1 leading-none backdrop-blur-md",
          hollow ? "bg-ink/5 text-foreground" : "bg-background/25 text-background",
        )}
      >
        {tag.text}
      </span>
      {hollow ? (
        // Academy's dashed edge (owner, 6 Oct 2026): a 6px stroke in 8px dashes and 8px gaps.
        // CSS dashed borders can't set dash length, so it is drawn.
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
          <rect
            x="3"
            y="3"
            rx="13"
            fill="none"
            strokeWidth="6"
            strokeDasharray="8 8"
            className="stroke-ink/15"
            style={{ width: "calc(100% - 6px)", height: "calc(100% - 6px)" }}
          />
        </svg>
      ) : null}
      <span className="relative mt-8 flex items-end justify-between gap-3">
        <span
          className={cn("text-4 font-bold leading-none", hollow ? "text-foreground" : "text-white")}
        >
          {title}
        </span>
        {hollow ? null : (
          // The one round control on this screen, per the owner's arrow reference (6 Oct 2026).
          <span
            aria-hidden
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-standard group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              tone === "brand" ? "bg-brand text-white" : "bg-card text-foreground",
            )}
          >
            <ArrowUpRight size={iconSize.md} strokeWidth={3} />
          </span>
        )}
      </span>
    </Root>
  );
}
