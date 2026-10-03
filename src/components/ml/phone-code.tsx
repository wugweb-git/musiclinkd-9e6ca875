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
import { MadeByWugweb } from "@/components/ml/kit";
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
  useEmailLink = true,
}: {
  phone: string;
  onChangeNumber: () => void;
  /** After the code is accepted and the session exists. */
  onVerified: () => void;
  /** A resend may create the account (sign-in/sign-up); off for password recovery. */
  createUser?: boolean | undefined;
  /** Show "Use Email" beside Change Number. */
  useEmailLink?: boolean | undefined;
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
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col py-8 sm:py-12">
        <div className="flex flex-col pt-8 sm:pt-10">
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
            <AuthHeading
              title="Verify your number"
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
              className="h-12 w-full text-sm font-semibold"
              loading={busy}
              disabled={code.length !== 6 || !phone}
              onClick={() => void verify(code)}
            >
              Verify & Continue
            </Btn>

            <p className="mt-4 flex justify-center text-1 text-muted-foreground">
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

          <p className="mt-4 flex items-center justify-center gap-6 text-sm">
            <AuthTextButton
              icon={<Pencil size={iconSize.sm} />}
              onClick={onChangeNumber}
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              Change Number
            </AuthTextButton>
            {useEmailLink ? (
              <AuthLink
                to="/auth"
                icon={<Mail size={iconSize.sm} />}
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                Use Email
              </AuthLink>
            ) : null}
          </p>
        </div>

        <div className="mt-auto shrink-0 pb-1 pt-8 text-center">
          <LegalNote className="mt-0" />
          <div className="mt-0.5">
            <MadeByWugweb />
          </div>
        </div>
      </div>
    </AuthScreen>
  );
}
