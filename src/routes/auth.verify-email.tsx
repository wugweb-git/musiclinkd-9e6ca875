import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, RotateCw } from "lucide-react";
import { toast } from "sonner";
import {
  AuthHeading,
  AuthComposition,
  AuthFooter,
  AuthLink,
  AuthNotice,
  AuthScreen,
  AuthSurface,
  AuthTextButton,
  TrustNote,
  classifyAuthError,
  useCountdown,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { emailLinkTarget } from "@/lib/post-auth";
import { iconSize } from "@/lib/tokens";

/*
 * Check your email: email is verified by link, never by a code (owner, 4 Oct 2026; mobile is the
 * one that uses a code). Reached after sign-up, after "Sign in with email", and from login when an
 * account was never confirmed. Opening the link signs the person in at `/`, and the splash sends a
 * new account to onboarding. If the link is opened in another tab of the same browser, the session
 * arrives here too, and this screen moves on by itself.
 */
type Search = { email: string };

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    email: typeof search["email"] === "string" ? search["email"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — MusicLinkd" },
      {
        name: "description",
        content: "Open the link we emailed you to continue to MusicLinkd.",
      },
      { property: "og:title", content: "Verify your email — MusicLinkd" },
      { property: "og:description", content: "Confirm your email to finish creating your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const countdown = useCountdown(30);

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/", replace: true });
  }, [loading, signedIn, navigate]);

  async function resend() {
    if (!email) {
      void navigate({ to: "/signup" });
      return;
    }
    setError(null);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: emailLinkTarget() },
    });
    if (err) {
      setError(classifyAuthError(err.message));
      return;
    }
    countdown.restart();
    toast.success("New link sent");
  }

  return (
    <AuthScreen back={{ to: "/welcome" }}>
      <AuthComposition footer={<AuthFooter />}>
          <AuthSurface>
            <AuthHeading
              title="Verify your email"
              sub={
                email
                  ? `Open the link we sent to ${email} to continue.`
                  : "Open the link we emailed you to continue."
              }
            />

            {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}

            <p className="mt-1 flex justify-center text-1 text-muted-foreground">
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
                   Resend verification email
                </AuthTextButton>
              )}
            </p>

            <TrustNote>Not there? Check spam and promotions.</TrustNote>
          </AuthSurface>

          <p className="mt-3.5 flex justify-center text-1">
            <AuthLink
              to="/signup"
              icon={<Pencil size={iconSize.sm} />}
              className="font-medium text-muted-foreground hover:text-foreground"
            >
                Change email
            </AuthLink>
          </p>
      </AuthComposition>
    </AuthScreen>
  );
}
