import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthScreen, TrustNote } from "@/components/ml/auth";

export const Route = createFileRoute("/auth/locked")({
  head: () => ({
    meta: [
      { title: "Account temporarily locked — MusicLinkd" },
      {
        name: "description",
        content:
          "Your MusicLinkd sign-in is paused after repeated attempts. Here's how to get back in.",
      },
      { property: "og:title", content: "Account temporarily locked — MusicLinkd" },
      {
        property: "og:description",
        content: "Security hold on sign-in. Reset your password to continue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LockedScreen,
});

function LockedScreen() {
  const navigate = useNavigate();
  return (
    <AuthScreen>
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-md"
        style={{ background: "color-mix(in oklab, var(--destructive) 12%, transparent)" }}
      >
        <ShieldAlert size={22} className="text-destructive" />
      </div>
      <AuthHeading
        title="Sign-in paused for 15 minutes"
        sub="We saw several failed attempts on this account. This protects your work from someone guessing your password."
      />

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <p className="text-[13px] font-semibold">What you can do</p>
        <ul className="mt-2 space-y-1.5 text-1 leading-relaxed text-muted-foreground">
          <li>• Reset your password — that lifts the hold immediately.</li>
          <li>• Wait 15 minutes and try again.</li>
          <li>• Contact support if this wasn't you.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Btn className="w-full" onClick={() => void navigate({ to: "/auth/forgot" })}>
          Reset my password
        </Btn>
        <Btn variant="outline" className="w-full" onClick={() => void navigate({ to: "/help" })}>
          Contact support
        </Btn>
      </div>

      <TrustNote>Your account is not suspended and nothing has been deleted.</TrustNote>

      <p className="mt-6 text-center text-1 text-muted-foreground">
        <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-foreground">
          Back to sign in
        </Link>
      </p>
    </AuthScreen>
  );
}
