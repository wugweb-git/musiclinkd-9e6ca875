import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Check, Eye, EyeOff, Music2, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- shell */

export function AuthScreen({
  children,
  brand = true,
  className = "",
}: {
  children: ReactNode;
  brand?: boolean | undefined;
  /** Override the ground. Defaults to the page grey; /welcome sits on white. */
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[100dvh] w-full max-w-app flex-col bg-background",
        className,
      )}
    >
      <div className="flex-1 px-5 pb-10 pt-6">
        {brand ? <Brand /> : null}
        {children}
      </div>
    </div>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mb-5 flex items-center gap-2" : "mb-7 flex items-center gap-2"}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-2xl"
        style={{ background: "var(--pink-container)" }}
      >
        <Music2 size={18} className="text-primary" />
      </span>
      <span className="text-2 font-semibold tracking-tight">MusicLinkd</span>
    </div>
  );
}

export function AuthHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3 font-semibold leading-tight tracking-tight">{title}</h1>
      {sub ? <p className="mt-2 text-1 leading-relaxed text-text2">{sub}</p> : null}
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-1 font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/* --------------------------------------------------------------- notice */

export type NoticeTone = "error" | "info" | "success" | "warn";

const noticeStyles: Record<NoticeTone, { bg: string; fg: string }> = {
  error: { bg: "color-mix(in oklab, var(--destructive) 10%, transparent)", fg: "text-destructive" },
  warn: { bg: "color-mix(in oklab, #F59E0B 16%, transparent)", fg: "text-foreground" },
  info: { bg: "var(--pink-container)", fg: "text-foreground" },
  success: { bg: "color-mix(in oklab, #16A34A 14%, transparent)", fg: "text-foreground" },
};

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
      className="mb-5 rounded-3xl px-4 py-3.5"
      style={{ background: s.bg }}
    >
      <p className={`text-1 font-semibold ${s.fg}`}>{title}</p>
      {children ? <div className="mt-1 text-1 leading-relaxed text-text2">{children}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------- inputs */

export function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-1 font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-13 w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-2 outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      {hint ? <span className="mt-1.5 block text-1 text-text2">{hint}</span> : null}
    </label>
  );
}

export function PasswordInput({
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-1 font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center rounded-2xl border border-border bg-card pr-2 focus-within:border-primary">
        <input
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-13 min-w-0 flex-1 bg-transparent px-4 py-3.5 text-2 outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

/* ---------------------------------------------------- password strength */

export type PasswordCheck = { label: string; ok: boolean };

export function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "One number", ok: /[0-9]/.test(pw) },
    { label: "Not only letters and numbers", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function passwordScore(pw: string) {
  return passwordChecks(pw).filter((c) => c.ok).length;
}

export function PasswordRequirements({ value }: { value: string }) {
  const checks = passwordChecks(value);
  const score = checks.filter((c) => c.ok).length;
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return (
    <div className="mb-5 rounded-3xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-1 font-semibold">Password strength</span>
        <span className="text-1 text-text2">{value ? label : "—"}</span>
      </div>
      <div className="mb-3 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i < score ? "var(--primary)" : "var(--border)" }}
          />
        ))}
      </div>
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-1 text-text2">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{ background: c.ok ? "var(--pink-container)" : "var(--border)" }}
            >
              {c.ok ? (
                <Check size={11} className="text-primary" />
              ) : (
                <X size={11} className="text-muted-foreground" />
              )}
            </span>
            <span className={c.ok ? "text-foreground" : undefined}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------- legal */

export function LegalNote() {
  return (
    <p className="mt-6 text-center text-1 leading-relaxed text-text2">
      By continuing you agree to our{" "}
      <Link to="/legal/terms" className="font-semibold text-primary">
        Terms
      </Link>{" "}
      and{" "}
      <Link to="/legal/privacy" className="font-semibold text-primary">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function TrustNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 flex items-start gap-2 text-1 leading-relaxed text-text2">
      <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
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
      body: "Sign in instead, or reset your password if you have forgotten it.",
    };
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return {
      kind: "invalid_credentials",
      title: "Email or password is incorrect",
      body: "Check for typos, or reset your password. Nothing was changed on your account.",
    };
  if (m.includes("email not confirmed") || m.includes("not confirmed"))
    return {
      kind: "unconfirmed",
      title: "Confirm your email first",
      body: "We sent you a confirmation link. Open it, then come back and sign in.",
    };
  if (m.includes("rate limit") || m.includes("too many"))
    return {
      kind: "rate_limit",
      title: "Too many attempts",
      body: "For your security we paused sign-in for a few minutes. Try again shortly.",
    };
  if (m.includes("password"))
    return { kind: "weak_password", title: "Password not accepted", body: message };
  if (m.includes("fetch") || m.includes("network"))
    return {
      kind: "network",
      title: "You appear to be offline",
      body: "We could not reach MusicLinkd. Check your connection and try again.",
    };
  return { kind: "unknown", title: "Something went wrong", body: message };
}
