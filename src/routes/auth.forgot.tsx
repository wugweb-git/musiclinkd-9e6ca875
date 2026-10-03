import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Smartphone } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthComposition,
  AuthFooter,
  AuthNotice,
  AuthScreen,
  AuthSurface,
  AuthLink,
  EMAIL_PATTERN,
  LabeledInput,
  PhoneField,
  useFieldErrors,
  TrustNote,
  carriedEmail,
  classifyAuthError,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";

import { SegmentedField } from "@/components/ml/kit";
import { PhoneCodeStep } from "@/components/ml/phone-code";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [
      { title: "Reset your password — MusicLinkd" },
      {
        name: "description",
        content: "Reset your MusicLinkd password with a link by email or a code by text.",
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

/*
 * Forgot password, from the login screen only. Two ways back in (owner, 4 Oct 2026): by email, a
 * reset link that opens /reset-password; by mobile, a 6-digit code by text that signs in and then
 * opens /reset-password. Mobile only works for an account that already has that number — it never
 * creates one.
 */
type Method = "email" | "mobile";
const METHODS = ["email", "mobile"] as const;

function ForgotPassword() {
  const navigate = useNavigate();
  // Opens with the email typed on Sign in, if any.
  const [email, setEmail] = useState(carriedEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);
  const fields = useFieldErrors<"email" | "phone">();
  const [method, setMethod] = useState<Method>("email");
  const [digits, setDigits] = useState("");
  // The number a code was sent to; set, the screen shows its code step.
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const phoneProblem = !digits
    ? "Enter your mobile number."
    : !/^[6-9]\d{9}$/.test(digits)
      ? "Enter a 10-digit mobile number."
      : null;
  const emailProblem = !email.trim()
    ? "Enter your email address."
    : !EMAIL_PATTERN.test(email.trim())
      ? "Enter an email like name@example.com."
      : null;

  async function sendCode() {
    setError(null);
    fields.submitted();
    if (phoneProblem) {
      haptic("error");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      phone: `+91${digits}`,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (err) {
      haptic("error");
      setError(classifyAuthError(err.message));
      return;
    }
    haptic("confirm");
    setCodeSentTo(digits);
  }

  async function send() {
    if (method === "mobile") return sendCode();
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

  if (codeSentTo)
    return (
      <PhoneCodeStep
        phone={codeSentTo}
        onChangeNumber={() => setCodeSentTo(null)}
        onVerified={() => void navigate({ to: "/reset-password", replace: true })}
        createUser={false}
      />
    );

  return (
    <AuthScreen back={{ to: "/welcome" }}>
      <AuthComposition footer={<AuthFooter />}>
        <AuthSurface>
          <AuthHeading
            title={sent ? "Check your email" : "Reset your password"}
            sub={
              sent
                ? `If an account exists for ${email.trim()}, a password reset link has been sent.`
                : method === "email"
                  ? "Enter your email address and we'll send a secure reset link if it can be used."
                  : "Enter your mobile number and we'll send a 6-digit code if it can be used."
            }
          />

          {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

          {sent ? (
            <div className="space-y-3">
              <AuthNotice tone="success" title="Check your inbox">
                If this address is linked to an account, the reset link will arrive shortly. It
                expires in 60 minutes and can be used once.
              </AuthNotice>
              <div className="space-y-2 pt-1">
                <Btn
                  className="w-full h-12 text-2 font-medium"
                  onClick={() => void navigate({ to: "/welcome" })}
                >
                  Back to sign in
                </Btn>
                <Btn
                  variant="outline"
                  className="w-full h-12 text-2 font-medium"
                  onClick={() => setSent(false)}
                >
                  Change email
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
              <div className="mb-2">
                <SegmentedField
                  value={method}
                  options={METHODS}
                  onChange={(m) => {
                    setMethod(m);
                    setError(null);
                  }}
                  label="Reset by"
                  labels={{ email: "Email", mobile: "Mobile" }}
                  icons={{ email: Mail, mobile: Smartphone }}
                />
              </div>
              {method === "email" ? (
                <LabeledInput
                  label="Email address"
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
              ) : (
                <PhoneField
                  value={digits}
                  onChange={setDigits}
                  onBlur={() => fields.touch("phone")}
                  error={fields.errorFor("phone", phoneProblem)}
                />
              )}
              <Btn type="submit" className="mt-2 w-full h-12 text-2 font-medium" loading={busy}>
                {method === "email" ? "Send reset link" : "Send verification code"}
              </Btn>
              {method === "email" ? (
                <TrustNote>
                  For your safety, we confirm receipt regardless of whether an account exists.
                </TrustNote>
              ) : null}
            </form>
          )}
        </AuthSurface>

        <p className="mt-4 text-center text-1 text-muted-foreground">
          Remember your password?{" "}
          <AuthLink to="/welcome" className="text-foreground underline underline-offset-2">
            Sign in
          </AuthLink>
        </p>
      </AuthComposition>
    </AuthScreen>
  );
}
