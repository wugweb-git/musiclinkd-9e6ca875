import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ml/kit";
import { BtnLink, Screen, TopBar } from "@/components/ml/ui";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Academy | MusicLinkd" },
      { name: "description", content: "Lessons for music professionals on MusicLinkd. Coming soon." },
      { property: "og:title", content: "Academy | MusicLinkd" },
      { property: "og:description", content: "Learn to get booked, price your work and grow in music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademyScreen,
});

function AcademyScreen() {
  return (
    <Screen>
      <TopBar title="Academy" back="/home" />
      <div className="px-5 pt-6">
        <EmptyState
          icon={<GraduationCap size={iconSize.lg} aria-hidden />}
          title="Lessons are coming soon"
          body="Short guides on getting booked, pricing your work and building a portfolio will appear here. Until then, Help has answers to common questions."
        >
          <BtnLink to="/help" variant="outline" className="w-full">
            Open Help
          </BtnLink>
        </EmptyState>
      </div>
    </Screen>
  );
}
