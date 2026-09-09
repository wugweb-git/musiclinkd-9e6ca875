import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, StatusPill } from "@/components/ml/kit";
import { reviewRequestTargets } from "@/data/reviews";

export const Route = createFileRoute("/reviews/request")({
  head: () => ({
    meta: [
      { title: "Ask for a review | MusicLinkd" },
      { name: "description", content: "Ask people you have already worked with to leave a review, and send one polite reminder." },
      { property: "og:title", content: "Ask for a review | MusicLinkd" },
      { property: "og:description", content: "Request reviews from past clients and collaborators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestReviews,
});

function RequestReviews() {
  const [asked, setAsked] = useState<Record<string, "asked" | "reminded">>(
    Object.fromEntries(reviewRequestTargets.filter((t) => t.asked).map((t) => [t.id, "asked" as const])),
  );

  return (
    <Screen>
      <TopBar title="Ask for a review" subtitle="Only people you actually worked with" back="/reviews" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-[13px] text-muted-foreground">
            You can ask once, and send one reminder a week later. After that the request quietly expires — no chasing.
          </p>
        </Card>

        {reviewRequestTargets.length ? (
          <div className="space-y-3">
            {reviewRequestTargets.map((t) => {
              const state = asked[t.id];
              return (
                <Card key={t.id}>
                  <div className="flex items-center gap-3">
                    <img src={t.photo} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{t.context}</p>
                    </div>
                    {state ? <StatusPill label={state === "reminded" ? "Reminded" : "Asked"} tone={state === "reminded" ? "warn" : "good"} /> : null}
                  </div>
                  <Btn
                    variant={state ? "outline" : "primary"}
                    className="mt-3 w-full"
                    disabled={state === "reminded"}
                    onClick={() => setAsked({ ...asked, [t.id]: state === "asked" ? "reminded" : "asked" })}
                  >
                    {state === "reminded" ? "Reminder sent" : state === "asked" ? "Send a reminder" : "Ask for a review"}
                  </Btn>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Nobody to ask yet" body="Once a booking, order or rental completes, they show up here." />
        )}
      </div>
    </Screen>
  );
}
