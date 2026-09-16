import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthStatus } from "@/components/ml/auth";
import { TextLink } from "@/components/ml/links";

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
      back={{ to: "/auth/phone" }}
      icon={Wrench}
      title="Back in a few minutes"
      body="We're shipping an update to MusicLinkd. Your account, work and bookings are safe."
      actions={
        <Btn className="w-full" onClick={() => window.location.reload()}>
          Check Again
        </Btn>
      }
      note="Nothing in progress is lost — drafts stay on your device."
      footer={<TextLink to="/help">Read Status Updates</TextLink>}
    />
  );
}
