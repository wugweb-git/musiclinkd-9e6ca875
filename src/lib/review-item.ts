import type { ReviewItem } from "@/data/profile";

/** A stored review row, as the reviews reads return it. */
type StoredReview = {
  id: string;
  rating: number | string;
  body: string;
  author_name: string;
  context?: string | null;
  tags?: string[] | null;
  created_at?: string;
};

/**
 * Any stored review in the shape the shared ReviewCard takes. Without a context the date it was
 * written stands in, so the card's top line is never empty.
 */
export function reviewItemFrom(r: StoredReview, org = ""): ReviewItem {
  const when = r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  return {
    id: r.id,
    by: r.author_name,
    org,
    context: r.context || when,
    stars: Number(r.rating),
    text: r.body,
    tags: r.tags ?? undefined,
  };
}
