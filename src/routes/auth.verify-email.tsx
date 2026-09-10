import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthNotice, AuthScreen, TrustNote } from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";

type Search = { email: string };

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    email: typeof search["email"] === "string" ? search["email"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Confirm your email — MusicLinkd" },
      {
        name: "description",
        content: "Confirm your email address to activate your MusicLinkd account.",
      },
      { property: "og:title", content: "Confirm your email — MusicLinkd" },
      { property: "og:description", content: "One tap and your MusicLinkd account is ready." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function resend() {
    if (!email) {
      void navigate({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthScreen>
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl"
        style={{ background: "var(--pink-container)" }}
      >
        <MailCheck size={24} className="text-primary" />
      </div>
      <AuthHeading
        title="Check your email"
        sub={
          email
            ? `We sent a confirmation link to ${email}. Open it to activate your account.`
            : "We sent you a confirmation link. Open it to activate your account."
        }
      />

      {sent ? (
        <AuthNotice tone="success" title="Link sent again">
          Give it a minute to arrive.
        </AuthNotice>
      ) : null}

      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="text-[13px] font-semibold">Not arrived?</p>
        <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-text2">
          <li>• Check spam and promotions folders.</li>
          <li>• Make sure the address above is spelled correctly.</li>
          <li>• Links expire after 24 hours — resend a fresh one.</li>
        </ul>
      </div>

      <div className="mt-6 space-y-3">
        <Btn className="w-full" onClick={() => void resend()} disabled={busy}>
          {busy ? "Sending…" : "Resend confirmation link"}
        </Btn>
        <Btn
          variant="outline"
          className="w-full"
          onClick={() => void navigate({ to: "/auth", search: { mode: "signup" } })}
        >
          Use a different email
        </Btn>
      </div>

      <TrustNote>We only email you about your account and things you asked for.</TrustNote>

      <p className="mt-6 text-center text-[12.5px] text-text2">
        Already confirmed?{" "}
        <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </AuthScreen>
  );
}
