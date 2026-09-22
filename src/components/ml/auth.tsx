import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Info,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";
import { IconBtn } from "./ui";
import { TextLink } from "@/components/ml/links";
import { iconSize } from "@/lib/tokens";

/* ---------------------------------------------------------------- shell */

/** Where Back lands when there is no history to return to (a deep link, an email link). */
export type AuthBack =
  { to: "/welcome" } | { to: "/auth/phone" } | { to: "/profile" } | { to: "/auth" };

export function AuthScreen({
  children,
  brand = false,
  back,
  className = "",
}: {
  children: ReactNode;
  brand?: boolean | undefined;
  /** Shows Back. It follows history like the Android back gesture, else goes here. */
  back?: AuthBack | undefined;
  /** Override the ground. Defaults to the page grey; /welcome sits on white. */
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-app flex-col bg-background overflow-hidden",
        className,
      )}
    >
      <div className="flex flex-1 flex-col justify-between px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] overflow-y-auto [@media(min-height:640px)]:overflow-hidden">
        {back ? (
          <div className="-ml-2 mb-2 flex h-10 shrink-0 items-center">
            <AuthBackButton back={back} />
          </div>
        ) : brand ? (
          <Brand compact className="mb-2 shrink-0" />
        ) : null}
        <div className="flex flex-1 flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthBackButton({ back }: { back: AuthBack }) {
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <IconBtn
      label="Back"
      variant="plain"
      onClick={() => {
        if (router.history.canGoBack()) router.history.back();
        else void navigate({ ...(back as { to: "/welcome" }), replace: true });
      }}
    >
      <ArrowLeft size={iconSize.md} aria-hidden />
    </IconBtn>
  );
}

/** Google's "G" mark. The four fills are Google's required brand colours, not token misses. */
export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function Brand({
  compact = false,
  animated = false,
  className = "",
}: {
  compact?: boolean;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        compact ? "mb-5 flex items-center gap-2.5" : "mb-7 flex items-center gap-3",
        className,
      )}
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-pink-container shadow-sm">
        <LogoMark className={`w-6 text-brand ${animated ? "animate-sound-check" : ""}`} />
        <span className="pointer-events-none absolute -inset-0.5 rounded-sm border border-brand/20" />
      </span>
      <span className="text-3 font-bold tracking-tight text-foreground">MusicLinkd</span>
    </div>
  );
}

export function AuthHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3 font-bold tracking-tight text-foreground leading-tight">{title}</h1>
      {sub ? <p className="mt-1.5 text-1 leading-relaxed text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function Divider({
  label,
  className,
}: {
  label: string;
  className?: string | undefined;
}) {
  return (
    <div className={cn("my-4 flex items-center gap-3 text-1 text-muted-foreground", className)}>
      <span className="h-px flex-1 bg-border/80" />
      <span className="rounded-full bg-subtle px-2.5 py-0.5 text-1 font-medium">{label}</span>
      <span className="h-px flex-1 bg-border/80" />
    </div>
  );
}

/* --------------------------------------------------------------- notice */

export type NoticeTone = "error" | "info" | "success" | "warn";

const noticeStyles: Record<NoticeTone, { box: string; icon: string; Icon: LucideIcon }> = {
  error: { box: "bg-danger-container", icon: "text-destructive", Icon: CircleAlert },
  warn: { box: "bg-warn-container", icon: "text-foreground", Icon: TriangleAlert },
  info: { box: "bg-background", icon: "text-muted-foreground", Icon: Info },
  success: { box: "bg-success-container", icon: "text-success", Icon: CircleCheck },
};

/**
 * A message about the whole form (a failed sign-in, a sent code). Field problems belong under the
 * field instead. Icon, one bold line, an optional sentence and an optional action; it slides in.
 */
export function AuthNotice({
  tone = "error",
  title,
  children,
  action,
}: {
  tone?: NoticeTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const s = noticeStyles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("mb-5 flex animate-message gap-3 rounded-sm px-3.5 py-3", s.box)}
    >
      <s.Icon size={20} className={cn("mt-px shrink-0", s.icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {children ? (
          <div className="mt-0.5 text-1 leading-relaxed text-muted-foreground">{children}</div>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- links */

/**
 * The auth screens' text link and text action. Both live in components/ml/links.tsx now, with the
 * rest of the link system; these names stay so the auth screens and their stories keep working.
 */
export { TextLink as AuthLink, TextButton as AuthTextButton } from "@/components/ml/links";

/* -------------------------------------------------------------- fields */

/**
 * Text field states: enabled, hovered (pointer devices), focused (ink border + ring), filled,
 * invalid (red border, message with icon under the field, announced), disabled. The label is quiet
 * grey sentence case, turns ink while the field has focus and red when it is invalid; the message
 * slides in so the change is noticed without a jump.
 */
export function TextField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  hint,
  error,
  autoComplete,
  inputMode,
  enterKeyHint,
  leading,
  trailing,
  maxLength,
  disabled = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password";
  hint?: string;
  /** Shown under the field, in place of the hint, and marks the field invalid. */
  error?: string | null;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  enterKeyHint?: "next" | "go" | "done" | "send";
  leading?: ReactNode;
  trailing?: ReactNode;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const invalid = Boolean(error);
  return (
    <div className={cn("group mb-4", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-sm font-medium transition-colors duration-125 ease-standard",
          invalid ? "text-destructive" : "text-muted-foreground group-focus-within:text-foreground",
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          "press-brand flex h-12 items-center gap-2 rounded-sm border bg-card px-3.5 shadow-xs transition-all duration-150 ease-standard",
          invalid
            ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : "border-border focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/10 [@media(hover:hover)]:hover:border-muted-foreground/80",
          disabled && "bg-background opacity-60",
        )}
      >
        {leading}
        <input
          id={id}
          type={type}
          value={value}
          inputMode={inputMode}
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={error || hint ? messageId : undefined}
          onKeyDown={(e) => {
            // Some Android keyboards do not submit forms on their own. Next moves to the next
            // field; Go submits.
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            const form = e.currentTarget.form;
            if (!form) return;
            e.preventDefault();
            if (enterKeyHint === "next") {
              const fields = [...form.querySelectorAll<HTMLInputElement>("input:not([disabled])")];
              const next = fields[fields.indexOf(e.currentTarget) + 1];
              if (next) {
                next.focus();
                return;
              }
            }
            form.requestSubmit();
          }}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-2 outline-none placeholder:text-muted-foreground/60 focus-visible:outline-none"
        />
        {trailing}
      </div>
      {error ? (
        <p
          id={messageId}
          role="alert"
          className="mt-1.5 flex animate-message items-start gap-1.5 text-1 text-destructive"
        >
          <CircleAlert size={iconSize.sm} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-1 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Kept for existing call sites; it is a TextField. */
export const LabeledInput = TextField;

export function PasswordInput({
  label = "Password",
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Your password",
  autoComplete = "current-password",
  below,
  className,
}: {
  label?: string | undefined;
  value: string;
  onChange: (v: string) => void;
  onBlur?: (() => void) | undefined;
  error?: (string | null) | undefined;
  placeholder?: string | undefined;
  autoComplete?: string | undefined;
  /** Rendered between the field and its error, e.g. the strength meter. */
  below?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn("mb-3", className)}>
      <TextField
        className="mb-0"
        label={label}
        value={value}
        onChange={onChange}
        {...(onBlur ? { onBlur } : {})}
        {...(error ? { error } : {})}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        enterKeyHint="go"
        placeholder={placeholder}
        trailing={
          <IconBtn
            label={show ? "Hide password" : "Show password"}
            variant="plain"
            className="-mr-2 text-muted-foreground"
            onClick={() => setShow((s) => !s)}
          >
            <span key={String(show)} className="inline-flex animate-pop">
              {show ? (
                <EyeOff size={iconSize.md} aria-hidden />
              ) : (
                <Eye size={iconSize.md} aria-hidden />
              )}
            </span>
          </IconBtn>
        }
      />
      {below}
    </div>
  );
}

/* ---------------------------------------------------- password strength */

export type PasswordCheck = { label: string; hint: string; ok: boolean };

// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters", hint: "Use at least 8 characters", ok: pw.length >= 8 },
    { label: "One uppercase letter", hint: "Add an uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "One number", hint: "Add a number", ok: /[0-9]/.test(pw) },
    { label: "A symbol", hint: "Add a symbol, like ! or #", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function passwordScore(pw: string) {
  return passwordChecks(pw).filter((c) => c.ok).length;
}

/**
 * Strength in one line, sized for a screen with the keyboard open: four thin segments, the rating,
 * and only the next thing to fix. Nothing shows until the person starts typing.
 */
export function PasswordRequirements({ value }: { value: string }) {
  if (!value) return null;
  const checks = passwordChecks(value);
  const score = checks.filter((c) => c.ok).length;
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  const next = checks.find((c) => !c.ok);
  return (
    <div className="mt-2 animate-message" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200 ease-standard",
              i < score ? (score <= 1 ? "bg-destructive" : "bg-foreground") : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-1 text-muted-foreground">
        <span className="font-semibold text-foreground">{label}</span>
        {next ? ` · ${next.hint}` : null}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- phone */

/** India's flag, drawn: emoji flags do not render on every Android build. */
export function IndiaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={cn("h-4 w-6 shrink-0 rounded-sm", className)} aria-hidden>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" strokeWidth="0.6" />
      <circle cx="12" cy="8" r="0.4" fill="#000080" />
    </svg>
  );
}

/** "9876543210" → "98765 43210". */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function formatIndianMobile(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
}

export function PhoneField({
  value,
  onChange,
  onBlur,
  error,
}: {
  /** Digits only. */
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  error?: string | null;
}) {
  return (
    <TextField
      label="Mobile number"
      value={formatIndianMobile(value)}
      onChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 10))}
      {...(onBlur ? { onBlur } : {})}
      {...(error ? { error } : {})}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      enterKeyHint="go"
      placeholder="98765 43210"
      leading={
        <span className="-ml-0.5 flex shrink-0 items-center gap-2 border-r border-border/80 pr-3 text-2 font-semibold text-foreground">
          <IndiaFlag className="shadow-xs" />
          <span>+91</span>
        </span>
      }
    />
  );
}

/* ---------------------------------------------------------------- code */

/**
 * Six boxes over one real input (so SMS and email autofill work). The active box shows a caret,
 * digits pop in, a complete code rings all six in ink while it is checked, a rejected code shakes
 * the row. `onComplete` fires once per complete code.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  invalid = false,
  shakeKey = 0,
  length = 6,
  label = "Verification code",
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (code: string) => void;
  invalid?: boolean;
  shakeKey?: number;
  length?: number;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const tried = useRef("");

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    if (value.length !== length || tried.current === value) return;
    tried.current = value;
    onComplete?.(value);
    // onComplete is read at the moment the code completes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  return (
    <>
      <button
        type="button"
        key={shakeKey}
        onClick={() => ref.current?.focus()}
        className={cn("mb-6 flex w-full justify-between gap-2.5", shakeKey ? "animate-shake" : "")}
        aria-label={label}
      >
        {Array.from({ length }, (_, i) => {
          const active = i === value.length && focused;
          const complete = value.length === length && !invalid;
          return (
            <span
              key={i}
              style={complete ? { animationDelay: `${i * 45}ms` } : undefined}
              className={cn(
                complete && "animate-meter",
                "flex h-14 flex-1 items-center justify-center rounded-sm border bg-card text-3 font-bold transition-all duration-150 ease-standard shadow-xs",
                invalid
                  ? "border-destructive bg-danger-container/20 text-destructive"
                  : active
                    ? "border-foreground ring-2 ring-foreground/15 shadow-sm scale-[1.03]"
                    : value.length === length
                      ? "border-foreground/80 bg-subtle"
                      : value[i]
                        ? "border-foreground/40 text-foreground"
                        : "border-border text-muted-foreground",
              )}
            >
              {value[i] ? (
                <span key={value[i]} className="animate-pop">
                  {value[i]}
                </span>
              ) : active ? (
                <span aria-hidden className="h-6 w-0.5 animate-caret bg-foreground rounded-full" />
              ) : null}
            </span>
          );
        })}
      </button>
      <input
        ref={ref}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, length);
          if (next.length < length) tried.current = "";
          onChange(next);
        }}
        className="sr-only"
        aria-label={label}
      />
    </>
  );
}

/** Seconds until "Resend code" is allowed again. */
// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its component
export function useCountdown(start: number) {
  const [seconds, setSeconds] = useState(start);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);
  return { seconds, restart: () => setSeconds(start) };
}

/* ---------------------------------------------------------- validation */

/**
 * The email typed on Sign in, so Forgot password opens with it filled. Kept for the tab only and
 * never in the URL.
 */
const EMAIL_CARRY = "ml.auth.email";
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function carryEmail(email: string) {
  try {
    window.sessionStorage.setItem(EMAIL_CARRY, email.trim());
  } catch {
    /* storage may be unavailable */
  }
}
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function carriedEmail(): string {
  try {
    return typeof window === "undefined" ? "" : (window.sessionStorage.getItem(EMAIL_CARRY) ?? "");
  } catch {
    return "";
  }
}

export { EMAIL_PATTERN } from "@/lib/validation";

/**
 * Show a field's error after the person leaves it or submits, then keep it live while they fix it.
 * `touch(name)` on blur; `submitted()` before sending; `errorFor(name, message)` returns what to show.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its component
export function useFieldErrors<N extends string>() {
  const [touched, setTouched] = useState<Partial<Record<N, true>>>({});
  const [tried, setTried] = useState(false);
  return {
    touch: (name: N) => setTouched((t) => ({ ...t, [name]: true })),
    submitted: () => setTried(true),
    reset: () => {
      setTouched({});
      setTried(false);
    },
    errorFor: (name: N, message: string | null) => (tried || touched[name] ? message : null),
  };
}

/* ------------------------------------------------------------- legal */

export function LegalNote({ className }: { className?: string | undefined } = {}) {
  return (
    <p className={cn("mt-4 text-center text-1 leading-relaxed text-muted-foreground", className)}>
      By continuing you agree to our{" "}
      <TextLink to="/legal/terms" className="underline underline-offset-2">
        Terms
      </TextLink>{" "}
      and{" "}
      <TextLink to="/legal/privacy" className="underline underline-offset-2">
        Privacy Policy
      </TextLink>
      .
    </p>
  );
}

/* --------------------------------------------------------------- status */

export type AuthStatusTone = "danger" | "neutral";

const statusTone: Record<AuthStatusTone, { tile: string; icon: string }> = {
  danger: { tile: "bg-danger-container", icon: "text-destructive" },
  neutral: { tile: "bg-background", icon: "text-muted-foreground" },
};

/**
 * The sign-in status screens (locked, maintenance, offline): an icon tile, a heading, an optional
 * checklist, actions, a reassurance note and a way back. Tone picks the tile from container tokens.
 */
export function AuthStatus({
  tone = "neutral",
  icon: Icon,
  title,
  body,
  listTitle,
  list,
  actions,
  note,
  footer,
  back,
}: {
  tone?: AuthStatusTone;
  icon: LucideIcon;
  title: string;
  body: string;
  listTitle?: string;
  list?: string[];
  actions: ReactNode;
  note: ReactNode;
  footer?: ReactNode;
  back?: AuthBack;
}) {
  const t = statusTone[tone];
  return (
    <AuthScreen back={back}>
      <div className={cn("mb-6 flex h-14 w-14 items-center justify-center rounded-sm", t.tile)}>
        <Icon size={24} className={t.icon} aria-hidden />
      </div>
      <AuthHeading title={title} sub={body} />
      {list?.length ? (
        <div className="mb-6 rounded-lg bg-subtle p-4">
          {listTitle ? <p className="text-sm font-semibold">{listTitle}</p> : null}
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-1 leading-relaxed text-muted-foreground">
            {list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="space-y-3">{actions}</div>
      <TrustNote>{note}</TrustNote>
      {footer ? <p className="mt-6 text-center text-1 text-muted-foreground">{footer}</p> : null}
    </AuthScreen>
  );
}

export function TrustNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 flex items-start gap-2 text-1 leading-relaxed text-muted-foreground">
      <ShieldCheck size={iconSize.sm} className="mt-0.5 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  );
}

/* -------------------------------------------------------- error mapping */

export type AuthErrorKind =
  | "invalid_credentials"
  | "account_exists"
  | "unconfirmed"
  | "rate_limit"
  | "weak_password"
  | "network"
  | "unknown";

// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export function classifyAuthError(message: string): {
  kind: AuthErrorKind;
  title: string;
  body: string;
} {
  const m = message.toLowerCase();
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already")
  )
    return {
      kind: "account_exists",
      title: "This email already has an account",
      body: "Sign in instead, or continue with Google if you joined with Google.",
    };
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return {
      kind: "invalid_credentials",
      title: "Email or password is incorrect",
      body: "Check for typos or reset your password. If you joined with Google, continue with Google.",
    };
  if (m.includes("email not confirmed") || m.includes("not confirmed"))
    return {
      kind: "unconfirmed",
      title: "Confirm your email first",
      body: "We emailed you a 6-digit code. Enter it to finish creating your account.",
    };
  if (m.includes("rate limit") || m.includes("too many"))
    return {
      kind: "rate_limit",
      title: "Too many attempts",
      body: "For your security we paused sign-in for a few minutes. Try again shortly.",
    };
  if (m.includes("password") && (m.includes("different") || m.includes("same")))
    return {
      kind: "weak_password",
      title: "Choose a new password",
      body: "It has to be different from your current password.",
    };
  if (m.includes("password"))
    return {
      kind: "weak_password",
      title: "Password not accepted",
      body: "Use at least 8 characters, with a number or symbol.",
    };
  if (m.includes("fetch") || m.includes("network"))
    return {
      kind: "network",
      title: "You appear to be offline",
      body: "We could not reach MusicLinkd. Check your connection and try again.",
    };
  // Raw server text is not shown; it stays in the console for debugging.
  console.warn("[auth]", message);
  return {
    kind: "unknown",
    title: "Something went wrong",
    body: "Try again. If it keeps happening, use another way to sign in.",
  };
}
