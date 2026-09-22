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
  LegalNote,
  PhoneField,
  TrustNote,
  classifyAuthError,
  useFieldErrors,
} from "@/components/ml/auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/auth/phone")({
  head: () => ({
    meta: [
      { title: "Sign in — MusicLinkd" },
      {
        name: "description",
        content: "Sign in to MusicLinkd with your mobile number and a one-time code.",
      },
      { property: "og:title", content: "Sign in — MusicLinkd" },
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
      <div className="rounded-lg bg-card p-5 border border-border/80 shadow-xs">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && provider !== "off") void send();
          }}
        >
          <AuthHeading
            title="Sign in with Mobile"
            sub="Enter your 10-digit mobile number and we'll text you a 6-digit code."
          />

          {provider === "off" ? (
            <AuthNotice tone="info" title="Mobile sign-in isn't switched on yet">
              Sign in with email or Google for now.
            </AuthNotice>
          ) : null}
          {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

          <PhoneField
            value={digits}
            onChange={setDigits}
            onBlur={() => fields.touch("phone")}
            error={fields.errorFor("phone", phoneProblem)}
          />

          <Btn
            type="submit"
            className="mt-2 w-full h-12 text-sm font-semibold shadow-xs"
            loading={busy}
            disabled={provider === "off"}
          >
            Send Verification Code
          </Btn>
        </form>

        <TrustNote>Your number is never shown on your public profile.</TrustNote>
      </div>

      <p className="mt-6 flex justify-center text-sm">
        <AuthLink
          to="/auth"
          icon={<Mail size={iconSize.sm} />}
          className="font-semibold text-foreground"
        >
          Sign in with Email instead
        </AuthLink>
      </p>

      <LegalNote />
    </AuthScreen>
  );
}
