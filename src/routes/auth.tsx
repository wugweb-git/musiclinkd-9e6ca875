import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, TopBar } from "@/components/ml/ui";
import { Field, TextInput } from "@/components/ml/collab";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MusicLinkd" },
      {
        name: "description",
        content:
          "Sign in or create your MusicLinkd account to save your portfolio, bookings and connections.",
      },
      { property: "og:title", content: "Sign in — MusicLinkd" },
      {
        property: "og:description",
        content: "Create your MusicLinkd account and publish your music work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && signedIn) navigate({ to: "/me" });
  }, [loading, signedIn, navigate]);

  async function submit() {
    if (!email || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/me" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/me" });
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-16">
      <TopBar title={mode === "signin" ? "Sign in" : "Create account"} back="/feed" />

      <main className="px-5 pt-5">
        <p className="text-sm text-muted-foreground">
          Your MusicLinkd account keeps your portfolio, bookings and connections in sync.
        </p>

        <div className="mt-5">
          <Btn variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Btn>
        </div>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use email
          <span className="h-px flex-1 bg-border" />
        </div>

        <Field label="Email">
          <TextInput value={email} onChange={setEmail} placeholder="you@example.com" />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </Field>

        <Btn className="w-full" onClick={submit}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Btn>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground"
        >
          {mode === "signin"
            ? "New to MusicLinkd? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Browsing without an account?{" "}
          <Link to="/" className="font-semibold text-primary">
            Explore Discover
          </Link>
        </p>
      </main>
    </div>
  );
}
