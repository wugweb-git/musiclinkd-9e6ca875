import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthNotice, AuthScreen, classifyAuthError } from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";

type Search = { phone: string };

export const Route = createFileRoute("/auth/otp")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    phone: typeof search["phone"] === "string" ? search["phone"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Enter your code — MusicLinkd" },
      {
        name: "description",
        content: "Enter the 6-digit code we texted you to finish signing in to MusicLinkd.",
      },
      { property: "og:title", content: "Enter your code — MusicLinkd" },
      { property: "og:description", content: "Verify your number and continue to MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OtpScreen,
});

function OtpScreen() {
  const { phone } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify() {
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: code,
      type: "sms",
    });
    setBusy(false);
    if (err) {
      const m = err.message.toLowerCase();
      setError(
        m.includes("expired") || m.includes("invalid")
          ? { title: "That code did not match", body: "Check the code, or send a new one." }
          : classifyAuthError(err.message),
      );
      return;
    }
    // The splash sends a new account to onboarding and a finished one to Home.
    void navigate({ to: "/", replace: true });
  }

  async function resend() {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
    if (err) {
      setError(classifyAuthError(err.message));
      return;
    }
    setSeconds(30);
  }
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const cells = [0, 1, 2, 3, 4, 5];

  return (
    <AuthScreen>
      <AuthHeading
        title="Enter your code"
        sub={
          phone
            ? `Sent to +91 ${phone.slice(0, 5)} ${phone.slice(5)}`
            : "Enter the 6-digit code we sent you."
        }
      />

      {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

      <button
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="mb-6 flex w-full justify-between gap-2"
        aria-label="Enter verification code"
      >
        {cells.map((i) => (
          <span
            key={i}
            className={`flex h-14 flex-1 items-center justify-center rounded-md border bg-card text-3 font-semibold ${i === code.length ? "border-primary" : "border-border"}`}
          >
            {code[i] ?? ""}
          </span>
        ))}
      </button>

      <input
        ref={inputRef}
        value={code}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        onChange={(e) => {
          setError(null);
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
        }}
        className="sr-only"
        aria-label="6-digit code"
      />

      <Btn
        className="w-full"
        disabled={code.length !== 6 || busy || !phone}
        onClick={() => void verify()}
      >
        Verify and continue
      </Btn>

      <div className="mt-5 text-center text-1 text-muted-foreground">
        {seconds > 0 ? (
          <span>Resend code in 0:{String(seconds).padStart(2, "0")}</span>
        ) : (
          <button
            type="button"
            onClick={() => void resend()}
            className="font-semibold text-pink-strong"
          >
            Resend code
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-1 text-muted-foreground">
        <button
          type="button"
          onClick={() => void navigate({ to: "/auth/phone" })}
          className="font-semibold text-pink-strong"
        >
          Change number
        </button>
        <span className="mx-2 text-border">|</span>
        <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-pink-strong">
          Use email
        </Link>
      </p>
    </AuthScreen>
  );
}
