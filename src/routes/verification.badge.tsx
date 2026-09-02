import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import { Card, Row } from "@/components/ml/kit";
import { badgePlacements } from "@/data/verification";

export const Route = createFileRoute("/verification/badge")({
  head: () => ({
    meta: [
      { title: "Where your badge appears | MusicLinkd" },
      {
        name: "description",
        content: "How the MusicLinkd verified badge is shown on profiles, search, listings, messages and reviews.",
      },
      { property: "og:title", content: "Where your badge appears | MusicLinkd" },
      { property: "og:description", content: "One badge, shown the same way everywhere on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BadgeGuide,
});

function BadgeGuide() {
  return (
    <Screen>
      <TopBar title="Your badge" subtitle="One meaning, everywhere" back="/verification" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[17px] leading-tight">Aarav Mehta</span>
            <VerifiedBadge />
          </div>
          <p className="text-[13px] text-text2">
            The badge only ever means one thing: a person on the Trust team checked real evidence. It is never sold,
            never given for activity, and never awarded for a follower count.
          </p>
        </Card>

        <section>
          <h2 className="text-[15px]">Placement rules</h2>
          <div className="mt-3 space-y-2">
            {badgePlacements.map((p) => (
              <Card key={p.surface} className="py-3">
                <div className="flex items-center gap-2">
                  <VerifiedBadge size={14} />
                  <p className="text-[13px] font-semibold">{p.surface}</p>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">{p.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-[15px]">Related</h2>
          <Row title="Verification status" subtitle="Your badges and requests" to="/verification" />
          <Row title="Document privacy" subtitle="What is stored and who sees it" to="/verification/privacy" />
        </section>
      </div>
    </Screen>
  );
}
