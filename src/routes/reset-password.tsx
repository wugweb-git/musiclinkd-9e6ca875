import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Btn } from "@/components/ml/ui";
import {
  AuthHeading,
  AuthNotice,
  AuthScreen,
  PasswordInput,
  PasswordRequirements,
  classifyAuthError,
  passwordScore,
} from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";

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
    if (passwordScore(password) < 2) {
      setError({
        kind: "weak_password",
        title: "Choose a stronger password",
        body: "Use at least 8 characters with a number or symbol.",
      });
      return;
    }
    if (password !== confirm) {
      setError({
        kind: "unknown",
        title: "Passwords do not match",
        body: "Re-enter the same password twice.",
      });
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(classifyAuthError(err.message));
      return;
    }
    setDone(true);
  }

  if (!ready) {
    return (
      <AuthScreen>
        <div className="h-4 w-28 animate-pulse rounded-full bg-subtle" />
        <div className="mt-4 h-9 w-56 animate-pulse rounded-full bg-subtle" />
        <div className="mt-8 h-13 w-full animate-pulse rounded-2xl bg-subtle" />
      </AuthScreen>
    );
  }

  if (done) {
    return (
      <AuthScreen>
        <AuthHeading title="Password updated" sub="You can now sign in with your new password." />
        <Btn className="w-full" onClick={() => void navigate({ to: "/feed" })}>
          Continue to MusicLinkd
        </Btn>
      </AuthScreen>
    );
  }

  if (!valid) {
    return (
      <AuthScreen>
        <AuthHeading
          title="This reset link has expired"
          sub="Reset links work once and expire after 60 minutes."
        />
        <Btn className="w-full" onClick={() => void navigate({ to: "/auth/forgot" })}>
          Send a new link
        </Btn>
        <p className="mt-6 text-center text-[12.5px] text-text2">
          <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
            Back to sign in
          </Link>
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <AuthHeading
        title="Set a new password"
        sub="Choose something you have not used on MusicLinkd before."
      />
      {error ? <AuthNotice title={error.title}>{error.body}</AuthNotice> : null}
      <PasswordInput
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />
      <PasswordInput
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />
      <PasswordRequirements value={password} />
      <Btn className="w-full" onClick={() => void save()} disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </Btn>
    </AuthScreen>
  );
}
