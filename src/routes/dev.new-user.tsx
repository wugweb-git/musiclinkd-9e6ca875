import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthNotice, AuthScreen, Brand } from "@/components/ml/auth";
import { Btn } from "@/components/ml/ui";
import { supabase } from "@/integrations/supabase/client";
import { showDemoControls } from "@/lib/dev";

/*
 * Development only: test the new user flow without an email or phone. It ends any session on this
 * browser, signs in as a brand-new anonymous user (Anonymous sign-ins must be on in Lovable Cloud →
 * Users → Auth settings), and hands over to the splash, which routes a new account into onboarding.
 * Open it again to start over as another new user. A production build sends this route to Welcome.
 *
 * The anonymous account and the profile row it gets are real rows in the project's database.
 */
export const Route = createFileRoute("/dev/new-user")({
  head: () => ({ meta: [{ title: "Test as a new user — MusicLinkd (dev)" }] }),
  component: DevNewUser,
});

function DevNewUser() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    await supabase.auth.signOut();
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      setError(signInError.message);
      return;
    }
    void navigate({ to: "/", replace: true });
  };

  useEffect(() => {
    if (!showDemoControls) {
      void navigate({ to: "/welcome", replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;
    void start();
    // start runs once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthScreen>
      <Brand compact animated />
      {error ? (
        <AuthNotice
          title="Couldn't start a test account"
          action={
            <Btn variant="outline" onClick={() => void start()}>
              Try again
            </Btn>
          }
        >
          {error}. Check that anonymous sign-ins are on in Lovable Cloud auth settings.
        </AuthNotice>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Starting a new test account…
        </p>
      )}
    </AuthScreen>
  );
}
