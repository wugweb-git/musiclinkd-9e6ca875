import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { Linkedin, Smartphone } from "lucide-react";
import {
  AuthLink,
  AuthNotice,
  AuthScreen,
  Brand,
  Divider,
  EMAIL_PATTERN,
  GoogleIcon,
  LegalNote,
  PasswordInput,
  PasswordRequirements,
  TextField,
  carriedEmail,
  carryEmail,
  classifyAuthError,
  passwordScore,
  useFieldErrors,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { iconSize } from "@/lib/tokens";
import { Btn } from "@/components/ml/ui";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { showDemoControls } from "@/lib/dev";
import { useAuthProvider } from "@/lib/post-auth";
import { isNativeApp, signInWithGoogleNative } from "@/lib/native-auth";
import { beat, useArrival } from "@/lib/flow-motion";
import { roleIcon } from "@/lib/role-icons";
import { useTaxonomy } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { MadeByWugweb } from "@/components/ml/kit";
import { useServerFn } from "@tanstack/react-start";
import { signUpWithPassword } from "@/lib/sign-up.functions";
import { AccountRow } from "@/components/ml/accounts";
import { forgetAccount, switchTo, useSavedAccounts } from "@/lib/saved-accounts";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to MusicLinkd — India's music industry network" },
      {
        name: "description",
        content:
          "Join MusicLinkd to showcase your work, find collaborators, book studios and hire music professionals across India.",
      },
      { property: "og:title", content: "Welcome to MusicLinkd" },
      {
        property: "og:description",
        content: "The professional network and marketplace for India's music industry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WelcomeScreen,
});

/**
 * What is on the platform, not how much of it.
 *
 * The comp carried "12,000+ Musicians / 3,500+ Studios / 800+ Labels & Agencies".
 * Those figures were transcribed from a design mockup and nothing in the database
 * supports them, so they are not shipped: they would be an unsubstantiated claim
 * made to real users on the first screen they see.
 *
 * If real counts land, this is where they go — add a `value` and the render can
 * put it back in a bold span ahead of the label.
 */
const audience = [
  "Singers, session musicians and producers",
  "Recording studios and rehearsal rooms",
  "Labels, agencies and venues",
];

/**
 * Who is on MusicLinkd, as it moves: every published role from the taxonomy as a pill with its
 * icon, in three rows (performers, makers, businesses) drifting at different speeds; the edges fade. The roles come from the
 * database, so the ticker is never a claim the product can't back. Until they load, the two rows
 * hold their height; if they fail to load, the rows stay empty and the headline carries the screen.
 */
function RoleTicker({
  className,
  style,
}: {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}) {
  const { options } = useTaxonomy();
  const roles = (options?.person_types ?? []).filter((o) => o.slug !== "other");
  if (!roles.length) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "h-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [@media(max-height:639px)]:hidden",
        className,
      )}
      style={style}
    >
      <div className="flex w-max animate-marquee gap-1.5" style={{ animationDuration: "50s" }}>
        {[...roles, ...roles].map((o, i) => {
          const Icon = roleIcon(o);
          return (
            <span
              key={`${o.slug}-${i}`}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-subtle pl-2 pr-2.5 text-1 font-medium text-foreground border border-border/40"
            >
              <Icon size={12} strokeWidth={1.75} className="text-muted-foreground" />
              {o.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

type Mode = "signup" | "signin";

function WelcomeScreen() {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();
  const signUp = useServerFn(signUpWithPassword);
  // Welcome opens on Sign In (owner, 21 Sep 2026); creating an account is one tap away.
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(carriedEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | "linkedin" | null>(null);
  // Only offer a way in that the server will actually accept. LinkedIn is offered the moment the
  // provider is switched on for the project, and hidden until then, so the button never fails —
  // it was on this screen while linkedin_oidc was off, and every tap ended in an error.
  const linkedInState = useAuthProvider("linkedin_oidc");
  const showLinkedIn = linkedInState !== "off";
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const fields = useFieldErrors<"email" | "password">();
  const arrive = useArrival("welcome");
  const rise = arrive ? "animate-rise" : "";

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/", replace: true });
  }, [loading, signedIn, navigate]);

  const emailProblem = !email.trim()
    ? "Enter your email address."
    : !EMAIL_PATTERN.test(email.trim())
      ? "Enter an email like name@example.com."
      : null;
  const passwordProblem = !password
    ? "Enter a password."
    : mode === "signup" && passwordScore(password) < 3
      ? "Use at least 8 characters with an uppercase letter and a number."
      : null;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function submit() {
    setError(null);
    fields.submitted();
    if (emailProblem || passwordProblem) {
      haptic("error");
      return;
    }
    setBusy("email");
    if (mode === "signup") {
      // No email code: the account is created confirmed, then signed in below with the same password.
      try {
        const created = await signUp({ data: { email: email.trim(), password } });
        if (created.status === "exists") {
          setBusy(null);
          haptic("error");
          setMode("signin");
          setError(classifyAuthError("already registered"));
          return;
        }
      } catch (e) {
        setBusy(null);
        haptic("error");
        setError(classifyAuthError(e instanceof Error ? e.message : "network"));
        return;
      }
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(null);
    if (err) {
      haptic("error");
      const problem = classifyAuthError(err.message);
      if (problem.kind === "unconfirmed") {
        void navigate({ to: "/auth/verify-email", search: { email: email.trim() } });
        return;
      }
      setError(problem);
      return;
    }
    haptic("confirm");
    void navigate({ to: "/", replace: true });
  }

  async function google() {
    // Local dev server: Google can't return to localhost, so continue as a new test account
    // (/dev/new-user), which lands where a Google sign-up would. Production builds use Google.
    if (showDemoControls) {
      void navigate({ to: "/dev/new-user" });
      return;
    }
    setBusy("google");
    setError(null);
    // On a device the consent screen cannot run in the webview — Google refuses it — so it opens
    // in a Chrome Custom Tab and returns through the app's own scheme. The session then arrives on
    // the listener in the root, not here, which is why this path just waits.
    if (isNativeApp()) {
      const { error: nativeErr } = await signInWithGoogleNative();
      if (nativeErr) {
        setBusy(null);
        setError({
          title: "Google sign-in didn't finish",
          body: "Try again, or use your email and password.",
        });
      }
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(null);
      setError({
        title: "Google sign-in didn't finish",
        body: "Try again, or use your email and password.",
      });
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/", replace: true });
  }

  async function linkedin() {
    setBusy("linkedin");
    setError(null);
    // LinkedIn goes through the project's own auth provider (linkedin_oidc); Lovable's managed
    // sign-in covers Google, Apple and Microsoft only.
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      setBusy(null);
      setError({
        title: "LinkedIn sign-in didn't finish",
        body: "Try again, or use your email and password.",
      });
    }
  }

  const signup = mode === "signup";

  // Accounts already signed in on this device (Switch account): one tap back in.
  const saved = useSavedAccounts();
  async function continueAs(userId: string) {
    try {
      await switchTo(userId);
      window.location.assign("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't continue as that account");
    }
  }

  return (
<AuthScreen brand={false} className="bg-[#f7f6f2]">
<div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f7f6f2] text-foreground">
        <header className="shrink-0 px-5 pb-3 pt-2">
          <div className="flex items-center justify-between">
            <Brand compact className="vt-brand mb-0" />
            <button type="button" onClick={() => switchMode(signup ? "signin" : "signup")} className="min-h-12 text-1 font-semibold text-muted-foreground underline underline-offset-4">
              {signup ? "Sign in" : "Create account"}
            </button>
          </div>
          <div className={cn("mt-6", rise)} style={beat(1)}>
            <p className="mb-3 text-1 font-semibold tracking-[0.16em] text-[#ea4c89]">MUSICLINKD</p>
            <h1 className="max-w-[315px] text-4 font-bold leading-[0.96] tracking-[-0.065em] text-foreground">
              Your next<br /><span className="text-[#ea4c89]">sound</span> starts here.
            </h1>
            <p className="mt-1 max-w-[285px] text-2 leading-snug text-muted-foreground">Meet the artists, studios and opportunities shaping India&apos;s music scene.</p>
          </div>
          <div className={cn("mt-4 flex gap-2 overflow-hidden", rise)} style={beat(2)} aria-label="Music community roles">
            {["Artists", "Studios", "Producers"].map((label, index) => <span key={label} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-1 font-medium", index === 0 ? "border-[#ea4c89] bg-[#ea4c89] text-white" : "border-border bg-white text-muted-foreground")}>{label}</span>)}
          </div>
          <div className="sr-only"><ul>{audience.map((a) => <li key={a}>{a}</li>)}</ul></div>
        </header>

        <main className={cn("mt-1 flex-none rounded-t-[32px] bg-[#f7f6f2] px-5 pb-3 pt-2 text-foreground", rise)} style={beat(3)}>
          {saved.length ? <section className="mb-4"><p className="mb-2 text-1 font-semibold text-muted-foreground">Continue as</p><ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">{saved.slice(0, 1).map((a) => <AccountRow key={a.userId} account={a} current={false} busy={busy !== null} onPick={() => void continueAs(a.userId)} onRemove={() => forgetAccount(a.userId)} />)}</ul></section> : null}
          <form noValidate onSubmit={(e) => { e.preventDefault(); if (!busy) void submit(); }}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div><h2 className="text-3 font-bold tracking-[-0.04em]">{signup ? "Join MusicLinkd" : "Welcome back"}</h2><p className="mt-1 text-1 text-muted-foreground">{signup ? "Build your music circle." : "Pick up where you left off."}</p></div>
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ea4c89]" aria-hidden />
            </div>
            {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}
            <TextField label="Email" value={email} className="mb-3" onChange={(v) => { setEmail(v); carryEmail(v); }} onBlur={() => fields.touch("email")} error={fields.errorFor("email", emailProblem)} type="email" inputMode="email" autoComplete="email" enterKeyHint="next" placeholder="name@example.com" />
            <PasswordInput className="mb-1" value={password} onChange={setPassword} onBlur={() => fields.touch("password")} error={fields.errorFor("password", passwordProblem)} placeholder={signup ? "Create a strong password" : "Your password"} autoComplete={signup ? "new-password" : "current-password"} below={signup ? <PasswordRequirements value={password} /> : null} />
            {!signup ? <div className="mb-3 flex justify-end"><AuthLink to="/auth/forgot" className="text-1 font-medium text-muted-foreground underline underline-offset-4">Forgot password?</AuthLink></div> : null}
            <Btn type="submit" className="h-12 w-full rounded-full bg-[#111111] text-sm font-semibold text-white hover:bg-[#252525]" loading={busy === "email"}>{signup ? "Create account" : "Sign in"}</Btn>
          </form>
          <Divider label="or continue with" className="my-2 hidden sm:flex" />
          <div className={`hidden gap-2 sm:grid ${showLinkedIn ? "grid-cols-3" : "grid-cols-2"}`}>
            <Btn variant="outline" className="h-8 w-full rounded-full bg-white px-1 text-1 font-medium" icon={<GoogleIcon />} loading={busy === "google"} onClick={() => void google()}>Google</Btn>
            {showLinkedIn ? <Btn variant="outline" className="h-8 w-full rounded-full bg-white px-1 text-1 font-medium" icon={<Linkedin size={iconSize.sm} aria-hidden />} loading={busy === "linkedin"} onClick={() => void linkedin()}>LinkedIn</Btn> : null}
            <Btn variant="outline" className="h-8 w-full rounded-full bg-white px-1 text-1 font-medium" icon={<Smartphone size={iconSize.sm} aria-hidden />} onClick={() => void navigate({ to: "/auth/phone" })}>Phone</Btn>
          </div>
          <footer className="pt-5 text-center"><LegalNote className="mt-0" /><div className="mt-1"><MadeByWugweb /></div>{showDemoControls ? <p className="mt-1 text-1"><AuthLink to="/dev/new-user" className="text-muted-foreground">Dev: Test as a new user</AuthLink></p> : null}</footer>
        </main>
      </div>
    </AuthScreen>
  );
}
