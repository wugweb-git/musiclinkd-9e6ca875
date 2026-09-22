import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogoMark } from "@/components/ml/logo";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, syncIdentityFromProvider } from "@/lib/portfolio.functions";
import { postAuthTarget } from "@/lib/post-auth";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// App start. The session lives in the browser, so the server renders the splash and the client
// routes: a saved sign-in goes to Home, or to onboarding until the profile is complete; everyone
// else goes to Welcome. Every sign-in path (password, Google, email link, phone) returns here. On
// Android the native splash covers this screen.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MusicLinkd" },
      {
        name: "description",
        content: "India's professional network for the music industry.",
      },
    ],
  }),
  component: SessionCheck,
});

function SessionCheck() {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const syncIdentity = useServerFn(syncIdentityFromProvider);
  const mountedAt = useRef(Date.now());
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (loading) return;
    let active = true;
    // Hold for the mark's entrance, never past 2 seconds (owner, 16 Sep); a slow session read is
    // not held further.
    const hold = reducedMotion
      ? 0
      : Math.min(2000, Math.max(0, 900 - (Date.now() - mountedAt.current)));
    const go = (to: "/welcome" | "/home" | ReturnType<typeof postAuthTarget>) =>
      window.setTimeout(() => {
        if (active) void navigate({ to, replace: true });
      }, hold);
    if (!signedIn) {
      go("/welcome");
      return () => {
        active = false;
      };
    }
    // Google gives a name and photo; the signup trigger only captures them for a brand-new user,
    // so every sign-in fills whichever of the two is still empty before the profile is read.
    syncIdentity()
      .catch(() => null)
      .then(() => loadProfile())
      // A row-less read routes to onboarding, so it has to be trusted — but a returning user's
      // row always exists; a null here on the first try is as likely to be the auth session still
      // settling as it is a genuinely new signup. One retry tells them apart without a real user
      // ever seeing the onboarding chooser they'd already finished.
      .then((profile) => (profile ? profile : loadProfile()))
      .then((profile) => go(postAuthTarget(profile)))
      // Offline or a failed read: Home still works from the local session.
      .catch(() => go("/home"));
    return () => {
      active = false;
    };
  }, [loading, signedIn, navigate, loadProfile, syncIdentity, reducedMotion]);

  return (
    // Full-bleed brand ground with the mark in white: the one screen where pink carries everything.
    <div
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden brand-ground px-8"
      role="status"
      aria-label="Checking your session"
    >
      {/* Concentric pulsing sonic aura rings (Shazam / Apple Music audio resonance) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="absolute h-56 w-56 rounded-full border border-white/25 animate-sonar" />
        <span
          className="absolute h-56 w-56 rounded-full border border-white/20 animate-sonar"
          style={{ animationDelay: "700ms" }}
        />
        <span
          className="absolute h-56 w-56 rounded-full border border-white/15 animate-sonar"
          style={{ animationDelay: "1400ms" }}
        />
        <span
          className="absolute h-56 w-56 rounded-full border border-white/10 animate-sonar"
          style={{ animationDelay: "2100ms" }}
        />
        <span className="absolute h-80 w-80 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />
      </div>

      {/* Main Brand Hero */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Waveform Logo Mark with acoustic glow */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-full bg-white/15 blur-2xl animate-pulse-glow"
          />
          <LogoMark className="vt-brand relative z-10 w-44 max-w-[260px] animate-waveform text-white [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.28))]" />
        </div>

        {/* Brand Name */}
        <h1 className="mt-6 text-4 font-bold tracking-tight text-white animate-rise [filter:drop-shadow(0_4px_12px_rgba(0,0,0,0.18))]">
          MusicLinkd
        </h1>

        {/* Product Line / Tagline */}
        <p
          className="mt-2 max-w-prose-sm text-sm font-medium leading-relaxed tracking-wide text-white/90 animate-rise"
          style={{ animationDelay: "120ms" }}
        >
          India's professional network for the music industry
        </p>

        {/* Acoustic sound equalizer status indicator */}
        <div
          aria-hidden
          className="mt-8 flex items-center gap-1.5 opacity-90 animate-rise"
          style={{ animationDelay: "240ms" }}
        >
          <span className="w-1 rounded-full bg-white/75 animate-eq-1" />
          <span className="w-1 rounded-full bg-white/90 animate-eq-2" />
          <span className="w-1 rounded-full bg-white animate-eq-3" />
          <span className="w-1 rounded-full bg-white/90 animate-eq-2" />
          <span className="w-1 rounded-full bg-white/75 animate-eq-1" />
        </div>
      </div>
    </div>
  );
}
