import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Plus, Smartphone } from "lucide-react";

import { Btn } from "@/components/ml/ui";
import { AuthScreen, LegalNote } from "@/components/ml/auth";
import { LogoMark } from "@/components/ml/logo";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

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
 * PLACEHOLDER FIGURES — these are not measured. They are transcribed from the
 * original design comp and the database does not support them. Wire them to a
 * real count or cut the block before this screen faces the public; shipping them
 * as-is is a marketing claim we cannot substantiate.
 */
const stats = [
  { value: "12,000+", label: "Musicians" },
  { value: "3,500+", label: "Studios" },
  { value: "800+", label: "Labels & Agencies" },
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

function WelcomeScreen() {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/feed" });
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
    void navigate({ to: "/feed" });
  }

  return (
    <AuthScreen brand={false}>
      <div className="flex min-h-[calc(100dvh-72px)] flex-col">
        <div className="flex items-center justify-center gap-2 pb-10 pt-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-sm"
            style={{ background: "var(--primary)" }}
          >
            <LogoMark className="h-auto w-5 text-primary-foreground" />
          </span>
          <span className="text-2 font-semibold tracking-tight">MusicLinkd</span>
        </div>

        <div className="flex-1">
          <h2 className="text-3 font-bold tracking-tight">MusicLinkd</h2>
          <p className="mt-0.5 text-2 font-semibold text-primary">Professional Network For Music</p>

          <h1 className="mt-6 text-4 font-bold leading-[1.06] tracking-tight">
            Connect.
            <br />
            Collaborate.
            <br />
            Create.
          </h1>

          <p className="mt-4 text-2 leading-relaxed text-text2">
            Build your profile, discover opportunities, connect with the music industry.
          </p>

          <ul className="mt-8 space-y-4">
            {stats.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary"
                  style={{ background: "var(--pink-container)" }}
                >
                  <Plus size={13} aria-hidden />
                </span>
                <span className="min-w-0 text-2">
                  <span className="font-bold">{s.value}</span>{" "}
                  <span className="text-text2">{s.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 space-y-3">
          <Btn
            variant="outline"
            className="w-full gap-2"
            disabled={busy}
            onClick={() => void google()}
          >
            <GoogleIcon />
            Continue with Google
          </Btn>

          <Btn
            variant="navy"
            className="w-full gap-2"
            onClick={() => void navigate({ to: "/auth/phone" })}
          >
            <Smartphone size={17} aria-hidden />
            Continue with Mobile
          </Btn>

          <Btn
            variant="ghost"
            className="w-full gap-2"
            onClick={() => void navigate({ to: "/auth", search: { mode: "signup" } })}
          >
            <Mail size={17} aria-hidden />
            Continue with Email &amp; Password
          </Btn>

          <LegalNote />
        </div>
      </div>
    </AuthScreen>
  );
}
