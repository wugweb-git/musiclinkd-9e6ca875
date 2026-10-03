import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Pencil, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "@/components/ml/ui";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { usePhoneSignIn } from "@/lib/post-auth";
import {
  AuthHeading,
  AuthLink,
  AuthNotice,
  AuthScreen,
  AuthTextButton,
  CodeInput,
  LegalNote,
  PhoneField,
  TrustNote,
  classifyAuthError,
  formatIndianMobile,
  useCountdown,
  useFieldErrors,
} from "@/components/ml/auth";
import { ISD_CODE } from "@/lib/validation";
import { iconSize } from "@/lib/tokens";

import { MadeByWugweb } from "@/components/ml/kit";
import { PhoneCodeStep } from "@/components/ml/phone-code";

/*
 * Mobile sign-in and sign-up: one screen, two steps (owner, 4 Oct 2026: phone and code are states of
 * the same screen). Step one takes the number and texts a 6-digit code; step two takes the code,
 * with its own error ("That code did not match"), resend and Change Number. A new number creates the
 * account, and the splash then sends it to onboarding. /auth/otp only redirects here.
 */
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
  // The number the code was sent to; set, the screen shows its code step.
  const [sentTo, setSentTo] = useState<string | null>(null);
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
    setSentTo(digits);
  }

  if (sentTo)
    return (
      <PhoneCodeStep
        phone={sentTo}
        onChangeNumber={() => setSentTo(null)}
        // The splash sends a new account to onboarding and a finished one to Discover.
        onVerified={() => void navigate({ to: "/", replace: true })}
      />
    );

  return (
    <AuthScreen back={{ to: "/welcome" }}>
      <div className="flex flex-1 min-h-0 flex-col justify-between overflow-hidden">
        <div className="my-auto py-1">
          <div className="rounded-lg bg-card p-4 sm:p-5 border border-border/80 shadow-xs">
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

          <p className="mt-4 flex justify-center text-1">
            <AuthLink
              to="/auth"
              icon={<Mail size={iconSize.sm} />}
              className="font-semibold text-foreground"
            >
              Sign in with Email instead
            </AuthLink>
          </p>
        </div>

        <div className="shrink-0 pt-1 text-center">
          <LegalNote className="mt-0" />
          <div className="mt-0.5">
            <MadeByWugweb />
          </div>
        </div>
      </div>
    </AuthScreen>
  );
}
