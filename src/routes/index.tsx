import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthScreen, Brand } from "@/components/ml/auth";
import { useAuth } from "@/hooks/use-auth";

// App start. The session lives in the browser, so the server renders the splash and the client
// routes: a saved sign-in goes to Home, everyone else to Welcome. On Android the native splash
// covers this screen.
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

  useEffect(() => {
    if (loading) return;
    void navigate({ to: signedIn ? "/feed" : "/welcome", replace: true });
  }, [loading, signedIn, navigate]);

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
