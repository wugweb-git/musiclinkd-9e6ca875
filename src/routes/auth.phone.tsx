import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthNotice, AuthScreen, LabeledInput, TrustNote } from "@/components/ml/auth";

export const Route = createFileRoute("/auth/phone")({
  head: () => ({
    meta: [
      { title: "Continue with phone — MusicLinkd" },
      { name: "description", content: "Sign in to MusicLinkd with your mobile number and a one-time code." },
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

  return (
    <AuthScreen>
      <AuthHeading
        title="Continue with phone"
        sub="We'll text you a 6-digit code. No password to remember."
      />

      <div className="mb-4 flex gap-2">
        <span className="flex h-13 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-[15px] font-semibold">
          +91
        </span>
        <div className="min-w-0 flex-1">
          <LabeledInput
            label="Mobile number"
            value={phone}
            onChange={setPhone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
          />
        </div>
      </div>

      <AuthNotice tone="info" title="Preview mode">
        SMS delivery is not enabled on this build — continue to see the code screen.
      </AuthNotice>

      <Btn
        className="w-full"
        disabled={!ok}
        onClick={() => void navigate({ to: "/auth/otp", search: { phone: digits } })}
      >
        Send code
      </Btn>

      <TrustNote>Your number is never shown on your public profile.</TrustNote>

      <p className="mt-6 text-center text-[12.5px] text-text2">
        <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
          Use email instead
        </Link>
      </p>
    </AuthScreen>
  );
}
