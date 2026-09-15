import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthStatus } from "@/components/ml/auth";

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
    <AuthStatus
      back={{ to: "/auth/phone" }}
      tone="danger"
      icon={ShieldAlert}
      title="Sign-in paused for 15 minutes"
      body="We saw several failed attempts on this account. This protects your work from someone guessing your password."
      listTitle="What you can do"
      list={[
        "Reset your password — that lifts the hold immediately.",
        "Wait 15 minutes and try again.",
        "Contact support if this wasn't you.",
      ]}
      actions={
        <>
          <Btn className="w-full" onClick={() => void navigate({ to: "/auth/forgot" })}>
            Reset my password
          </Btn>
          <Btn variant="outline" className="w-full" onClick={() => void navigate({ to: "/help" })}>
            Contact support
          </Btn>
        </>
      }
      note="Your account is not suspended and nothing has been deleted."
      footer={
        <Link to="/auth/phone" className="hit-area font-semibold text-foreground">
          Back to sign in
        </Link>
      }
    />
  );
}
