import { Link } from "@tanstack/react-router";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { IconBtn } from "@/components/ml/ui";
import { EmptyState, LoadError, Loading } from "@/components/ml/kit";
import { listMySavedSearches, removeSavedSearch, type SavedSearch } from "@/lib/searches.functions";
import { iconSize } from "@/lib/tokens";

/** The cache entry a scope's saved searches live in: the same one the search screens save into. */
const savedSearchesKey = (scope: SavedSearch["scope"]) => ["searches", "saved", scope] as const;

/**
 * A kept search, from saved_searches: the row runs it again (one link), and a separate button
 * removes the stored record. Never a button inside the link.
 */
export function SavedSearchRow({ search }: { search: SavedSearch }) {
  const queryClient = useQueryClient();
  const remove = useServerFn(removeSavedSearch);
  const drop = useMutation({
    mutationFn: () => remove({ data: { id: search.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchesKey(search.scope) }),
    onError: () => toast.error("That didn't remove. Try again."),
  });
  const saved = `Saved ${new Date(search.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}`;
  const body = (
    <>
      <span className="block truncate text-sm font-semibold">{search.query}</span>
      <span className="block text-1 text-muted-foreground">{saved}</span>
    </>
  );
  const link = "state-layer min-w-0 flex-1 rounded-sm py-1";
  return (
    <article className="flex items-center gap-3 rounded-lg bg-subtle p-3 pl-4">
      {search.scope === "rent" ? (
        <Link to="/marketplace/rent/search" search={{ q: search.query }} className={link}>
          {body}
        </Link>
      ) : search.scope === "market" ? (
        <Link to="/marketplace/search" search={{ q: search.query }} className={link}>
          {body}
        </Link>
      ) : (
        <Link to="/search" search={{ q: search.query }} className={link}>
          {body}
        </Link>
      )}
      <IconBtn
        label={`Remove saved search ${search.query}`}
        variant="ghost"
        loading={drop.isPending}
        onClick={() => drop.mutate()}
      >
        <X size={iconSize.sm} aria-hidden />
      </IconBtn>
    </article>
  );
}

/** Every saved search of this account, newest first, with its own loading, empty and error states. */
export function SavedSearchList() {
  const load = useServerFn(listMySavedSearches);
  const scopes = ["market", "rent", "global"] as const;
  const lists = useQueries({
    queries: scopes.map((scope) => ({
      queryKey: savedSearchesKey(scope),
      queryFn: () => load({ data: { scope } }),
    })),
  });
  if (lists.some((l) => l.isLoading)) return <Loading rows={2} />;
  if (lists.some((l) => l.isError)) return <LoadError what="your saved searches" />;
  const all = lists
    .flatMap((l) => l.data ?? [])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!all.length)
    return (
      <EmptyState
        kind="action-required"
        icon={<Search size={iconSize.lg} aria-hidden />}
        title="No saved searches"
        body="Save a search in Market or Search to run it again from here."
      />
    );
  return (
    <div className="space-y-2">
      {all.map((s) => (
        <SavedSearchRow key={s.id} search={s} />
      ))}
    </div>
  );
}
