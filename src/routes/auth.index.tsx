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
  EMAIL_PATTERN,
  LegalNote,
  TextField,
  TrustNote,
  carriedEmail,
  carryEmail,
  classifyAuthError,
  useFieldErrors,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MadeByWugweb } from "@/components/ml/kit";

/*
 * Sign in with email: the alternative on the mobile sign-in screen. One field and a 6-digit code,
 * no password. The same screen serves a new email (the account is created when the code is
 * verified) and a returning one, so there is no separate sign-up.
 */
export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Sign in with email — MusicLinkd" },
      {
        name: "description",
        content: "Sign in to MusicLinkd with your email address and a one-time code.",
      },
      { property: "og:title", content: "Sign in with email — MusicLinkd" },
      { property: "og:description", content: "Password-free sign in for MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailSignIn,
});

function EmailSignIn() {
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const [email, setEmail] = useState(carriedEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);
  const fields = useFieldErrors<"email">();

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/", replace: true });
  }, [loading, signedIn, navigate]);

  const emailProblem = !email.trim()
    ? "Enter your email address."
    : !EMAIL_PATTERN.test(email.trim())
      ? "Enter an email like name@example.com."
      : null;

  async function send() {
    setError(null);
    fields.submitted();
    if (emailProblem) {
      haptic("error");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      haptic("error");
      setError(classifyAuthError(err.message));
      return;
    }
    haptic("confirm");
    void navigate({ to: "/auth/verify-email", search: { email: email.trim() } });
  }

  return (
    <AuthScreen back={{ to: "/auth/phone" }}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void send();
        }}
      >
        <AuthHeading
          title="Sign in with email"
          sub="We'll email you a 6-digit code. No password to remember."
        />

        {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

        <TextField
          label="Email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            carryEmail(v);
          }}
          onBlur={() => fields.touch("email")}
          error={fields.errorFor("email", emailProblem)}
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="go"
          placeholder="name@example.com"
        />

        <Btn type="submit" className="mt-2 w-full" loading={busy}>
          Send Code
        </Btn>
      </form>

      <TrustNote>Your email is never shown on your public profile.</TrustNote>

      <p className="mt-6 flex justify-center text-sm">
        <AuthLink to="/auth/phone" icon={<Smartphone size={16} />}>
          Sign in with Mobile
        </AuthLink>
      </p>

      <LegalNote />
      <MadeByWugweb />
    </AuthScreen>
  );
}
