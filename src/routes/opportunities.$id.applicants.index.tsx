import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Segmented, EmptyState, Loading, SegmentedField } from "@/components/ml/kit";
import { ApplicantCard } from "@/components/ml/opportunity";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import { applicants, myOpportunities, getOpportunity } from "@/data/opportunities";
import type { Applicant } from "@/data/opportunities";
import { loadDbOpportunity } from "@/lib/opportunity-view";

export const Route = createFileRoute("/opportunities/$id/applicants/")({
  // Ids that are not static opportunities are looked up as stored opportunity slugs. Stored
  // opportunities have no application records, so their list is empty.
  loader: async ({ params }) => ({
    db:
      myOpportunities.some((x) => x.id === params.id) || getOpportunity(params.id)
        ? null
        : await loadDbOpportunity(params.id),
  }),
  head: () => ({
    meta: [
      { title: "Applicants | MusicLinkd Opportunities" },
      {
        name: "description",
        content: "Review applicants with portfolios, fit scores and verification, then shortlist.",
      },
      { property: "og:title", content: "Applicants | MusicLinkd Opportunities" },
      {
        property: "og:description",
        content: "Shortlist music professionals who applied to your opportunity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Applicants,
});

const tabs = ["All", "Shortlisted", "New"] as const;

function Applicants() {
  const { id } = Route.useParams();
  const [view, setView] = useState<"List" | "Board">("List");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [loading] = useState(false);
  const { db } = Route.useLoaderData();
  const o = myOpportunities.find((x) => x.id === id) ?? db ?? undefined;
  const all = applicants.filter((a) => a.opportunityId === id);
  const list = all.filter((a) =>
    tab === "All"
      ? true
      : tab === "Shortlisted"
        ? a.status === "shortlisted"
        : a.status === "submitted",
  );

  return (
    <Screen>
      <TopBar
        title="Applicants"
        subtitle={o?.title ?? "Your opportunity"}
        back="/opportunities/mine"
      />
      <div className="space-y-4 px-5 pt-4 pb-4">
        <SegmentedField
          label="How to view applicants"
          value={view}
          options={["List", "Board"] as const}
          onChange={setView}
        />
        {view === "Board" ? <ApplicantBoard applicants={all} /> : null}
        {view === "List" ? <Segmented value={tab} options={tabs} onChange={setTab} /> : null}
        {view === "List" && loading ? (
          <Loading rows={3} />
        ) : view === "List" && list.length === 0 ? (
          <EmptyState
            title="No applicants here yet"
            body="Sharing your opportunity in a conversation or on your profile usually doubles applications."
          >
            <BtnLink
              to="/opportunities/$id/analytics"
              params={{ id }}
              variant="outline"
              className="w-full"
            >
              See Performance
            </BtnLink>
          </EmptyState>
        ) : view === "List" ? (
          list.map((a) => <ApplicantCard key={a.id} a={a} />)
        ) : null}
      </div>
    </Screen>
  );
}

/** The four stages an application moves through, as the board's columns. */
const stages = [
  { id: "submitted", name: "New" },
  { id: "shortlisted", name: "Shortlisted" },
  { id: "accepted", name: "Accepted" },
  { id: "rejected", name: "Declined" },
];

type BoardCard = { id: string; name: string; column: string; applicant: Applicant };

/**
 * Applicants as a pipeline rather than a filtered list: drag someone from New to Shortlisted and
 * the board moves them. The move is local to this screen — there is no application_status write
 * behind it yet — so the column reads as where you have put them, not as a decision sent to them.
 */
function ApplicantBoard({ applicants: all }: { applicants: Applicant[] }) {
  const initial = useMemo(
    () =>
      all.map((a): BoardCard => ({
        id: a.id,
        name: a.name,
        column: a.status === "viewed" || a.status === "withdrawn" ? "submitted" : a.status,
        applicant: a,
      })),
    [all],
  );
  const [cards, setCards] = useState<BoardCard[]>(initial);

  if (!all.length) {
    return (
      <EmptyState
        title="No applicants to sort yet"
        body="Applications land in New, and you move them from there."
      />
    );
  }

  return (
    <div className="rail -mx-5 overflow-x-auto px-5 pb-1 no-scrollbar">
      <KanbanProvider
        columns={stages}
        data={cards}
        onDataChange={setCards}
        className="min-w-[640px] gap-3"
      >
        {(stage) => (
          <KanbanBoard key={stage.id} id={stage.id} className="bg-subtle">
            <KanbanHeader className="flex items-center justify-between text-2">
              {stage.name}
              <span className="pill bg-card text-muted-foreground">
                {cards.filter((c) => c.column === stage.id).length}
              </span>
            </KanbanHeader>
            <KanbanCards id={stage.id}>
              {(card: BoardCard) => (
                <KanbanCard key={card.id} {...card}>
                  <Link
                    to="/opportunities/$id/applicants/$aid"
                    params={{ id: card.applicant.opportunityId, aid: card.id }}
                    className="flex items-center gap-2"
                  >
                    <img
                      src={card.applicant.photo}
                      alt=""
                      loading="lazy"
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-1 font-semibold">{card.name}</span>
                      <span className="block truncate text-1 text-muted-foreground">
                        {card.applicant.headline}
                      </span>
                    </span>
                  </Link>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}
