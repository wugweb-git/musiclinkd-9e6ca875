import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Trash2 } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Loading } from "@/components/ml/kit";
import { QrCode } from "@/components/ml/qr";
import { supabase } from "@/integrations/supabase/client";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/settings/security/2fa")({
  head: () => ({
    meta: [
      { title: "Two-step verification | MusicLinkd" },
      {
        name: "description",
        content: "Add an authenticator app as a second step when you sign in.",
      },
      { property: "og:title", content: "Two-step verification | MusicLinkd" },
      { property: "og:description", content: "Set up or remove two-step verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TwoStep,
});

/*
 * Real, native Supabase Auth MFA (TOTP) — supabase.auth.mfa.enroll/challenge/verify/unenroll.
 * Runs entirely against the signed-in browser session; no server function or new table needed.
 */
function TwoStep() {
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<{ id: string } | null>(null);
  const [enrolling, setEnrolling] = useState<{
    factorId: string;
    uri: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error) {
      setFactor(data.totp[0] ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function startEnroll() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setEnrolling({ factorId: data.id, uri: data.totp.qr_code, secret: data.totp.secret });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start that — try again");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    if (!enrolling) return;
    setBusy(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrolling.factorId,
      });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;
      toast.success("Two-step verification is on");
      setEnrolling(null);
      setCode("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That code didn't match — try again");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!factor) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) throw error;
      toast.success("Two-step verification is off");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove that — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Two-step verification" back="/settings/security" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        {loading ? (
          <Loading rows={2} />
        ) : enrolling ? (
          <Card className="space-y-4">
            <p className="text-1 text-muted-foreground">
              Scan this with an authenticator app (Google Authenticator, Authy, 1Password), then
              enter the 6-digit code it shows.
            </p>
            <div className="flex justify-center">
              <QrCode value={enrolling.uri} size={180} />
            </div>
            <p className="break-all text-center text-1 text-muted-foreground">
              Can't scan? Enter this key: {enrolling.secret}
            </p>
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="h-13 w-full rounded-full border border-border bg-card px-5 text-center text-lg tracking-[0.3em] outline-none focus:border-primary"
            />
            <Btn
              className="w-full"
              disabled={code.trim().length < 6 || busy}
              onClick={() => void confirmEnroll()}
            >
              {busy ? "Verifying…" : "Confirm"}
            </Btn>
            <Btn variant="ghost" className="w-full" onClick={() => setEnrolling(null)}>
              Cancel
            </Btn>
          </Card>
        ) : factor ? (
          <Card className="flex items-center gap-3">
            <ShieldCheck size={iconSize.lg} className="shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Two-step verification is on</p>
              <p className="text-1 text-muted-foreground">
                An authenticator app is required at sign-in.
              </p>
            </div>
            <Btn variant="outline" disabled={busy} onClick={() => void remove()}>
              <Trash2 size={iconSize.sm} className="mr-1.5" /> Remove
            </Btn>
          </Card>
        ) : (
          <Card className="space-y-3">
            <p className="text-1 text-muted-foreground">
              Add a code from an authenticator app as a second step when you sign in.
            </p>
            <Btn className="w-full" disabled={busy} onClick={() => void startEnroll()}>
              Set Up
            </Btn>
          </Card>
        )}
      </div>
    </Screen>
  );
}
