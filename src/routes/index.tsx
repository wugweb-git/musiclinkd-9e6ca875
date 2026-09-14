import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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

  useEffect(() => {
    if (loading) return;
    if (!signedIn) {
      void navigate({ to: "/welcome", replace: true });
      return;
    }
    let active = true;
    loadProfile()
      .then((profile) => {
        if (active) void navigate({ to: postAuthTarget(profile), replace: true });
      })
      .catch(() => {
        // Offline or a failed read: Home still works from the local session.
        if (active) void navigate({ to: "/feed", replace: true });
      });
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
        <Brand />
      </div>
    </AuthScreen>
  );
}
