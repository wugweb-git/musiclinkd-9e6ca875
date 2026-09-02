import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Btn, TopBar } from "@/components/ml/ui";
import { AudioPreview, PortfolioSkeleton, StateCard, StatusPill } from "@/components/ml/portfolio";
import { demoPortfolio, workType, type PortfolioItem } from "@/data/portfolio";
import { deletePortfolioItem, getMyPortfolioItem } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio/$id")({
  head: () => ({
    meta: [
      { title: "Work detail — MusicLinkd portfolio" },
      {
        name: "description",
        content: "Preview a portfolio work exactly as people will see it, then edit, share or publish.",
      },
      { property: "og:title", content: "Work detail — MusicLinkd portfolio" },
      { property: "og:description", content: "Media, credits, metadata and visibility for this work." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkDetail,
});

function WorkDetail() {
  const { id } = Route.useParams();
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
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-24">
      <TopBar title="Work" back="/portfolio" />
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
            action={
              <Link to="/portfolio">
                <Btn>Back to portfolio</Btn>
              </Link>
            }
          />
        ) : null}

        {item ? (
          <>
            <section className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl" aria-hidden>
                  {workType(item.kind).emoji}
                </span>
                <StatusPill published={item.published} />
              </div>
              <h1 className="mt-3 text-[24px] leading-tight">{item.title}</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {workType(item.kind).label}
                {item.release_year ? ` · ${item.release_year}` : ""}
              </p>
              {item.role ? (
                <p className="mt-2 text-sm font-semibold text-primary">{item.role}</p>
              ) : null}
              {item.description ? (
                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </section>

            {item.media_url && workType(item.kind).media === "audio" ? (
              <div className="mt-4">
                <AudioPreview src={item.media_url} title={item.title} />
              </div>
            ) : null}

            {item.media_url && workType(item.kind).media !== "audio" ? (
              <a
                href={item.media_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-3xl border border-border bg-card p-4 text-sm font-semibold text-primary"
              >
                Open media link ↗
              </a>
            ) : null}

            {item.collaborators.length ? (
              <section className="mt-4 rounded-3xl border border-border bg-card p-4">
                <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Credits
                </h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {item.collaborators.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {demo ? null : (
                <Link to="/portfolio/$id/edit" params={{ id }}>
                  <Btn>Edit</Btn>
                </Link>
              )}
              <Btn variant="outline" onClick={share}>
                Share
              </Btn>
              <Link to="/portfolio/new">
                <Btn variant="outline">Add another</Btn>
              </Link>
            </div>

            {demo ? null : (
              <button
                type="button"
                onClick={onDelete}
                className="mt-6 w-full text-center text-sm font-semibold text-primary"
              >
                Delete this work
              </button>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
