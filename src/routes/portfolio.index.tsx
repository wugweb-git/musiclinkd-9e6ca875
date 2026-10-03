import { createFileRoute } from "@tanstack/react-router";
import { shareUrl } from "@/lib/site";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, X } from "lucide-react";
import { Btn, IconBtn, Screen, TopBar } from "@/components/ml/ui";
import { Dialog, StateCard } from "@/components/ml/kit";
import { toast } from "sonner";
import {
  PortfolioHeader,
  PortfolioSkeleton,
  WorkCard,
  WorkTypeSheet,
} from "@/components/ml/portfolio";
import { useEffect, useRef, useState } from "react";
import { FEATURED_LIMIT, roleSuggestions, type PortfolioItem } from "@/data/portfolio";
import {
  deletePortfolioItem,
  listMyPortfolio,
  reorderPortfolio,
  setPortfolioPublished,
} from "@/lib/portfolio.functions";
import { shareLink } from "@/lib/booking-actions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/portfolio/")({
  // ?add=1 opens the work-type drawer. Adding work is a drawer, not a screen (owner, 28 Sep 2026):
  // /portfolio/new was a step-1 screen duplicating WorkTypeSheet, and is gone.
  validateSearch: (search: Record<string, unknown>): { add?: "1"; from?: "onboarding" } => ({
    ...(search["add"] === "1" ? { add: "1" as const } : {}),
    // Onboarding hands off here to add a first work; the flag has to survive the drawer so the
    // work screen can offer "continue onboarding" (owner, 29 Sep 2026).
    ...(search["from"] === "onboarding" ? { from: "onboarding" as const } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Portfolio — MusicLinkd" },
      {
        name: "description",
        content:
          "Publish the tracks, projects, performances and credits that prove what you've done in music.",
      },
      { property: "og:title", content: "Portfolio — MusicLinkd" },
      {
        property: "og:description",
        content: "Show the work you're proud of — tracks, projects, performances and credits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioOverview,
});

function PortfolioOverview() {
  const search = Route.useSearch();
  const { signedIn, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  // ?add=1 is how every "add work" entry point across the app opens the drawer; adding work is a
  // drawer, not a screen (owner, 28 Sep 2026), so /portfolio/new is gone.
  useEffect(() => {
    if (search.add === "1" || new URLSearchParams(window.location.search).get("add") === "1") {
      setAdding(true);
    }
  }, [search.add]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<PortfolioItem | null>(null);
  const fetchItems = useServerFn(listMyPortfolio);
  const q = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => fetchItems() as Promise<PortfolioItem[]>,
    enabled: signedIn,
  });

  // The list is the editor: moving and featuring happen here, on the work itself. Only the
  // account's own stored works; signed out there are none.
  const [items, setItems] = useState<PortfolioItem[]>([]);
  useEffect(() => {
    setItems(signedIn ? (q.data ?? []) : []);
  }, [q.data, signedIn]);

  const published = items.filter((i) => i.published);
  const featured = items.filter((i) => i.featured);

  // A search on this screen looks through the account's own titles and descriptions only.
  const t = term.trim().toLowerCase();
  const visible = t
    ? items.filter((i) => `${i.title} ${i.description ?? ""}`.toLowerCase().includes(t))
    : items;
  const visibleFeatured = visible.filter((i) => i.featured);

  const saveOrder = useServerFn(reorderPortfolio);
  const save = useMutation({
    mutationFn: (next: PortfolioItem[]) =>
      saveOrder({
        data: {
          ids: next.map((i) => i.id),
          featured: next.filter((i) => i.featured).map((i) => i.id),
        },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["portfolio", "mine"] }),
    onError: (e) => {
      setItems(signedIn ? (q.data ?? []) : []);
      toast.error(e instanceof Error ? e.message : "That didn't save. Try again.");
    },
  });

  /** A tap changes the list and saves it; the list is what the profile shows. */
  function apply(next: PortfolioItem[]) {
    setItems(next);
    if (signedIn) save.mutate(next);
  }

  function toggleFeatured(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (!item.featured && featured.length >= FEATURED_LIMIT) {
      toast.error(`You can feature up to ${FEATURED_LIMIT} works`);
      return;
    }
    apply(items.map((i) => (i.id === id ? { ...i, featured: !i.featured } : i)));
  }

  /** One place up or down the whole list; the new order is what the profile shows. */
  function move(id: string, by: -1 | 1) {
    const from = items.findIndex((i) => i.id === id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to]!, next[from]!];
    apply(next);
  }

  const remove = useMutation({
    mutationFn: (id: string) => deletePortfolioItem({ data: { id } }),
    onSuccess: () => {
      setToDelete(null);
      toast.success("Work deleted");
      void queryClient.invalidateQueries({ queryKey: ["portfolio", "mine"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  function share(item: PortfolioItem) {
    const url = shareUrl(`/portfolio/${item.id}`);
    void shareLink({ title: item.title, url });
  }

  const setPublished = useServerFn(setPortfolioPublished);
  const publishToggle = useMutation({
    mutationFn: (vars: { id: string; published: boolean }) => setPublished({ data: vars }),
    onMutate: (vars) => {
      setItems((prev) =>
        prev.map((i) => (i.id === vars.id ? { ...i, published: vars.published } : i)),
      );
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["portfolio", "mine"] }),
    onError: (e) => {
      setItems(signedIn ? (q.data ?? []) : []);
      toast.error(e instanceof Error ? e.message : "That didn't save. Try again.");
    },
  });
  // Nothing to manage yet: the empty state's Add work is the one action.
  const empty =
    signedIn &&
    !authLoading &&
    !q.isLoading &&
    !q.isError &&
    q.data !== undefined &&
    items.length === 0;
  // Counts and tools wait for the list, so a new user never sees a row of zeros flash first.
  const showTools =
    signedIn && !empty && !q.isError && !q.isLoading && !authLoading && q.data !== undefined;

  return (
    <Screen bottomNav={false} className="pb-32">
      <TopBar
        title="Portfolio"
        subtitle="Show the work you're proud of"
        back="/profile"
        right={
          <div className="flex items-center gap-2">
            <IconBtn
              label={searchOpen ? "Close search" : "Search your work"}
              variant="outline"
              onClick={() => {
                setSearchOpen((v) => !v);
                setTerm("");
                requestAnimationFrame(() => searchInput.current?.focus());
              }}
            >
              {searchOpen ? (
                <X size={iconSize.md} aria-hidden />
              ) : (
                <Search size={iconSize.md} aria-hidden />
              )}
            </IconBtn>
            {/* Performance (/portfolio/analytics) is unlinked: analytics is GA's job, later (owner, 21 Sep 2026). */}
            <Btn
              variant="ink"
              className="min-h-10 px-4"
              icon={<Plus size={iconSize.sm} aria-hidden />}
              onClick={() => setAdding(true)}
            >
              Add
            </Btn>
          </div>
        }
      />

      <main className="px-5 pt-5">
        {searchOpen ? (
          <label className="mb-4 flex h-12 items-center gap-2 rounded-full bg-subtle px-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
            <Search size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={searchInput}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search your work"
              className="min-w-0 flex-1 bg-transparent text-2 outline-none"
            />
          </label>
        ) : null}

        {showTools ? (
          <PortfolioHeader
            total={items.length}
            published={published.length}
            drafts={items.length - published.length}
            featured={featured.length}
          />
        ) : null}

        {visible.length > visibleFeatured.length && visibleFeatured.length ? (
          <>
            <h2 className="mt-7 text-2 font-semibold">Featured</h2>
            <div className="mt-3 space-y-3">
              {visibleFeatured.map((item) => (
                <WorkCard key={`f-${item.id}`} item={item} />
              ))}
            </div>
          </>
        ) : null}

        {showTools && items.length ? <h2 className="mt-7 text-2 font-semibold">All work</h2> : null}
        {!empty && term && visible.length === 0 ? (
          <StateCard title="Nothing matched" body={`No work titled or described with "${term}".`} />
        ) : null}
        <div className="mt-3 space-y-3">
          {signedIn && (q.isLoading || authLoading) ? <PortfolioSkeleton /> : null}

          {signedIn && q.isError ? (
            <StateCard
              tone="error"
              title="We couldn't load your portfolio"
              body="Something went wrong on our side. Your work is safe."
              action={<Btn onClick={() => q.refetch()}>Retry</Btn>}
            />
          ) : null}

          {empty ? (
            <StateCard
              title="Your work belongs here"
              body={roleSuggestions["default"]!}
              action={<Btn onClick={() => setAdding(true)}>Add Work</Btn>}
            />
          ) : null}

          {visible.map((item) => (
            <WorkCard
              key={item.id}
              item={item}
              {...(signedIn
                ? {
                    actions: {
                      onFeature: () => toggleFeatured(item.id),
                      onTogglePublished: () =>
                        publishToggle.mutate({ id: item.id, published: !item.published }),
                      onShare: () => share(item),
                      onDelete: () => setToDelete(item),
                      canFeature: featured.length < FEATURED_LIMIT,
                      busy: save.isPending || publishToggle.isPending,
                      // Order is the whole list's, so moving waits for an unfiltered view.
                      onMoveUp:
                        !t && items[0]?.id !== item.id ? () => move(item.id, -1) : undefined,
                      onMoveDown:
                        !t && items.at(-1)?.id !== item.id ? () => move(item.id, 1) : undefined,
                    },
                  }
                : {})}
            />
          ))}
        </div>
      </main>
      <WorkTypeSheet
        open={adding}
        onClose={() => setAdding(false)}
        {...(search.from === "onboarding" ? { from: "onboarding" as const } : {})}
      />

      <Dialog
        open={toDelete !== null}
        title="Delete this work?"
        body={
          toDelete
            ? `"${toDelete.title}" comes off your portfolio for good. This can't be undone.`
            : ""
        }
        onClose={() => setToDelete(null)}
      >
        <Btn loading={remove.isPending} onClick={() => toDelete && remove.mutate(toDelete.id)}>
          Delete
        </Btn>
        <Btn variant="ghost" onClick={() => setToDelete(null)}>
          Keep It
        </Btn>
      </Dialog>
    </Screen>
  );
}
