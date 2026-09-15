import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuthScreen, Brand } from "@/components/ml/auth";
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
    // Hold until the 500ms sound check has played; a slow session read is not held further.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduced ? 0 : Math.max(0, 500 - (Date.now() - mountedAt.current));
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
    <AuthScreen brand={false}>
      <div
        className="flex min-h-[calc(100dvh-64px)] items-center justify-center"
        role="status"
        aria-label="Checking your session"
      >
        <Brand animated className="vt-brand" />
      </div>
    </AuthScreen>
  );
}
