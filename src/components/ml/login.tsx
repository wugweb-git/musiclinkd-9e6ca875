// The login and sign-up screens: two routes, one shared layout.
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Linkedin, Smartphone } from "lucide-react";
import {
  AuthLink,
  AuthComposition,
  AuthFooter,
  AuthNotice,
  AuthScreen,
  AuthSurface,
  Divider,
  EMAIL_PATTERN,
  GoogleIcon,
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
import { emailLinkTarget, useAuthProvider } from "@/lib/post-auth";
import { setRememberMe } from "@/lib/remember-me";
import { isNativeApp, signInWithGoogleNative } from "@/lib/native-auth";
import { beat, useArrival } from "@/lib/flow-motion";
import { AccountRow } from "@/components/ml/accounts";
import { forgetAccount, switchTo, useSavedAccounts } from "@/lib/saved-accounts";

export type LoginMode = "signup" | "signin";

/**
 * The login screen (`/welcome`, owner 4 Oct 2026: "rename welcome screen as login screen") and the
 * sign-up screen (`/signup`). They look alike on purpose but are two screens at two addresses:
 * "Create an account" navigates to sign-up and "Sign in" navigates back, rather than flipping one
 * form in place (owner, 4 Oct: no toggle). Back on a phone returns to the screen you came from.
 */
export function LoginScreen({ mode }: { mode: LoginMode }) {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();
  // The app opens on the login screen (owner, 21 Sep 2026); sign-up is one tap away, at /signup.
  const [email, setEmail] = useState(carriedEmail);
  const [password, setPassword] = useState("");
  // Login only (owner, 4 Oct 2026): sign-up has neither Remember me nor Forgot Password.
  const [remember, setRemember] = useState(true);
  const [step, setStep] = useState<"email" | "password">("email");
  const [busy, setBusy] = useState<"email" | "google" | "linkedin" | null>(null);
  // Only offer a way in that the server will actually accept. LinkedIn is offered the moment the
  // provider is switched on for the project, and hidden until then, so the button never fails —
  // it was on this screen while linkedin_oidc was off, and every tap ended in an error.
  const linkedInState = useAuthProvider("linkedin_oidc");
  const showLinkedIn = linkedInState !== "off";
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const fields = useFieldErrors<"email" | "password">();
  useArrival("welcome");

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

  async function submit() {
    setError(null);
    fields.submitted();
    if (emailProblem || passwordProblem) {
      haptic("error");
      return;
    }
    setBusy("email");
    if (mode === "signup") {
      /*
       * Email is verified by link before anything else (owner, 4 Oct 2026, asked for repeatedly).
       * The project requires confirmation, so sign-up returns no session and sends the link; the
       * next screen is Check your email, and the link lands on `/`, which goes on to onboarding.
       * An address that already has an account comes back with no identities and no email sent.
       */
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: emailLinkTarget() },
      });
      setBusy(null);
      if (err) {
        haptic("error");
        setError(classifyAuthError(err.message));
        return;
      }
      // Keep the same confirmation response for existing and new addresses. The authentication
      // service intentionally does not reveal whether this email already belongs to an account.
      haptic("confirm");
      void navigate({ to: "/auth/verify-email", search: { email: email.trim() } });
      return;
    }
    // Marked before signing in, so the session's first save already knows whether to keep it.
    setRememberMe(remember);
    const { data: signedIn, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (!remember && signedIn.user) forgetAccount(signedIn.user.id);
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

  // Email first, then the password (after lovable.dev/login, owner 3 Oct 2026).
  function continueWithEmail() {
    fields.touch("email");
    if (emailProblem) {
      haptic("error");
      return;
    }
    setError(null);
    setStep("password");
  }

  const provider =
    "relative h-12 w-full border-input bg-transparent text-2 font-medium [&>span:last-child]:static [@media(hover:hover)]:hover:bg-card";

  return (
    <AuthScreen back={signup ? { to: "/welcome" } : undefined}>
      <AuthComposition footer={<AuthFooter />}>
        <main className="flex flex-col" style={beat(2)}>
          <div className="mb-8 mt-6">
            <h1 className="text-3 font-medium leading-normal text-foreground">
              {signup ? "Create your account" : "Sign in"}
            </h1>
            {signup ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Join India’s professional music community.
              </p>
            ) : null}
          </div>
          {saved.length > 0 && !signup ? (
            <section className="mb-5">
              <p className="mb-1.5 text-1 font-semibold text-muted-foreground">Continue as</p>
              <ul className="overflow-hidden rounded-lg border border-border bg-card">
                {saved.slice(0, 1).map((a) => (
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

          <div className="grid gap-4">
            <Btn
              variant="outline"
              className={provider}
              loading={busy === "google"}
              onClick={() => void google()}
            >
              <span className="absolute left-3.5 flex items-center" aria-hidden>
                <GoogleIcon />
              </span>
              Continue with Google
            </Btn>
            {showLinkedIn ? (
              <Btn
                variant="outline"
                className={provider}
                loading={busy === "linkedin"}
                onClick={() => void linkedin()}
              >
                <span className="absolute left-3.5 flex items-center" aria-hidden>
                  <Linkedin size={iconSize.sm} />
                </span>
                Continue with LinkedIn
              </Btn>
            ) : null}
            <Btn
              variant="outline"
              className={provider}
              onClick={() => void navigate({ to: "/auth/phone" })}
            >
              <span className="absolute left-3.5 flex items-center" aria-hidden>
                <Smartphone size={iconSize.sm} />
              </span>
              Continue with phone
            </Btn>
          </div>

          <Divider label="OR" className="my-6" />

          <AuthSurface>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (busy) return;
                if (step === "email") continueWithEmail();
                else void submit();
              }}
            >
              {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

              <TextField
                label="Email"
                value={email}
                className="mb-3"
                onChange={(v) => {
                  setEmail(v);
                  carryEmail(v);
                  if (step === "password") setStep("email");
                }}
                onBlur={() => fields.touch("email")}
                error={fields.errorFor("email", emailProblem)}
                type="email"
                inputMode="email"
                autoComplete="email"
                enterKeyHint={step === "email" ? "go" : "next"}
                placeholder="Email"
              />
              {step === "password" ? (
                <div className="animate-message">
                  <PasswordInput
                    className="mb-2"
                    value={password}
                    onChange={setPassword}
                    onBlur={() => fields.touch("password")}
                    error={fields.errorFor("password", passwordProblem)}
                    placeholder={signup ? "Create a strong password" : "Password"}
                    autoComplete={signup ? "new-password" : "current-password"}
                    below={signup ? <PasswordRequirements value={password} /> : null}
                  />

                  {signup ? null : (
                    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <label className="hit-area relative flex items-center gap-2 text-1 font-medium text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="h-5 w-5 shrink-0 accent-[var(--ink)]"
                        />
                        Remember me
                      </label>
                      <AuthLink
                        to="/auth/forgot"
                        className="text-muted-foreground hover:text-foreground font-medium text-1"
                      >
                        Forgot password?
                      </AuthLink>
                    </div>
                  )}
                </div>
              ) : null}

              <Btn
                type="submit"
                className="mt-1 h-12 w-full text-2 font-medium"
                loading={busy === "email"}
              >
                {step === "email" ? "Continue" : signup ? "Create account" : "Sign in"}
              </Btn>
            </form>
          </AuthSurface>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {signup ? (
              <>
                Already have an account?{" "}
                <AuthLink
                  to="/welcome"
                  className="hit-area text-foreground underline underline-offset-2"
                >
                  Sign in
                </AuthLink>
              </>
            ) : (
              <>
                New to MusicLinkd?{" "}
                <AuthLink
                  to="/signup"
                  className="hit-area text-foreground underline underline-offset-2"
                >
                  Create account
                </AuthLink>
              </>
            )}
          </p>
        </main>

        <div className="mt-4 text-center">
          {showDemoControls ? (
            <p className="mt-0.5 text-center text-1">
              <AuthLink to="/dev/new-user" className="text-muted-foreground">
                Dev: Test as a new user
              </AuthLink>
            </p>
          ) : null}
        </div>
      </AuthComposition>
    </AuthScreen>
  );
}
