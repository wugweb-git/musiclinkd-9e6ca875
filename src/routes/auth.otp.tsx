import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthNotice, AuthScreen } from "@/components/ml/auth";

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
  const [error, setError] = useState<string | null>(null);
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

      {error ? <AuthNotice title="That code did not match">{error}</AuthNotice> : null}

      <button
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="mb-6 flex w-full justify-between gap-2"
        aria-label="Enter verification code"
      >
        {cells.map((i) => (
          <span
            key={i}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl border bg-card text-[20px] font-semibold"
            style={{
              borderColor: i === code.length ? "var(--primary)" : "var(--border)",
            }}
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
        disabled={code.length !== 6}
        onClick={() =>
          setError("Phone sign-in is not enabled on this build. Continue with email or Google.")
        }
      >
        Verify and continue
      </Btn>

      <div className="mt-5 text-center text-1 text-text2">
        {seconds > 0 ? (
          <span>Resend code in 0:{String(seconds).padStart(2, "0")}</span>
        ) : (
          <button
            type="button"
            onClick={() => setSeconds(30)}
            className="font-semibold text-primary"
          >
            Resend code
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-1 text-text2">
        <button
          type="button"
          onClick={() => void navigate({ to: "/auth/phone" })}
          className="font-semibold text-primary"
        >
          Change number
        </button>
        <span className="mx-2 text-border">|</span>
        <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
          Use email
        </Link>
      </p>
    </AuthScreen>
  );
}
