import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Pencil, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthLink,
  AuthNotice,
  AuthScreen,
  AuthTextButton,
  CodeInput,
  LegalNote,
  classifyAuthError,
  formatIndianMobile,
  useCountdown,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { iconSize } from "@/lib/tokens";

type Search = { phone: string };

export const Route = createFileRoute("/auth/otp")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    // The router parses a digits-only query value as a number; accept both.
    phone:
      typeof search["phone"] === "string" || typeof search["phone"] === "number"
        ? String(search["phone"])
        : "",
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
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // Bumped on each failed code so the row re-mounts and the shake replays.
  const [misses, setMisses] = useState(0);
  const countdown = useCountdown(30);

  async function verify(token: string) {
    if (!phone || busy) return;
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token,
      type: "sms",
    });
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
              body: "Check the text message, or send a new code.",
            }
          : classifyAuthError(err.message),
      );
      return;
    }
    haptic("confirm");
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
    countdown.restart();
    toast.success("New code sent");
  }

  return (
    <AuthScreen back={{ to: "/auth/phone" }}>
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="my-auto">
          <div className="rounded-lg bg-card p-5 border border-border/80 shadow-xs">
            <AuthHeading
              title="Verify your number"
              sub={
                phone
                  ? `We sent a 6-digit one-time code to +91 ${formatIndianMobile(phone)}`
                  : "Enter the 6-digit code we sent you."
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
            />

            <Btn
              className="w-full h-12 text-sm font-semibold shadow-xs"
              loading={busy}
              disabled={code.length !== 6 || !phone}
              onClick={() => void verify(code)}
            >
              Verify & Continue
            </Btn>

            <p className="mt-5 flex justify-center text-1 text-muted-foreground">
              {countdown.seconds > 0 ? (
                <span aria-live="polite" className="rounded-full bg-subtle px-3 py-1 font-medium">
                  Resend code in 0:{String(countdown.seconds).padStart(2, "0")}
                </span>
              ) : (
                <AuthTextButton
                  icon={<RotateCw size={iconSize.sm} />}
                  onClick={() => void resend()}
                  className="rounded-full bg-subtle px-3 py-1 font-medium hover:text-foreground"
                >
                  Resend Code Now
                </AuthTextButton>
              )}
            </p>
          </div>

          <p className="mt-5 flex items-center justify-center gap-6 text-sm">
            <AuthLink
              to="/auth/phone"
              icon={<Pencil size={iconSize.sm} />}
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              Change Number
            </AuthLink>
            <AuthLink
              to="/auth"
              icon={<Mail size={iconSize.sm} />}
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              Use Email
            </AuthLink>
          </p>
        </div>

        <div className="shrink-0 pt-2 text-center">
          <LegalNote className="mt-0" />
        </div>
      </div>
    </AuthScreen>
  );
}
