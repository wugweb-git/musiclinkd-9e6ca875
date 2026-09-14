import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthNotice,
  AuthScreen,
  AuthLink,
  EMAIL_PATTERN,
  LabeledInput,
  useFieldErrors,
  TrustNote,
  classifyAuthError,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [
      { title: "Reset your password — MusicLinkd" },
      {
        name: "description",
        content: "Send yourself a secure link to set a new MusicLinkd password.",
      },
      { property: "og:title", content: "Reset your password — MusicLinkd" },
      {
        property: "og:description",
        content: "Get back into your MusicLinkd account in two steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);
  const fields = useFieldErrors<"email">();
  const emailProblem = !email.trim()
    ? "Enter your email address."
    : !EMAIL_PATTERN.test(email.trim())
      ? "Enter an email like name@example.com."
      : null;

  async function send() {
    setError(null);
    fields.submitted();
    if (emailProblem) return;
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      setError(classifyAuthError(err.message));
      return;
    }
    setSent(true);
  }

  return (
    <AuthScreen back={{ to: "/auth", search: { mode: "signin" } }}>
      <AuthHeading
        title={sent ? "Reset link sent" : "Forgot your password?"}
        sub={
          sent
            ? `If an account exists for ${email}, a reset link is on its way.`
            : "Enter the email you signed up with and we'll send a secure reset link."
        }
      />

      {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

      {sent ? (
        <>
          <AuthNotice tone="success" title="Check your inbox">
            The link expires in 60 minutes and can be used once.
          </AuthNotice>
          <div className="space-y-3">
            <Btn
              className="w-full"
              onClick={() => void navigate({ to: "/auth", search: { mode: "signin" } })}
            >
              Back to sign in
            </Btn>
            <Btn variant="outline" className="w-full" onClick={() => setSent(false)}>
              Send to a different email
            </Btn>
          </div>
        </>
      ) : (
        <>
          <LabeledInput
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="go"
            placeholder="name@example.com"
            onBlur={() => fields.touch("email")}
            error={fields.errorFor("email", emailProblem)}
          />
          <Btn className="mt-2 w-full" onClick={() => void send()} loading={busy}>
            Send reset link
          </Btn>
          <TrustNote>
            For your safety we show the same message whether or not an account exists.
          </TrustNote>
          <p className="mt-6 text-center text-1 text-muted-foreground">
            Remembered it?{" "}
            <AuthLink to="/auth" search={{ mode: "signin" }}>
              Sign in
            </AuthLink>
          </p>
        </>
      )}
    </AuthScreen>
  );
}
