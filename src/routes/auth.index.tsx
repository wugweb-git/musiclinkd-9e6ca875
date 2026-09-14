import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { haptic } from "@/lib/haptics";
import {
  AuthHeading,
  AuthLink,
  AuthNotice,
  AuthScreen,
  AuthTextButton,
  Divider,
  EMAIL_PATTERN,
  GoogleIcon,
  LegalNote,
  PasswordInput,
  PasswordRequirements,
  TextField,
  carryEmail,
  classifyAuthError,
  passwordScore,
  useFieldErrors,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

type Search = { mode: "signin" | "signup" };

export const Route = createFileRoute("/auth/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — MusicLinkd" },
      {
        name: "description",
        content:
          "Sign in or create your MusicLinkd account to keep your portfolio, bookings and connections in sync.",
      },
      { property: "og:title", content: "Sign in — MusicLinkd" },
      {
        property: "og:description",
        content: "Create your MusicLinkd account and publish your music work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  const { signedIn, loading } = useAuth();
  const signup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);
  const fields = useFieldErrors<"email" | "password">();

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/", replace: true });
  }, [loading, signedIn, navigate]);

  const emailProblem = !email.trim()
    ? "Enter your email address."
    : !EMAIL_PATTERN.test(email.trim())
      ? "Enter an email like name@example.com."
      : null;
  const passwordProblem = !password
    ? signup
      ? "Choose a password."
      : "Enter your password."
    : signup && (password.length < 8 || passwordScore(password) < 2)
      ? "Use at least 8 characters, with a number or symbol."
      : null;
  const emailError = fields.errorFor("email", emailProblem);
  const passwordError = fields.errorFor("password", passwordProblem);

  function switchMode(next: Search["mode"]) {
    setError(null);
    fields.reset();
    void navigate({ to: "/auth", search: { mode: next }, replace: true });
  }

  async function submit() {
    setError(null);
    fields.submitted();
    if (emailProblem || passwordProblem) {
      haptic("error");
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          // Email confirmation is on: the person types the 6-digit code from the email next.
          void navigate({ to: "/auth/verify-email", search: { email: email.trim() } });
          return;
        }
        // Signed in straight away: the splash takes a new account into onboarding.
        void navigate({ to: "/", replace: true });
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      haptic("confirm");
      void navigate({ to: "/", replace: true });
    } catch (err) {
      haptic("error");
      setError(classifyAuthError(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (googleBusy) return;
    setError(null);
    setGoogleBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (!result.redirected) setGoogleBusy(false);
    if (result.error) {
      setError({
        kind: "unknown",
        title: "Google sign-in did not finish",
        body: "Try again, or continue with your email address.",
      });
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/", replace: true });
  }

  return (
    <AuthScreen back={{ to: "/welcome" }}>
      <AuthHeading
        title={signup ? "Create your account" : "Welcome back"}
        sub={
          signup
            ? "One account for your profile, portfolio, bookings and messages."
            : "Sign in to pick up where you left off."
        }
      />

      {error ? (
        <AuthNotice
          tone={error.kind === "unconfirmed" ? "info" : "error"}
          title={error.title}
          action={
            error.kind === "account_exists" ? (
              <AuthTextButton onClick={() => switchMode("signin")}>Sign in instead</AuthTextButton>
            ) : error.kind === "invalid_credentials" ? (
              <AuthLink to="/auth/forgot">Reset password</AuthLink>
            ) : error.kind === "unconfirmed" ? (
              <AuthLink to="/auth/verify-email" search={{ email: email.trim() }}>
                Enter your code
              </AuthLink>
            ) : null
          }
        >
          {error.body}
        </AuthNotice>
      ) : null}

      <div className="space-y-3">
        <Btn
          variant="outline"
          className="w-full"
          icon={<GoogleIcon />}
          loading={googleBusy}
          onClick={() => void google()}
        >
          Continue with Google
        </Btn>
        <Btn
          variant="outline"
          className="w-full"
          icon={<Smartphone size={18} />}
          onClick={() => void navigate({ to: "/auth/phone" })}
        >
          Continue with phone
        </Btn>
      </div>

      <Divider label="or" />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        <TextField
          label="Email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            carryEmail(v);
          }}
          onBlur={() => fields.touch("email")}
          error={emailError}
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          placeholder="name@example.com"
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          onBlur={() => fields.touch("password")}
          error={passwordError}
          placeholder={signup ? "At least 8 characters" : "Your password"}
          autoComplete={signup ? "new-password" : "current-password"}
          below={signup ? <PasswordRequirements value={password} /> : null}
        />

        {!signup ? (
          <div className="-mt-1 mb-5 flex justify-end text-1">
            <AuthLink to="/auth/forgot">Forgot password?</AuthLink>
          </div>
        ) : null}

        <Btn type="submit" className="mt-2 w-full" loading={busy}>
          {signup ? "Create account" : "Sign in"}
        </Btn>
      </form>

      <p className="mt-5 text-center text-1 text-muted-foreground">
        {signup ? "Already have an account? " : "New to MusicLinkd? "}
        <AuthTextButton onClick={() => switchMode(signup ? "signin" : "signup")}>
          {signup ? "Sign in" : "Create an account"}
        </AuthTextButton>
      </p>

      <LegalNote />
    </AuthScreen>
  );
}
