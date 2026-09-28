import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { ActionBar, Btn, BtnLink, IconBtn, IconBtnLink, Screen, TopBar } from "@/components/ml/ui";
import {
  AudioPlayer,
  CreditRow,
  PortfolioSkeleton,
  StateCard,
  StatusPill,
  VideoPlayer,
  WorkAnalytics,
  WorkTypeIcon,
} from "@/components/ml/portfolio";
import { workType, type PortfolioItem } from "@/data/portfolio";
import { Dialog } from "@/components/ml/kit";
import {
  deletePortfolioItem,
  getMyPortfolioItem,
  getPublicPortfolioItem,
  myPortfolioEvents,
  myPortfolioPlays,
} from "@/lib/portfolio.functions";
import { recordWorkEvent } from "@/lib/work-events";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

type FlowSearch = { from?: "onboarding" };

export const Route = createFileRoute("/portfolio/$id/")({
  // `from=onboarding`: the new user's first work, between the last question and Review profile.
  validateSearch: (search: Record<string, unknown>): FlowSearch =>
    search["from"] === "onboarding" ? { from: "onboarding" } : {},
  head: () => ({
    meta: [
      { title: "Work detail — MusicLinkd portfolio" },
      {
        name: "description",
        content:
          "Preview a portfolio work exactly as people will see it, then edit, share or publish.",
      },
      { property: "og:title", content: "Work detail — MusicLinkd portfolio" },
      {
        property: "og:description",
        content: "Media, credits, metadata and visibility for this work.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkDetail,
});

function WorkDetail() {
  const { id } = Route.useParams();
  const { from } = Route.useSearch();
  const onboarding = from === "onboarding";
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const fetchItem = useServerFn(getMyPortfolioItem);
  const fetchPublic = useServerFn(getPublicPortfolioItem);
  const remove = useServerFn(deletePortfolioItem);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // The owner's own row (drafts too); for anybody else holding the link, the published work.
  const q = useQuery({
    queryKey: ["portfolio", "item", id, signedIn],
    queryFn: async () => {
      const mine = signedIn ? ((await fetchItem({ data: { id } })) as PortfolioItem | null) : null;
      if (mine) return { item: mine, own: true };
      const shared = (await fetchPublic({ data: { id } })) as PortfolioItem | null;
      return shared ? { item: shared, own: false } : null;
    },
    enabled: !loading,
  });

  const item = q.data?.item ?? null;
  const own = q.data?.own ?? false;

  // Plays, views, shares, saves and clicks are all counted in the database; only the owner sees them.
  const fetchPlays = useServerFn(myPortfolioPlays);
  const plays = useQuery({
    queryKey: ["portfolio", "plays"],
    queryFn: () => fetchPlays(),
    enabled: own,
  });
  const fetchEvents = useServerFn(myPortfolioEvents);
  const events = useQuery({
    queryKey: ["portfolio", "events", id],
    queryFn: () => fetchEvents({ data: { id } }),
    enabled: own,
  });
  const figures = {
    views: events.data?.views ?? null,
    plays: plays.data?.[id] ?? null,
    shares: events.data?.shares ?? null,
    saves: events.data?.saves ?? null,
    profileClicks: events.data?.profileClicks ?? null,
    linkClicks: events.data?.linkClicks ?? null,
  };

  async function onDelete() {
    try {
      await remove({ data: { id } });
      toast.success("Work deleted");
      navigate({ to: "/portfolio" });
    } catch {
      toast.error("Could not delete this work");
    }
  }

  async function share() {
    const url = window.location.href;
    // A share counts once it went somewhere: sent from the share sheet, or the link copied.
    if (navigator.share) {
      await navigator
        .share({ title: item?.title ?? "My work", url })
        .then(() => recordWorkEvent(id, "share"))
        .catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    recordWorkEvent(id, "share");
    toast.success("Link copied");
  }

  return (
    <Screen bottomNav={false} className="pb-32">
      <TopBar title={onboarding ? "Your first work" : "Work"} back="/portfolio" />
      <main className="px-5 pt-4">
        {loading || q.isLoading ? <PortfolioSkeleton /> : null}

        {q.isError ? (
          <StateCard
            tone="error"
            title="We couldn't load this work"
            body="Check your connection and try again."
            action={<Btn onClick={() => q.refetch()}>Retry</Btn>}
          />
        ) : null}

        {!loading && !q.isLoading && !q.isError && !item ? (
          <StateCard
            title="This work is no longer available"
            body="It may have been deleted, archived, or you don't have permission to view it."
            action={<BtnLink to="/portfolio">Back to Portfolio</BtnLink>}
          />
        ) : null}

        {item ? (
          <>
            <section className="rounded-lg bg-subtle p-5">
              <div className="flex items-start justify-between gap-3">
                <WorkTypeIcon kind={item.kind} />
                <StatusPill published={item.published} />
              </div>
              <h1 className="mt-3 text-3 leading-tight">{item.title}</h1>
              <p className="mt-1 text-1 text-muted-foreground">
                {workType(item.kind).label}
                {item.release_year ? ` · ${item.release_year}` : ""}
              </p>
              {item.role ? (
                <p className="mt-2 text-sm font-semibold text-foreground">{item.role}</p>
              ) : null}
              {item.description ? (
                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </section>

            {workType(item.kind).media === "audio" ? (
              <div className="mt-4">
                <AudioPlayer src={item.media_url} title={item.title} artwork={item.cover_url} />
              </div>
            ) : null}

            {item.media_url && workType(item.kind).media === "video" ? (
              <div className="mt-4">
                <VideoPlayer src={item.media_url} title={item.title} />
              </div>
            ) : null}

            {item.media_url && workType(item.kind).media !== "audio" ? (
              <a
                href={item.media_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-lg bg-subtle p-4 text-sm font-semibold text-foreground"
              >
                Open media link ↗
              </a>
            ) : null}

            {item.collaborators.length ? (
              <section className="mt-4 rounded-lg bg-subtle p-4">
                <h2 className="pill bg-background text-muted-foreground">Credits</h2>
                <div className="mt-2 space-y-2">
                  {item.collaborators.map((c) => (
                    <CreditRow key={c} name={c} />
                  ))}
                </div>
              </section>
            ) : null}

            {own ? (
              <section className="mt-6">
                <h2 className="text-2">Performance</h2>
                <div className="mt-3">
                  <WorkAnalytics figures={figures} />
                </div>
              </section>
            ) : null}

            {/* Icon-only actions: each label is the button's accessible name and tooltip. */}
            <div className="mt-6 flex items-center gap-2">
              {own ? (
                <IconBtnLink
                  to="/portfolio/$id/edit"
                  params={{ id }}
                  label="Edit Work"
                  variant="ink"
                  className="h-11 w-11"
                >
                  <Pencil size={iconSize.md} aria-hidden />
                </IconBtnLink>
              ) : null}
              <IconBtn label="Share Work" variant="outline" className="h-11 w-11" onClick={share}>
                <Share2 size={iconSize.md} aria-hidden />
              </IconBtn>
              {own ? (
                <IconBtnLink
                  to="/portfolio" search={{ add: "1" }}
                  label="Add Another Work"
                  variant="outline"
                  className="h-11 w-11"
                >
                  <Plus size={iconSize.md} aria-hidden />
                </IconBtnLink>
              ) : null}
              {own ? (
                <IconBtn
                  label="Delete This Work"
                  variant="outline"
                  className="ml-auto h-11 w-11 text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={iconSize.md} aria-hidden />
                </IconBtn>
              ) : null}
            </div>
          </>
        ) : null}
      </main>

      <Dialog
        open={confirmDelete}
        title="Delete this work?"
        body={
          item ? `"${item.title}" comes off your portfolio for good. This can't be undone.` : ""
        }
        onClose={() => setConfirmDelete(false)}
      >
        <Btn onClick={() => void onDelete()}>Delete</Btn>
        <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>
          Keep It
        </Btn>
      </Dialog>

      {/* New user: the first work is published; the flow carries on to Review profile. */}
      {onboarding && item?.published ? (
        <ActionBar>
          <BtnLink to="/onboarding/preview" className="w-full">
            Continue to Review Profile
          </BtnLink>
        </ActionBar>
      ) : null}
    </Screen>
  );
}
