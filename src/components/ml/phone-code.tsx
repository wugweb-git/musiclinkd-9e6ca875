import { useState } from "react";
import { Pencil, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthComposition,
  AuthFooter,
  AuthNotice,
  AuthScreen,
  AuthSurface,
  AuthTextButton,
  CodeInput,
  classifyAuthError,
  formatIndianMobile,
  useCountdown,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { iconSize } from "@/lib/tokens";
import { ISD_CODE } from "@/lib/validation";

/*
 * The SMS code step: mobile is verified by a 6-digit code (owner, 4 Oct 2026; email uses a link).
 * One copy, used by mobile sign-in/sign-up (/auth/phone) and by password recovery (/auth/forgot),
 * with its own states: the code, "That code did not match", resend after 30 s, Change Number.
 */
export function PhoneCodeStep({
  phone,
  onChangeNumber,
  onVerified,
  createUser = true,
}: {
  phone: string;
  onChangeNumber: () => void;
  /** After the code is accepted and the session exists. */
  onVerified: () => void;
  /** A resend may create the account (sign-in/sign-up); off for password recovery. */
  createUser?: boolean | undefined;
}) {
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
      const m = err.message.toLowerCase();
      setError(
        m.includes("expired")
          ? {
              title: "This code has expired",
              body: "Send a new code, then enter the latest one we send.",
            }
          : m.includes("invalid")
            ? {
                title: "That code is not valid",
                body: "Check all six digits and try again, or send a new code.",
              }
            : classifyAuthError(err.message),
      );
      return;
    }
    haptic("confirm");
    onVerified();
  }

  async function resend() {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
      options: { shouldCreateUser: createUser },
    });
    if (err) {
      setError(classifyAuthError(err.message));
      return;
    }
    countdown.restart();
    toast.success("New code sent");
  }

  return (
    <AuthScreen back={{ to: "/welcome" }}>
      <AuthComposition footer={<AuthFooter />}>
        <AuthSurface>
          <AuthHeading
            title="Enter verification code"
            sub={
              phone
                ? `We sent a 6-digit one-time code to ${ISD_CODE} ${formatIndianMobile(phone)}`
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
            className="h-12 w-full text-2 font-medium"
            loading={busy}
            disabled={code.length !== 6 || !phone}
            onClick={() => void verify(code)}
          >
            Verify code
          </Btn>

          <p className="mt-4 flex justify-center text-1 text-muted-foreground">
            {countdown.seconds > 0 ? (
              <span aria-live="polite" className="min-h-touch inline-flex items-center font-medium">
                Send again in 0:{String(countdown.seconds).padStart(2, "0")}
              </span>
            ) : (
              <AuthTextButton
                icon={<RotateCw size={iconSize.sm} />}
                onClick={() => void resend()}
                className="font-medium hover:text-foreground"
              >
                Resend code
              </AuthTextButton>
            )}
          </p>
        </AuthSurface>

        <p className="mt-4 flex items-center justify-center gap-6 text-sm">
          <AuthTextButton
            icon={<Pencil size={iconSize.sm} />}
            onClick={onChangeNumber}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            Change number
          </AuthTextButton>
        </p>
      </AuthComposition>
    </AuthScreen>
  );
}
