import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogoMark } from "@/components/ml/logo";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import { postAuthTarget } from "@/lib/post-auth";

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
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (loading) return;
    let active = true;
    // Hold for the mark's entrance, never past 2 seconds (owner, 16 Sep); a slow session read is
    // not held further.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduced ? 0 : Math.min(2000, Math.max(0, 900 - (Date.now() - mountedAt.current)));
    const go = (to: "/welcome" | "/feed" | ReturnType<typeof postAuthTarget>) =>
      window.setTimeout(() => {
        if (active) void navigate({ to, replace: true });
      }, hold);
    if (!signedIn) {
      go("/welcome");
      return () => {
        active = false;
      };
    }
    loadProfile()
      .then((profile) => go(postAuthTarget(profile)))
      // Offline or a failed read: Home still works from the local session.
      .catch(() => go("/feed"));
    return () => {
      active = false;
    };
  }, [loading, signedIn, navigate, loadProfile]);

  return (
    // Full-bleed brand ground with the mark in white: the one screen where pink carries everything.
    <div
      className="flex min-h-[100dvh] w-full items-center justify-center brand-ground px-10"
      role="status"
      aria-label="Checking your session"
    >
      <LogoMark className="vt-brand w-3/5 max-w-[320px] animate-splash-mark text-background [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.28))]" />
    </div>
  );
}
