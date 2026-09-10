import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthScreen, TrustNote } from "@/components/ml/auth";

export const Route = createFileRoute("/auth/maintenance")({
  head: () => ({
    meta: [
      { title: "Scheduled maintenance — MusicLinkd" },
      {
        name: "description",
        content: "MusicLinkd is briefly unavailable while we ship an update.",
      },
      { property: "og:title", content: "Scheduled maintenance — MusicLinkd" },
      { property: "og:description", content: "We'll be back shortly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MaintenanceScreen,
});

function MaintenanceScreen() {
  return (
    <AuthScreen>
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl"
        style={{ background: "var(--pink-container)" }}
      >
        <Wrench size={22} className="text-primary" />
      </div>
      <AuthHeading
        title="Back in a few minutes"
        sub="We're shipping an update to MusicLinkd. Your account, work and bookings are safe."
      />
      <Btn className="w-full" onClick={() => window.location.reload()}>
        Check again
      </Btn>
      <TrustNote>Nothing in progress is lost — drafts stay on your device.</TrustNote>
      <p className="mt-6 text-center text-[12.5px] text-text2">
        <Link to="/help" className="font-semibold text-primary">
          Read status updates
        </Link>
      </p>
    </AuthScreen>
  );
}
