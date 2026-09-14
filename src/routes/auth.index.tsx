import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthNotice,
  AuthScreen,
  Divider,
  LabeledInput,
  LegalNote,
  PasswordInput,
  PasswordRequirements,
  classifyAuthError,
  passwordScore,
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
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/", replace: true });
  }, [loading, signedIn, navigate]);

  function switchMode(next: Search["mode"]) {
    setError(null);
    void navigate({ to: "/auth", search: { mode: next } });
  }

  async function submit() {
    setError(null);
    if (!email.includes("@")) {
      setError({
        kind: "unknown",
        title: "Enter a valid email",
        body: "We use your email to secure your account.",
      });
      return;
    }
    if (signup && passwordScore(password) < 2) {
      setError({
        kind: "weak_password",
        title: "Choose a stronger password",
        body: "Use at least 8 characters with a number or symbol.",
      });
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          void navigate({ to: "/auth/verify-email", search: { email } });
          return;
        }
        void navigate({ to: "/auth/success" });
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      toast.success("Welcome back");
      void navigate({ to: "/", replace: true });
    } catch (err) {
      setError(classifyAuthError(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError({
        kind: "unknown",
        title: "Google sign-in did not complete",
        body: "You can try again, or continue with your email address.",
      });
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/", replace: true });
  }

  return (
    <AuthScreen>
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
              <Btn variant="outline" onClick={() => switchMode("signin")}>
                Sign in instead
              </Btn>
            ) : error.kind === "invalid_credentials" ? (
              <Link to="/auth/forgot" className="text-1 font-semibold text-primary">
                Reset password
              </Link>
            ) : error.kind === "unconfirmed" ? (
              <Link
                to="/auth/verify-email"
                search={{ email }}
                className="text-1 font-semibold text-primary"
              >
                Resend confirmation
              </Link>
            ) : null
          }
        >
          {error.body}
        </AuthNotice>
      ) : null}

      <Btn variant="outline" className="w-full" onClick={() => void google()}>
        Continue with Google
      </Btn>
      <div className="mt-3">
        <Btn
          variant="outline"
          className="w-full"
          onClick={() => void navigate({ to: "/auth/phone" })}
        >
          Continue with phone
        </Btn>
      </div>

      <Divider label="or use email" />

      <LabeledInput
        label="Email"
        value={email}
        onChange={setEmail}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <PasswordInput
        value={password}
        onChange={setPassword}
        autoComplete={signup ? "new-password" : "current-password"}
      />

      {signup ? <PasswordRequirements value={password} /> : null}

      {!signup ? (
        <div className="mb-5 -mt-1 text-right">
          <Link to="/auth/forgot" className="text-1 font-semibold text-primary">
            Forgot password?
          </Link>
        </div>
      ) : null}

      <Btn className="w-full" onClick={() => void submit()} disabled={busy}>
        {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
      </Btn>

      <button
        type="button"
        onClick={() => switchMode(signup ? "signin" : "signup")}
        className="mt-5 w-full text-center text-1 text-muted-foreground"
      >
        {signup ? (
          <>
            Already have an account? <span className="font-semibold text-primary">Sign in</span>
          </>
        ) : (
          <>
            New to MusicLinkd? <span className="font-semibold text-primary">Create an account</span>
          </>
        )}
      </button>

      <LegalNote />

      <p className="mt-6 text-center text-1 text-muted-foreground">
        Browsing without an account?{" "}
        <Link to="/discover" className="font-semibold text-primary">
          Explore Discover
        </Link>
      </p>
    </AuthScreen>
  );
}
