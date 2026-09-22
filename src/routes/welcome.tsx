import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { Linkedin } from "lucide-react";
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
function RoleTicker({ className, style }: { className?: string | undefined; style?: CSSProperties | undefined }) {
  const { options } = useTaxonomy();
  const roles = (options?.person_types ?? []).filter((o) => o.slug !== "other");
  if (!roles.length) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "h-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className,
      )}
      style={style}
    >
      <div
        className="flex w-max animate-marquee gap-1.5"
        style={{ animationDuration: "50s" }}
      >
        {[...roles, ...roles].map((o, i) => {
          const Icon = roleIcon(o);
          return (
            <span
              key={`${o.slug}-${i}`}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-subtle pl-2 pr-2.5 text-0 font-medium text-foreground border border-border/40"
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
    <AuthScreen brand={false} className="bg-background">
      <div className="flex flex-1 min-h-0 flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between pt-0.5">
            <Brand compact className="vt-brand mb-0" />
            <div aria-hidden className="flex items-center gap-1 text-pink-strong">
              <span className="h-2 w-0.5 rounded-full bg-pink-strong animate-eq-1" />
              <span className="h-3.5 w-0.5 rounded-full bg-pink-strong animate-eq-2" />
              <span className="h-2 w-0.5 rounded-full bg-pink-strong animate-eq-3" />
            </div>
          </div>

          <div className="pt-1 pb-1">
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full bg-pink-container px-2 py-0.5 text-0 font-semibold text-pink-strong",
                  rise,
                )}
                style={beat(1)}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-pink-strong animate-pulse" />
                India's music network
              </div>

              <div className="text-0 font-bold tracking-tight text-foreground">
                <span className={cn("inline-block", rise)} style={beat(2)}>Connect. </span>
                <span className={cn("inline-block", rise)} style={beat(3)}>Collab. </span>
                <span className={cn("inline-block text-pink-strong", rise)} style={beat(4)}>Create.</span>
              </div>
            </div>

            {/* Screen readers get the three lines */}
            <ul className="sr-only">
              {audience.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>

            <RoleTicker className={cn("-mx-4 sm:-mx-5 mt-1.5", rise)} style={beat(5)} />
          </div>
        </div>

        {/* Interactive mode switcher + Form */}
        <div className={cn("my-auto py-0.5", rise)} style={beat(6)}>
          {saved.length ? (
            <section className="mb-2">
              <p className="mb-1 text-0 font-semibold text-muted-foreground">Continue as</p>
              <ul className="divide-y divide-border overflow-hidden rounded-lg bg-card border border-border shadow-xs">
                {saved.slice(0, 2).map((a) => (
                  <AccountRow
                    key={a.userId}
                    account={a}
                    current={false}
                    busy={busy !== null}
                    onPick={() => void continueAs(a.userId)}
                    onRemove={() => forgetAccount(a.userId)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {/* Segmented Auth Mode Switcher */}
          <div className="mb-2 flex rounded-full bg-subtle p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={cn(
                "flex-1 rounded-full py-1 text-xs sm:text-sm font-semibold transition-all duration-150 ease-standard",
                !signup
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={cn(
                "flex-1 rounded-full py-1 text-xs sm:text-sm font-semibold transition-all duration-150 ease-standard",
                signup
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Create Account
            </button>
          </div>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void submit();
            }}
            className="rounded-lg bg-card p-3 sm:p-3.5 border border-border/80 shadow-xs"
          >
            <div className="mb-2">
              <h2 className="text-1 sm:text-2 font-bold text-foreground">
                {signup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-0 text-muted-foreground">
                {signup
                  ? "Join musicians, producers and studios across India."
                  : "Sign in with your email and password."}
              </p>
            </div>

            {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

            <TextField
              label="Email"
              value={email}
              className="mb-2"
              onChange={(v) => {
                setEmail(v);
                carryEmail(v);
              }}
              onBlur={() => fields.touch("email")}
              error={fields.errorFor("email", emailProblem)}
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              placeholder="name@example.com"
            />
            <PasswordInput
              className="mb-1.5"
              value={password}
              onChange={setPassword}
              onBlur={() => fields.touch("password")}
              error={fields.errorFor("password", passwordProblem)}
              placeholder={signup ? "Create a strong password" : "Your password"}
              autoComplete={signup ? "new-password" : "current-password"}
              below={signup ? <PasswordRequirements value={password} /> : null}
            />

            {signup ? null : (
              <div className="mb-2 flex items-center justify-end">
                <AuthLink
                  to="/auth/forgot"
                  className="text-muted-foreground hover:text-foreground font-medium text-0"
                >
                  Forgot Password?
                </AuthLink>
              </div>
            )}

            <Btn
              type="submit"
              className="w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold shadow-xs"
              loading={busy === "email"}
            >
              {signup ? "Create Account" : "Sign In"}
            </Btn>
          </form>

          <Divider label="or continue with" className="my-1.5" />

          <div className="grid grid-cols-2 gap-2">
            <Btn
              variant="outline"
              className="w-full h-9 sm:h-10 bg-card border-border/90 hover:bg-subtle text-xs sm:text-sm font-medium shadow-xs px-2"
              icon={<GoogleIcon />}
              loading={busy === "google"}
              onClick={() => void google()}
            >
              Google
            </Btn>
            <Btn
              variant="outline"
              className="w-full h-9 sm:h-10 bg-card border-border/90 hover:bg-subtle text-xs sm:text-sm font-medium shadow-xs px-2"
              icon={<Linkedin size={iconSize.sm} aria-hidden />}
              loading={busy === "linkedin"}
              onClick={() => void linkedin()}
            >
              LinkedIn
            </Btn>
          </div>

          <p className="mt-2 text-center text-xs sm:text-sm">
            <AuthLink
              to="/auth/phone"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Sign in with Mobile Number
            </AuthLink>
          </p>
        </div>

        {/* Footer */}
        <div className="shrink-0 pt-0.5 text-center">
          <LegalNote className="mt-0" />
          <div className="mt-0.5">
            <MadeByWugweb />
          </div>

          {showDemoControls ? (
            <p className="mt-0.5 text-center text-0">
              <AuthLink to="/dev/new-user" className="text-muted-foreground">
                Dev: Test as a new user
              </AuthLink>
            </p>
          ) : null}
        </div>
      </div>
    </AuthScreen>
  );
}
