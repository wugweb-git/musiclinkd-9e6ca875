import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wand2 } from "lucide-react";

import { PersonRow } from "@/components/ml/cards";
import { EmptyState } from "@/components/ml/kit";
import { OpportunityCard, useSavedOpportunities } from "@/components/ml/opportunity";
import { Btn, BtnLink, Screen, SectionHeader, TopBar } from "@/components/ml/ui";
import { useAuth } from "@/hooks/use-auth";
import { findAiMatches } from "@/lib/ai-match.functions";
import { opportunityFromRow } from "@/lib/opportunity-view";
import { getTaxonomyLabels } from "@/lib/portfolio.functions";
import { useTaxonomy } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/discover/match")({
  head: () => ({
    meta: [
      { title: "Describe who you need | MusicLinkd" },
      {
        name: "description",
        content:
          "Describe the collaborator or opportunity you need and get AI-powered matches from real MusicLinkd profiles.",
      },
      { property: "og:title", content: "Describe who you need | MusicLinkd" },
      {
        property: "og:description",
        content: "AI-powered matching across India's music professionals and open opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { intent?: "hire" } =>
    s["intent"] === "hire" ? { intent: "hire" } : {},
  component: MatchScreen,
});

const HIRE_EXAMPLES = [
  "A sound engineer for a live show in Bengaluru, paid",
  "A session guitarist for three studio days in Delhi",
  "A music producer for a brand jingle, remote is fine",
];

const EXAMPLES = [
  "A Hindustani vocalist in Mumbai for a film song next month",
  "A mixing engineer for an indie rock EP",
  "Paid session work for a tabla player",
];

function MatchScreen() {
  const { signedIn, loading } = useAuth();
  const { intent } = Route.useSearch();
  const hiring = intent === "hire";
  const examples = hiring ? HIRE_EXAMPLES : EXAMPLES;
  const [brief, setBrief] = useState("");
  const run = useServerFn(findAiMatches);
  const match = useMutation({ mutationFn: (b: string) => run({ data: { brief: b } }) });
  const labels = useQuery({ queryKey: ["taxonomy-labels"], queryFn: () => getTaxonomyLabels() });
  const { options } = useTaxonomy();
  const saved = useSavedOpportunities();
  const tooShort = brief.trim().length < 10;
  const result = match.data;

  return (
    <Screen>
      <TopBar
        title={hiring ? "Describe a hiring need" : "Describe who you need"}
        subtitle="AI-powered matches"
        back={hiring ? "/home" : "/discover"}
      />
      <div className="space-y-6 px-5 pt-5">
        {!loading && !signedIn ? (
          <EmptyState
            title="Sign in to get matches"
            body="Matching reads your brief against real profiles and open opportunities."
          >
            <BtnLink to="/welcome" className="w-full">
              Sign in
            </BtnLink>
          </EmptyState>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!tooShort) match.mutate(hiring ? `Hiring need: ${brief.trim()}` : brief.trim());
            }}
          >
            <label htmlFor="brief" className="block text-sm font-semibold">
              {hiring ? "Who do you need to hire?" : "What are you looking for?"}
            </label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              maxLength={600}
              rows={4}
              placeholder={
                hiring
                  ? "Role, skills, city, dates, budget…"
                  : "Role, genre, city, timing, paid or collab…"
              }
              className="w-full rounded-sm border border-input bg-card px-4 py-3 text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setBrief(ex)}
                  className="pill state-layer min-h-touch text-left text-1 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ex}
                </button>
              ))}
            </div>
            <Btn
              type="submit"
              className="w-full"
              loading={match.isPending}
              disabled={tooShort}
              icon={<Wand2 size={iconSize.sm} aria-hidden />}
            >
              Find matches
            </Btn>
            {tooShort && brief.length > 0 ? (
              <p className="text-1 text-muted-foreground">
                Add a little more detail (10+ characters).
              </p>
            ) : null}
          </form>
        )}

        {match.isError ? (
          <p role="alert" className="text-sm">
            Matching could not run. Check your connection and try again.
          </p>
        ) : null}
        {result && !result.ok ? (
          <p role="alert" className="text-sm">
            {result.message}
          </p>
        ) : null}
      </div>

      {result?.ok ? (
        result.people.length === 0 && (hiring || result.opportunities.length === 0) ? (
          <div className="px-5 pt-6">
            <EmptyState
              title="No strong matches yet"
              body="Nobody on MusicLinkd fits this brief closely right now. Try a broader role or city."
            />
          </div>
        ) : (
          <div className="space-y-8 pt-8">
            {result.people.length ? (
              <section>
                <SectionHeader title="People who fit" />
                <ul className="space-y-3 px-5">
                  {result.people.map(({ person, reason }) => (
                    <li key={person.id} className="lift reveal overflow-hidden rounded-lg bg-card">
                      <PersonRow as="div" person={person} roleLabels={options?.person_types} />
                      <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-3">
                        <p className="text-sm">
                          <span className="font-semibold">Why they fit: </span>
                          {reason}
                        </p>
                        {person.username ? (
                          <BtnLink
                            to="/profile/$username"
                            params={{ username: person.username }}
                            variant="outline"
                            className="w-full"
                          >
                            View profile
                          </BtnLink>
                        ) : (
                          <BtnLink
                            to="/talent/$id"
                            params={{ id: person.id }}
                            variant="outline"
                            className="w-full"
                          >
                            View profile
                          </BtnLink>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {!hiring && result.opportunities.length ? (
              <section>
                <SectionHeader title="Open opportunities" />
                <div className="space-y-3 px-5">
                  {result.opportunities.map(({ row, reason }) => {
                    const o = opportunityFromRow(row, labels.data ?? {});
                    return (
                      <div key={row.id} className="lift reveal space-y-2">
                        <OpportunityCard
                          o={o}
                          saved={saved.has(o.id)}
                          onSave={() => saved.toggle(o.id)}
                        />
                        <p className="px-1 text-sm">
                          <span className="font-semibold">Why it fits: </span>
                          {reason}
                        </p>
                        <BtnLink
                          to="/opportunities/$id"
                          params={{ id: row.id }}
                          variant="outline"
                          className="w-full"
                        >
                          View opportunity
                        </BtnLink>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
            <p className="px-5 text-1 text-muted-foreground">
              Matches are suggested by AI from public profiles. Check a profile before you reach
              out.
            </p>
          </div>
        )
      ) : null}
    </Screen>
  );
}
