/** Options whose label contains the query, case-insensitive. */
export function matching<T extends { label: string }>(options: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : [...options];
}
