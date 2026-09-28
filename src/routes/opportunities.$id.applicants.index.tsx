import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, Screen, TopBar, BtnLink, VerifiedBadge } from "@/components/ml/ui";
import { EmptyState, LoadError, Loading, Segmented, SegmentedField } from "@/components/ml/kit";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import {
  listApplicants,
  setApplicationStatus,
  type ApplicantSummary,
} from "@/lib/applications.functions";
import { loadDbOpportunity } from "@/lib/opportunity-view";
import { ApplicantFit } from "@/components/ml/opportunity";
import { personFit, fitTarget } from "@/lib/fit";
import { useTaxonomy } from "@/lib/taxonomy";
import { useAuth } from "@/hooks/use-auth";
import { joinParts } from "@/lib/utils";
import { sized } from "@/lib/image-url";

export const Route = createFileRoute("/opportunities/$id/applicants/")({
  // The id is a stored opportunity slug.
  loader: async ({ params }) => ({ db: await loadDbOpportunity(params.id) }),
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
const columns = [
  { id: "pending", name: "New" },
  { id: "shortlisted", name: "Shortlisted" },
  { id: "accepted", name: "Accepted" },
  { id: "rejected", name: "Declined" },
];

type BoardCard = { id: string; name: string; column: string; applicant: ApplicantSummary };

const personName = (a: ApplicantSummary) =>
  a.person?.display_name ?? a.person?.username ?? "Applicant";

/**
 * The people who applied to one of your own opportunities, from the database. The list moves an
 * application along with a button; the board moves it by dragging — both write the status, so the
 * column someone sits in is what they will be told.
 */
function Applicants() {
  const { id } = Route.useParams();
  const [view, setView] = useState<"List" | "Board">("List");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const { signedIn } = useAuth();
  const { db } = Route.useLoaderData();
  const o = db ?? undefined;
  const queryClient = useQueryClient();
  const load = useServerFn(listApplicants);
  const decide = useServerFn(setApplicationStatus);

  const q = useQuery({
    queryKey: ["applicants", id],
    queryFn: () => load({ data: { slug: id } }),
    enabled: signedIn,
    retry: false,
  });

  const move = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: "pending" | "shortlisted" | "accepted" | "rejected";
    }) => decide({ data: { id: applicationId, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applicants", id] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  // Each applicant's fit to this opportunity, from their profile (src/lib/fit.ts).
  const { options: taxonomy } = useTaxonomy();
  const target = o ? fitTarget(o) : null;
  const fitOf = (a: ApplicantSummary) =>
    target && taxonomy ? personFit(a.person ?? {}, target, taxonomy, { withRating: true }) : null;

  const all = q.data ?? [];
  const list = all.filter((a) =>
    tab === "All"
      ? true
      : tab === "Shortlisted"
        ? a.status === "shortlisted"
        : a.status === "pending",
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

        {q.isLoading ? (
          <Loading rows={3} />
        ) : q.isError ? (
          <LoadError what="the applicants" />
        ) : null}

        {!q.isLoading && view === "Board" ? (
          <ApplicantBoard
            applicants={all}
            onMove={(applicationId, status) => move.mutate({ applicationId, status })}
          />
        ) : null}

        {!q.isLoading && view === "List" ? (
          <>
            <Segmented value={tab} options={tabs} onChange={setTab} />
            {list.length === 0 ? (
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
            ) : (
              <ul className="space-y-3">
                {list.map((a) => (
                  <li key={a.id} className="rounded-lg bg-subtle p-4">
                    <div className="flex items-center gap-3">
                      {a.person?.avatar_url ? (
                        <img
                          src={sized(a.person.avatar_url, { width: 48 })}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="h-12 w-12 shrink-0 rounded-full bg-background"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{personName(a)}</p>
                        <p className="truncate text-1 text-muted-foreground">
                          {joinParts(a.person?.headline ?? "", a.person?.city ?? "")}
                        </p>
                      </div>
                      <span className="pill shrink-0 bg-background text-muted-foreground">
                        {columns.find((c) => c.id === a.status)?.name ?? a.status}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ApplicantFit
                        fit={fitOf(a)}
                        rating={a.person?.rating}
                        reviews={a.person?.review_count}
                      />
                    </div>
                    {a.message ? (
                      <p className="mt-2 line-clamp-3 text-1 text-muted-foreground">{a.message}</p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      {a.person?.username ? (
                        <BtnLink
                          to="/profile/$username"
                          params={{ username: a.person.username }}
                          variant="outline"
                          className="min-h-10 flex-1 text-1"
                        >
                          Profile
                        </BtnLink>
                      ) : null}
                      {a.status === "pending" ? (
                        <Btn
                          className="min-h-10 flex-1 text-1"
                          loading={move.isPending}
                          onClick={() =>
                            move.mutate({ applicationId: a.id, status: "shortlisted" })
                          }
                        >
                          Shortlist
                        </Btn>
                      ) : null}
                      {a.status === "shortlisted" ? (
                        <Btn
                          className="min-h-10 flex-1 text-1"
                          loading={move.isPending}
                          onClick={() => move.mutate({ applicationId: a.id, status: "accepted" })}
                        >
                          Accept
                        </Btn>
                      ) : null}
                      {["pending", "shortlisted"].includes(a.status) ? (
                        <Btn
                          variant="ghost"
                          className="min-h-10 flex-1 text-1"
                          loading={move.isPending}
                          onClick={() => move.mutate({ applicationId: a.id, status: "rejected" })}
                        >
                          Decline
                        </Btn>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </Screen>
  );
}

/** Applicants as a pipeline: drag someone to another column and that status is saved. */
function ApplicantBoard({
  applicants: all,
  onMove,
}: {
  applicants: ApplicantSummary[];
  onMove: (
    applicationId: string,
    status: "pending" | "shortlisted" | "accepted" | "rejected",
  ) => void;
}) {
  const toCards = (rows: ApplicantSummary[]): BoardCard[] =>
    rows
      .filter((a) => a.status !== "withdrawn")
      .map((a) => ({ id: a.id, name: personName(a), column: a.status, applicant: a }));
  const [cards, setCards] = useState<BoardCard[]>(() => toCards(all));

  // The board holds its own copy while dragging; a save or a refetch replaces it.
  useEffect(() => {
    setCards(toCards(all));
  }, [all]);

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
        columns={columns}
        data={cards}
        onDataChange={(next: BoardCard[]) => {
          setCards(next);
          for (const card of next) {
            const before = cards.find((c) => c.id === card.id);
            if (before && before.column !== card.column) {
              onMove(card.id, card.column as "pending" | "shortlisted" | "accepted" | "rejected");
            }
          }
        }}
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
                  {card.applicant.person?.username ? (
                    <Link
                      to="/profile/$username"
                      params={{ username: card.applicant.person.username }}
                      className="flex items-center gap-2"
                    >
                      <BoardFace card={card} />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      <BoardFace card={card} />
                    </span>
                  )}
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}

function BoardFace({ card }: { card: BoardCard }) {
  const person = card.applicant.person;
  return (
    <>
      {person?.avatar_url ? (
        <img
          src={sized(person.avatar_url, { width: 32 })}
          alt=""
          loading="lazy"
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span aria-hidden className="h-8 w-8 shrink-0 rounded-full bg-background" />
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-1">
          <span className="truncate text-1 font-semibold">{card.name}</span>
          {person?.is_verified ? <VerifiedBadge size={12} /> : null}
        </span>
        <span className="block truncate text-1 text-muted-foreground">
          {person?.headline ?? ""}
        </span>
      </span>
    </>
  );
}
