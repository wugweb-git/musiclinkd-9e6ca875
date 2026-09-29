import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Chip, IconBtn } from "@/components/ml/ui";
import { sinceThen } from "@/lib/device-history";
import { removeSavedSearch, type SavedSearch } from "@/lib/searches.functions";
import { iconSize } from "@/lib/tokens";

/** A kept search on the Saved screens: run it again, or let it go. */
export function SavedSearchRow({ search }: { search: SavedSearch }) {
  const queryClient = useQueryClient();
  const remove = useServerFn(removeSavedSearch);
  const drop = useMutation({
    mutationFn: () => remove({ data: { id: search.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches", search.scope] }),
    onError: () => toast.error("That didn't save. Try again."),
  });
  return (
    <article className="flex items-center justify-between gap-3 rounded-lg bg-subtle p-4">
      <div className="min-w-0">
        <p className="truncate text-1 font-semibold">{search.query}</p>
        <p className="text-1 text-muted-foreground">Saved {sinceThen(search.createdAt)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {search.scope === "rent" ? (
          <Link to="/marketplace/rent/search" search={{ q: search.query }}>
            <Chip>View</Chip>
          </Link>
        ) : (
          <Link to="/marketplace/search" search={{ q: search.query }}>
            <Chip>View</Chip>
          </Link>
        )}
        <IconBtn
          label="Remove Saved Search"
          variant="ghost"
          className="h-10 w-10"
          loading={drop.isPending}
          onClick={() => drop.mutate()}
        >
          <X size={iconSize.sm} aria-hidden />
        </IconBtn>
      </div>
    </article>
  );
}
