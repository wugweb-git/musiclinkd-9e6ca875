import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, LoadError, Loading, StatusPill } from "@/components/ml/kit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/components/ml/viewer";
import { askForReview, listReviewAskTargets } from "@/lib/reviews.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/reviews/request")({
  head: () => ({
    meta: [
      { title: "Ask for a review | MusicLinkd" },
      {
        name: "description",
        content:
          "Ask people you have already worked with to leave a review, and send one polite reminder.",
      },
      { property: "og:title", content: "Ask for a review | MusicLinkd" },
      {
        property: "og:description",
        content: "Request reviews from past clients and collaborators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestReviews,
});

const WEEK = 7 * 86_400_000;

function RequestReviews() {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listReviewAskTargets);
  const ask = useServerFn(askForReview);
  const q = useQuery({
    queryKey: ["reviews", "ask-targets"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const send = useMutation({
    mutationFn: (v: { profileId: string; context: string; remind: boolean }) => ask({ data: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews", "ask-targets"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't send. Try again."),
  });
  const reviewRequestTargets = q.data ?? [];

  return (
    <Screen>
      <TopBar
        title="Ask for a review"
        subtitle="Only people you actually worked with"
        back="/reviews"
      />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Card>
          <p className="text-1 text-muted-foreground">
            You can ask once, and send one reminder a week later. After that the request quietly
            expires — no chasing.
          </p>
        </Card>

        {q.isLoading ? (
          <Loading rows={2} />
        ) : q.isError ? (
          <LoadError what="who you can ask" />
        ) : reviewRequestTargets.length ? (
          <div className="space-y-3">
            {reviewRequestTargets.map((t) => {
              const pending = send.isPending && send.variables.profileId === t.id;
              const state = t.remindedAt ? "reminded" : t.askedAt ? "asked" : undefined;
              // The one reminder opens a week after asking.
              const tooSoon =
                state === "asked" && Date.now() - new Date(t.askedAt!).getTime() < WEEK;
              return (
                <Card key={t.id}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {t.photo ? <AvatarImage src={t.photo} alt="" /> : null}
                      <AvatarFallback className="bg-background text-1 font-semibold text-muted-foreground">
                        {initialsOf(t.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="truncate text-1 text-muted-foreground">{t.context}</p>
                    </div>
                    {state ? (
                      <StatusPill
                        label={state === "reminded" ? "Reminded" : "Asked"}
                        tone={state === "reminded" ? "warn" : "good"}
                      />
                    ) : null}
                  </div>
                  <Btn
                    variant={state ? "outline" : "primary"}
                    className="mt-3 w-full"
                    loading={pending}
                    disabled={state === "reminded" || tooSoon}
                    onClick={() =>
                      send.mutate({
                        profileId: t.id,
                        context: t.context,
                        remind: state === "asked",
                      })
                    }
                  >
                    {state === "reminded"
                      ? "Reminder sent"
                      : state === "asked"
                        ? "Send a reminder"
                        : "Ask for a review"}
                  </Btn>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Nobody to ask yet"
            body="Once a booking, order or rental completes, they show up here."
          />
        )}
      </div>
    </Screen>
  );
}
