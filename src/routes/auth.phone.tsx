import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Btn } from "@/components/ml/ui";
import { supabase } from "@/integrations/supabase/client";
import { usePhoneSignIn } from "@/lib/post-auth";
import {
  AuthHeading,
  AuthNotice,
  AuthScreen,
  LabeledInput,
  TrustNote,
  classifyAuthError,
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
  const [phone, setPhone] = useState("");
  const digits = phone.replace(/\D/g, "");
  const ok = digits.length === 10;
  const provider = usePhoneSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);

  async function send() {
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
    setBusy(false);
    if (err) {
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
          if (ok && !busy && provider !== "off") void send();
        }}
      >
        <AuthHeading
          title="Continue with phone"
          sub="We'll text you a 6-digit code. No password to remember."
        />

        <div className="mb-4 flex gap-2">
          <span className="flex h-13 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-card text-2 font-semibold">
            +91
          </span>
          <div className="min-w-0 flex-1">
            <LabeledInput
              label="Mobile number"
              value={phone}
              onChange={setPhone}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              enterKeyHint="go"
              placeholder="98765 43210"
            />
          </div>
        </div>

        {provider === "off" ? (
          <AuthNotice tone="info" title="Phone sign-in is not available yet">
            Continue with Google or email for now.
          </AuthNotice>
        ) : null}
        {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

        <Btn type="submit" className="w-full" disabled={!ok || busy || provider === "off"}>
          Send code
        </Btn>
      </form>

      <TrustNote>Your number is never shown on your public profile.</TrustNote>

      <p className="mt-6 text-center text-1 text-muted-foreground">
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="hit-area font-semibold text-foreground"
        >
          Use email instead
        </Link>
      </p>
    </AuthScreen>
  );
}
