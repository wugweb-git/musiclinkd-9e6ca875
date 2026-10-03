import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthComposition,
  AuthFooter,
  AuthNotice,
  AuthScreen,
  AuthSurface,
  PasswordInput,
  PasswordRequirements,
  classifyAuthError,
  passwordScore,
  useFieldErrors,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — MusicLinkd" },
      { name: "description", content: "Choose a new password for your MusicLinkd account." },
      { property: "og:title", content: "Set a new password — MusicLinkd" },
      { property: "og:description", content: "Finish resetting your MusicLinkd password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<ReturnType<typeof classifyAuthError> | null>(null);
  const fields = useFieldErrors<"password" | "confirm">();

  const passwordProblem = !password
    ? "Choose a new password."
    : password.length < 8 || passwordScore(password) < 2
      ? "Use at least 8 characters, with a number or symbol."
      : null;
  const confirmProblem = !confirm
    ? "Enter the same password again."
    : confirm !== password
      ? "These passwords don't match."
      : null;

  useEffect(() => {
    const hash = window.location.hash;
    const recovery = hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      setValid(recovery || Boolean(data.session));
      setReady(true);
    });
  }, []);

  async function save() {
    setError(null);
    fields.submitted();
    if (passwordProblem || confirmProblem) {
      haptic("error");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      haptic("error");
      setError(classifyAuthError(err.message));
      return;
    }
    haptic("confirm");
    setDone(true);
  }

  if (!ready) {
    return (
      <AuthScreen>
        <AuthComposition footer={<AuthFooter />}>
          <div role="status" aria-label="Loading password reset" className="space-y-4 pt-8">
            <div className="h-4 w-28 animate-pulse rounded-full bg-subtle" />
            <div className="h-9 w-56 animate-pulse rounded-full bg-subtle" />
            <div className="h-13 w-full animate-pulse rounded-sm bg-subtle" />
          </div>
        </AuthComposition>
      </AuthScreen>
    );
  }

  if (done) {
    return (
      <AuthScreen>
        <AuthComposition footer={<AuthFooter />}>
          <AuthSurface>
            <AuthHeading
              title="Password updated"
              sub="You can now sign in with your new password."
            />
            <Btn className="w-full h-12 text-2 font-medium" onClick={() => void navigate({ to: "/", replace: true })}>
              Continue to MusicLinkd
            </Btn>
          </AuthSurface>
        </AuthComposition>
      </AuthScreen>
    );
  }

  if (!valid) {
    return (
      <AuthScreen>
        <AuthComposition footer={<AuthFooter />}>
          <AuthSurface>
            <AuthHeading
              title="This reset link has expired"
              sub="Reset links work once and expire after 60 minutes."
            />
            <Btn className="w-full h-12 text-2 font-medium" onClick={() => void navigate({ to: "/auth/forgot" })}>
              Send a new link
            </Btn>
            <p className="mt-4 text-center text-1 text-muted-foreground">
              <TextLink to="/welcome">Back to sign in</TextLink>
            </p>
          </AuthSurface>
        </AuthComposition>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <AuthComposition footer={<AuthFooter />}>
        <AuthSurface>
          <AuthHeading
            title="Set a new password"
            sub="Choose something you have not used on MusicLinkd before."
          />
          {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void save();
            }}
          >
            <PasswordInput
              label="New password"
              value={password}
              onChange={setPassword}
              onBlur={() => fields.touch("password")}
              error={fields.errorFor("password", passwordProblem)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="mb-2"
              below={<PasswordRequirements value={password} />}
            />
            <PasswordInput
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              onBlur={() => fields.touch("confirm")}
              error={fields.errorFor("confirm", confirmProblem)}
              placeholder="Same password again"
              autoComplete="new-password"
              className="mb-2.5"
            />
            <Btn
              type="submit"
              className="mt-1 w-full h-12 text-2 font-medium"
              loading={busy}
            >
              Save new password
            </Btn>
          </form>
        </AuthSurface>
        <p className="mt-3.5 text-center text-1 text-muted-foreground">
          <TextLink to="/welcome">Back to sign in</TextLink>
        </p>
      </AuthComposition>
    </AuthScreen>
  );
}
