import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthStatus } from "@/components/ml/auth";

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
    <AuthStatus
      icon={Wrench}
      title="Back in a few minutes"
      body="We're shipping an update to MusicLinkd. Your account, work and bookings are safe."
      actions={
        <Btn className="w-full" onClick={() => window.location.reload()}>
          Check again
        </Btn>
      }
      note="Nothing in progress is lost — drafts stay on your device."
      footer={
        <Link to="/help" className="hit-area font-semibold text-foreground">
          Read status updates
        </Link>
      }
    />
  );
}
