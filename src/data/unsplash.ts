/**
 * Photos in the hardcoded content (`src/data/*`) are Unsplash images (owner, 4 Oct 2026: keep
 * Unsplash). One builder for every module, so the URL shape, crop and quality are set in one place.
 * `id` is the Unsplash photo id ("photo-1598488035139-bdbb2231ce04").
 */
export function unsplash(id: string, w: number, opts: { h?: number; q?: number } = {}) {
  const h = opts.h ? `&h=${opts.h}` : "";
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}${h}&q=${opts.q ?? 80}`;
}
