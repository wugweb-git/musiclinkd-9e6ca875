import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Mail, Plus, Smartphone } from "lucide-react";

import { AuthScreen, LegalNote } from "@/components/ml/auth";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to MusicLinkd — India's music industry network" },
      {
        name: "description",
        content:
          "Join MusicLinkd to showcase your work, find collaborators, book studios and hire music professionals across India.",
      },
      { property: "og:title", content: "Welcome to MusicLinkd" },
      {
        property: "og:description",
        content: "The professional network and marketplace for India's music industry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WelcomeScreen,
});

/**
 * What is on the platform, not how much of it.
 *
 * The comp carried "12,000+ Musicians / 3,500+ Studios / 800+ Labels & Agencies".
 * Those figures were transcribed from a design mockup and nothing in the database
 * supports them, so they are not shipped: they would be an unsubstantiated claim
 * made to real users on the first screen they see.
 *
 * If real counts land, this is where they go — add a `value` and the render can
 * put it back in a bold span ahead of the label.
 */
const audience = [
  "Singers, session musicians and producers",
  "Recording studios and rehearsal rooms",
  "Labels, agencies and venues",
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * The comp's CTA treatment is not the Btn vocabulary: two of the three entries
 * are borderless rows and the primary is a rounded rectangle rather than a pill.
 * Built here on the system's own radius step and the 48dp touch floor instead of
 * bending Btn, whose rounded-full is load-bearing on every other screen.
 *
 * Filled uses --foreground, the app's near-black. The design guide's rule is
 * "black is the primary button, not pink". --foreground is the same near-black as --ink.
 */
function CtaRow({
  children,
  onClick,
  filled = false,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  filled?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-2 font-semibold transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
        filled ? "bg-foreground text-background" : "text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

function WelcomeScreen() {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/", replace: true });
  }, [loading, signedIn, navigate]);

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      // Hand off to /auth, which owns the full error surface for sign-in.
      void navigate({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/", replace: true });
  }

  return (
    <AuthScreen brand={false} className="bg-card">
      <div className="flex min-h-[calc(100dvh-72px)] flex-col">
        <div className="flex-1 pt-4">
          <h2 className="text-3 font-bold">MusicLinkd</h2>
          <p className="mt-1 text-2 font-semibold text-pink-strong">
            Professional Network For Music
          </p>

          <h1 className="mt-7 text-5 font-bold">
            Connect.
            <br />
            Collaborate.
            <br />
            Create.
          </h1>

          <p className="mt-5 text-2 leading-relaxed text-muted-foreground">
            Build your profile, discover opportunities, connect with the music industry.
          </p>

          <ul className="mt-9 space-y-4">
            {audience.map((a) => (
              <li key={a} className="flex items-center gap-3">
                <Plus size={14} className="shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 text-2 text-muted-foreground">{a}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <CtaRow onClick={() => void google()} disabled={busy}>
            <GoogleIcon />
            Continue with Google
          </CtaRow>

          <CtaRow filled className="my-2" onClick={() => void navigate({ to: "/auth/phone" })}>
            <Smartphone size={17} aria-hidden />
            Continue with Mobile
          </CtaRow>

          <CtaRow onClick={() => void navigate({ to: "/auth", search: { mode: "signup" } })}>
            <Mail size={17} aria-hidden />
            Continue with Email &amp; Password
          </CtaRow>

          <p className="mt-5 text-center text-1 text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-pink-strong">
              Sign in
            </Link>
          </p>

          <LegalNote />
        </div>
      </div>
    </AuthScreen>
  );
}
