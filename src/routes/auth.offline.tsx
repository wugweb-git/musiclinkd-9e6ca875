import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthScreen, TrustNote } from "@/components/ml/auth";

export const Route = createFileRoute("/auth/offline")({
  head: () => ({
    meta: [
      { title: "You're offline — MusicLinkd" },
      { name: "description", content: "MusicLinkd could not reach the network. Reconnect to continue signing in." },
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
    <AuthScreen>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-subtle">
        <WifiOff size={22} className="text-text2" />
      </div>
      <AuthHeading
        title="No connection"
        sub="We couldn't reach MusicLinkd. Nothing you typed was lost — reconnect and try again."
      />
      <div className="space-y-3">
        <Btn className="w-full" onClick={() => window.location.reload()}>
          Try again
        </Btn>
        <Btn variant="outline" className="w-full" onClick={() => void navigate({ to: "/" })}>
          Browse cached Discover
        </Btn>
      </div>
      <TrustNote>Drafts you started are stored on this device until you're back online.</TrustNote>
      <p className="mt-6 text-center text-[12.5px] text-text2">
        <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
          Back to sign in
        </Link>
      </p>
    </AuthScreen>
  );
}
