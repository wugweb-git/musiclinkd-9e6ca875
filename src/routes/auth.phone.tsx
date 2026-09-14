import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { usePhoneSignIn } from "@/lib/post-auth";
import {
  AuthHeading,
  AuthLink,
  AuthNotice,
  AuthScreen,
  PhoneField,
  TrustNote,
  classifyAuthError,
  useFieldErrors,
} from "@/components/ml/auth";

export const Route = createFileRoute("/auth/phone")({
  head: () => ({
    meta: [
      { title: "Continue with phone — MusicLinkd" },
      {
        name: "description",
        content: "Sign in to MusicLinkd with your mobile number and a one-time code.",
      },
      { property: "og:title", content: "Continue with phone — MusicLinkd" },
      { property: "og:description", content: "Fast, password-free sign in for MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PhoneAuth,
});

function PhoneAuth() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");
  const provider = usePhoneSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);
  const fields = useFieldErrors<"phone">();

  // Indian mobile numbers are 10 digits and start with 6, 7, 8 or 9.
  const phoneProblem = !digits
    ? "Enter your mobile number."
    : !/^[6-9]\d{9}$/.test(digits)
      ? "Enter a 10-digit mobile number."
      : null;

  async function send() {
    setError(null);
    fields.submitted();
    if (phoneProblem) {
      haptic("error");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
    setBusy(false);
    if (err) {
      haptic("error");
      setError(classifyAuthError(err.message));
      return;
    }
    void navigate({ to: "/auth/otp", search: { phone: digits } });
  }

  return (
    <AuthScreen back={{ to: "/welcome" }}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && provider !== "off") void send();
        }}
      >
        <AuthHeading
          title="Continue with phone"
          sub="We'll text you a 6-digit code. No password to remember."
        />

        {provider === "off" ? (
          <AuthNotice tone="info" title="Phone sign-in is not available yet">
            Continue with Google or email for now.
          </AuthNotice>
        ) : null}
        {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

        <PhoneField
          value={digits}
          onChange={setDigits}
          onBlur={() => fields.touch("phone")}
          error={fields.errorFor("phone", phoneProblem)}
        />

        <Btn type="submit" className="mt-2 w-full" loading={busy} disabled={provider === "off"}>
          Send code
        </Btn>
      </form>

      <TrustNote>Your number is never shown on your public profile.</TrustNote>

      <p className="mt-6 flex justify-center text-1">
        <AuthLink to="/auth" search={{ mode: "signin" }} icon={<Mail size={16} />}>
          Use email instead
        </AuthLink>
      </p>
    </AuthScreen>
  );
}
