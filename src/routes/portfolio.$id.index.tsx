import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { Btn, BtnLink, IconBtn, IconBtnLink, Screen, TopBar } from "@/components/ml/ui";
import {
  analyticsFor,
  AudioPlayer,
  CreditRow,
  PortfolioSkeleton,
  StateCard,
  StatusPill,
  VideoPlayer,
  WorkAnalytics,
  WorkTypeIcon,
} from "@/components/ml/portfolio";
import { demoPortfolio, workType, type PortfolioItem } from "@/data/portfolio";
import { deletePortfolioItem, getMyPortfolioItem } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";

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
  const remove = useServerFn(deletePortfolioItem);

  const demo = demoPortfolio.find((d) => d.id === id) ?? null;
  const q = useQuery({
    queryKey: ["portfolio", "item", id],
    queryFn: () => fetchItem({ data: { id } }) as Promise<PortfolioItem | null>,
    enabled: signedIn && !demo,
  });

  const item = demo ?? q.data ?? null;

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
    if (navigator.share) {
      await navigator.share({ title: item?.title ?? "My work", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <Screen bottomNav={false} className="pb-32">
      <TopBar title={onboarding ? "Your first work" : "Work"} back="/portfolio" />
      <main className="px-5 pt-4">
        {signedIn && !demo && q.isLoading ? <PortfolioSkeleton /> : null}

        {signedIn && q.isError ? (
          <StateCard
            tone="error"
            title="We couldn't load this work"
            body="Check your connection and try again."
            action={<Btn onClick={() => q.refetch()}>Retry</Btn>}
          />
        ) : null}

        {!loading && !q.isLoading && !item ? (
          <StateCard
            title="This work is no longer available"
            body="It may have been deleted, archived, or you don't have permission to view it."
            action={<BtnLink to="/portfolio">Back to Portfolio</BtnLink>}
          />
        ) : null}

        {item ? (
          <>
            <section className="rounded-lg border border-border bg-card p-5">
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
                className="mt-4 block rounded-lg border border-border bg-card p-4 text-sm font-semibold text-foreground"
              >
                Open media link ↗
              </a>
            ) : null}

            {item.collaborators.length ? (
              <section className="mt-4 rounded-lg border border-border bg-card p-4">
                <h2 className="pill bg-subtle text-muted-foreground">Credits</h2>
                <div className="mt-2 space-y-2">
                  {item.collaborators.map((c) => (
                    <CreditRow key={c} name={c} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-6">
              <h2 className="text-2">Performance</h2>
              <div className="mt-3">
                <WorkAnalytics figures={analyticsFor(item.id)} />
              </div>
            </section>

            {/* Icon-only actions: each label is the button's accessible name and tooltip. */}
            <div className="mt-6 flex items-center gap-2">
              {demo ? null : (
                <IconBtnLink
                  to="/portfolio/$id/edit"
                  params={{ id }}
                  label="Edit Work"
                  variant="ink"
                  className="h-11 w-11"
                >
                  <Pencil size={18} aria-hidden />
                </IconBtnLink>
              )}
              <IconBtn label="Share Work" variant="outline" className="h-11 w-11" onClick={share}>
                <Share2 size={18} aria-hidden />
              </IconBtn>
              <IconBtnLink
                to="/portfolio/new"
                label="Add Another Work"
                variant="outline"
                className="h-11 w-11"
              >
                <Plus size={18} aria-hidden />
              </IconBtnLink>
              {demo ? null : (
                <IconBtn
                  label="Delete This Work"
                  variant="outline"
                  className="ml-auto h-11 w-11 text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 size={18} aria-hidden />
                </IconBtn>
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* New user: the first work is published; the flow carries on to Review profile. */}
      {onboarding && item?.published ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app bg-background/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <BtnLink to="/onboarding/preview" className="w-full">
            Continue to Review Profile
          </BtnLink>
        </div>
      ) : null}
    </Screen>
  );
}
