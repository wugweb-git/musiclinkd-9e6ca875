import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Chip, IconBtn } from "@/components/ml/ui";
import type { Listing } from "@/data/market";
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

export type SellerSummary = {
  id: string;
  name: string;
  photo: string;
  listings: number;
};

/** The distinct sellers behind a set of Market listings, in listing order, with their counts. */
// eslint-disable-next-line react-refresh/only-export-components -- helper co-located with SellerRow
export function sellersOf(items: Listing[]): SellerSummary[] {
  const seen = new Map<string, SellerSummary>();
  for (const l of items) {
    const o = l.owner;
    if (!o?.id) continue;
    const known = seen.get(o.id);
    if (known) known.listings += 1;
    else seen.set(o.id, { id: o.id, name: o.name, photo: o.photo, listings: 1 });
  }
  return [...seen.values()];
}

export function SellerRow({ seller }: { seller: SellerSummary }) {
  return (
    <Link
      to="/marketplace/seller/$id"
      params={{ id: seller.id }}
      className="flex items-center gap-3 rounded-lg bg-subtle p-4"
    >
      {seller.photo ? (
        <img src={seller.photo} alt={seller.name} className="h-12 w-12 rounded-sm object-cover" />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-sm bg-background" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="truncate text-1 font-semibold">{seller.name}</p>
        <p className="truncate text-1 text-muted-foreground">
          {seller.listings} {seller.listings === 1 ? "listing" : "listings"}
        </p>
      </div>
    </Link>
  );
}
