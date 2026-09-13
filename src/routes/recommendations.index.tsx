import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal, Settings2, Sparkles } from "lucide-react";
import { Screen, TopBar, Btn, Sheet, VerifiedBadge } from "@/components/ml/ui";
import { Card, EmptyState, Loading, ReasonChip, Segmented } from "@/components/ml/kit";
import {
  recommendations,
  recSections,
  feedbackOptions,
  recEmptyCopy,
  type Recommendation,
} from "@/data/recommendations";

export const Route = createFileRoute("/recommendations/")({
  head: () => ({
    meta: [
      { title: "For You — Recommendations | MusicLinkd" },
      {
        name: "description",
        content:
          "Explainable recommendations for talent, studios, gear, opportunities and collaborations on MusicLinkd.",
      },
      { property: "og:title", content: "For You — Recommendations | MusicLinkd" },
      { property: "og:description", content: "Explainable recommendations across MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recs,
});

const filters = ["All", "People", "Spaces", "Gear", "Work", "Reading"] as const;

const kindFilter: Record<(typeof filters)[number], string[]> = {
  All: [],
  People: ["talent"],
  Spaces: ["studio"],
  Gear: ["listing"],
  Work: ["opportunity", "collaboration"],
  Reading: ["content"],
};

function Recs() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [hidden, setHidden] = useState<string[]>([]);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [loading] = useState(false);

  const allow = kindFilter[filter];
  const visible = (ids: string[]) =>
    ids
      .map((id) => recommendations.find((r) => r.id === id))
      .filter(
        (r): r is Recommendation =>
          !!r && !hidden.includes(r.id) && (allow.length === 0 || allow.includes(r.kind)),
      );

  const anything = recSections.some((s) => visible(s.ids).length);

  return (
    <Screen>
      <TopBar
        title="For you"
        subtitle="Why you are seeing each one"
        back="/feed"
        right={
          <Link
            to="/recommendations/settings"
            aria-label="Recommendation settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle"
          >
            <Settings2 size={18} aria-hidden />
          </Link>
        }
      />
      <div className="space-y-4 px-5 pt-4">
        <Segmented value={filter} options={filters} onChange={setFilter} />

        {loading ? (
          <Loading rows={4} />
        ) : !anything ? (
          <EmptyState title={recEmptyCopy.title} body={recEmptyCopy.body}>
            <Link to="/profile/edit">
              <Btn className="w-full">Complete my profile</Btn>
            </Link>
            <Link to="/">
              <Btn variant="outline" className="w-full">
                Browse Discover instead
              </Btn>
            </Link>
          </EmptyState>
        ) : (
          recSections.map((s) => {
            const items = visible(s.ids);
            if (!items.length) return null;
            return (
              <section key={s.key}>
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-primary" aria-hidden />
                  <h2 className="text-[15px]">{s.title}</h2>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{s.blurb}</p>
                <div className="mt-3 space-y-3">
                  {items.map((r) => (
                    <Card key={r.id} className="p-0 overflow-hidden">
                      <div className="flex gap-3 p-3">
                        <img
                          src={r.image}
                          alt=""
                          loading="lazy"
                          className="h-20 w-20 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h3 className="truncate text-[15px] leading-tight">{r.title}</h3>
                                {r.verified ? <VerifiedBadge size={13} /> : null}
                              </div>
                              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                                {r.subtitle} · {r.meta}
                              </p>
                            </div>
                            <button
                              type="button"
                              aria-label="Recommendation feedback"
                              onClick={() => setFeedbackFor(r.id)}
                              className="shrink-0 p-1 text-muted-foreground"
                            >
                              <MoreHorizontal size={18} aria-hidden />
                            </button>
                          </div>
                          <div className="mt-2">
                            <ReasonChip>{r.reason}</ReasonChip>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 border-t border-border p-3">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Link to={r.route as any} className="flex-1">
                          <Btn className="w-full text-xs">Open</Btn>
                        </Link>
                        <Btn variant="outline" className="flex-1 text-xs">
                          Save
                        </Btn>
                        <Btn
                          variant="ghost"
                          className="flex-1 text-xs"
                          onClick={() => setHidden((p) => [...p, r.id])}
                        >
                          Hide
                        </Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })
        )}

        <Card className="mb-4 space-y-2">
          <h2 className="text-[15px]">Recommendations you control</h2>
          <p className="text-[12px] text-muted-foreground">
            Every card shows why it is here. Hide anything and it stops influencing future
            suggestions.
          </p>
          <Link to="/recommendations/settings">
            <Btn variant="outline" className="w-full">
              Recommendation settings
            </Btn>
          </Link>
        </Card>
      </div>

      <Sheet open={!!feedbackFor} onClose={() => setFeedbackFor(null)} title="Tell us why">
        <div className="space-y-2">
          {feedbackOptions.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                if (feedbackFor) setHidden((p) => [...p, feedbackFor]);
                setFeedbackFor(null);
              }}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-[13px] font-semibold"
            >
              {f}
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
