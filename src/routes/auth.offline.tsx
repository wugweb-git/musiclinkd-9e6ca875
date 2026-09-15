import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthStatus } from "@/components/ml/auth";

export const Route = createFileRoute("/auth/offline")({
  head: () => ({
    meta: [
      { title: "You're offline — MusicLinkd" },
      {
        name: "description",
        content: "MusicLinkd could not reach the network. Reconnect to continue signing in.",
      },
      { property: "og:title", content: "You're offline — MusicLinkd" },
      { property: "og:description", content: "Check your connection and retry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfflineScreen,
});

function OfflineScreen() {
  const navigate = useNavigate();
  return (
    <AuthStatus
      back={{ to: "/auth/phone" }}
      icon={WifiOff}
      title="No connection"
      body="We couldn't reach MusicLinkd. Nothing you typed was lost — reconnect and try again."
      actions={
        <>
          <Btn className="w-full" onClick={() => window.location.reload()}>
            Try again
          </Btn>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => void navigate({ to: "/discover" })}
          >
            Browse cached Discover
          </Btn>
        </>
      }
      note="Drafts you started are stored on this device until you're back online."
      footer={
        <Link to="/auth/phone" className="hit-area font-semibold text-foreground">
          Back to sign in
        </Link>
      }
    />
  );
}
