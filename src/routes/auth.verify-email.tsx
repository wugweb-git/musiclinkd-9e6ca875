import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthLink,
  AuthNotice,
  AuthScreen,
  AuthTextButton,
  CodeInput,
  TrustNote,
  classifyAuthError,
  useCountdown,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { iconSize } from "@/lib/tokens";

type Search = { email: string };

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    email: typeof search["email"] === "string" ? search["email"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Enter your email code — MusicLinkd" },
      {
        name: "description",
        content: "Enter the 6-digit code we emailed you to sign in to MusicLinkd.",
      },
      { property: "og:title", content: "Enter your email code — MusicLinkd" },
      { property: "og:description", content: "One code and you're signed in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const [misses, setMisses] = useState(0);
  const countdown = useCountdown(30);

  async function verify(token: string) {
    if (!email || busy) return;
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setBusy(false);
    if (err) {
      haptic("error");
      setMisses((n) => n + 1);
      setCode("");
      const m = err.message.toLowerCase();
      setError(
        m.includes("expired") || m.includes("invalid")
          ? {
              title: "That code did not match",
              body: "Check the latest email, or send a new code.",
            }
          : classifyAuthError(err.message),
      );
      return;
    }
    haptic("confirm");
    // Verified and signed in: the splash takes a new account into onboarding.
    void navigate({ to: "/", replace: true });
  }

  async function resend() {
    if (!email) {
      void navigate({ to: "/auth" });
      return;
    }
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (err) {
      setError(classifyAuthError(err.message));
      return;
    }
    countdown.restart();
    toast.success("New code sent");
  }

  return (
    <AuthScreen back={{ to: "/auth" }}>
      <AuthHeading
        title="Check your email"
        sub={
          email
            ? `Enter the 6-digit code we sent to ${email}.`
            : "Enter the 6-digit code we emailed you."
        }
      />

      {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

      <CodeInput
        value={code}
        onChange={(v) => {
          setError(null);
          setCode(v);
        }}
        onComplete={(v) => void verify(v)}
        invalid={Boolean(error)}
        shakeKey={misses}
        label="Email code"
      />

      <Btn
        className="w-full"
        loading={busy}
        disabled={code.length !== 6 || !email}
        onClick={() => void verify(code)}
      >
        Verify and Continue
      </Btn>

      <p className="mt-5 flex justify-center text-1 text-muted-foreground">
        {countdown.seconds > 0 ? (
          <span aria-live="polite">
            Resend Code in 0:{String(countdown.seconds).padStart(2, "0")}
          </span>
        ) : (
          <AuthTextButton icon={<RotateCw size={iconSize.sm} />} onClick={() => void resend()}>
            Resend Code
          </AuthTextButton>
        )}
      </p>

      <TrustNote>Not there? Check spam and promotions.</TrustNote>

      <p className="mt-6 flex justify-center text-1">
        <AuthLink to="/auth" icon={<Pencil size={iconSize.sm} />}>
          Use a Different Email
        </AuthLink>
      </p>
    </AuthScreen>
  );
}
