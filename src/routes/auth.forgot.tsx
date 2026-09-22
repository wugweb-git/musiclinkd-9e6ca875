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
  carriedEmail,
  classifyAuthError,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";

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
  // Opens with the email typed on Sign in, if any.
  const [email, setEmail] = useState(carriedEmail);
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
    if (emailProblem) {
      haptic("error");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      haptic("error");
      setError(classifyAuthError(err.message));
      return;
    }
    haptic("confirm");
    setSent(true);
  }

  return (
    <AuthScreen back={{ to: "/auth/phone" }}>
      <div className="rounded-lg bg-card p-5 border border-border/80 shadow-xs">
        <AuthHeading
          title={sent ? "Check your email" : "Reset your password"}
          sub={
            sent
              ? `If an account exists for ${email.trim()}, a password reset link has been sent.`
              : "Enter your registered email address and we'll send a secure reset link."
          }
        />

        {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

        {sent ? (
          <div className="space-y-4">
            <AuthNotice tone="success" title="Reset link dispatched">
              The link expires in 60 minutes and can be used once. Check your spam folder if you
              don't see it.
            </AuthNotice>
            <div className="space-y-2.5 pt-2">
              <Btn
                className="w-full h-12 text-sm font-semibold shadow-xs"
                onClick={() => void navigate({ to: "/welcome" })}
              >
                Back to Sign In
              </Btn>
              <Btn
                variant="outline"
                className="w-full h-12 text-sm font-medium"
                onClick={() => setSent(false)}
              >
                Send to a Different Email
              </Btn>
            </div>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void send();
            }}
          >
            <LabeledInput
              label="Registered email"
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
            <Btn
              type="submit"
              className="mt-2 w-full h-12 text-sm font-semibold shadow-xs"
              loading={busy}
            >
              Send Reset Link
            </Btn>
            <TrustNote>
              For your safety, we confirm receipt regardless of whether an account exists.
            </TrustNote>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <AuthLink
          to="/welcome"
          className="font-semibold text-foreground underline underline-offset-4"
        >
          Sign In
        </AuthLink>
      </p>
    </AuthScreen>
  );
}
