import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin } from "lucide-react";

import { Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import { StateCard } from "@/components/ml/portfolio";
import { categories } from "@/data/discover";
import { listPeopleByRole } from "@/lib/profile-groups.functions";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";

/*
 * One category of people, e.g. /categories/singers. The list is the live profiles table filtered by
 * the category's taxonomy role; there are no counts, because nothing counts them honestly yet.
 */
export const Route = createFileRoute("/categories/$slug")({
  loader: ({ params }) => {
    const category = categories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.label ?? "Category"} | MusicLinkd` },
      {
        name: "description",
        content: `${loaderData?.category.label ?? "People"} on MusicLinkd, with their city, roles and genres.`,
      },
    ],
  }),
  component: CategoryDirectory,
});

function CategoryDirectory() {
  const { category } = Route.useLoaderData();
  const list = useServerFn(listPeopleByRole);
  const { options } = useTaxonomy();
  const people = useQuery({
    queryKey: ["category", category.role],
    queryFn: () => list({ data: { role: category.role } }),
  });

  return (
    <Screen>
      <TopBar title={category.label} back="/categories" />
      <div className="px-5 py-5">
        {people.isLoading ? (
          <ul className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-20 animate-pulse rounded-lg bg-subtle" />
            ))}
          </ul>
        ) : people.isError ? (
          <StateCard
            title="We couldn't load this list"
            body="Check your connection, then try again."
          />
        ) : !people.data?.length ? (
          <StateCard
            title={`No ${category.label.toLowerCase()} yet`}
            body="Nobody with this role has a public profile at the moment."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {people.data.map((p) => (
              <li key={p.username}>
                <Link
                  to="/profile/$username"
                  params={{ username: p.username }}
                  className="state-layer flex items-center gap-3 px-4 py-3.5"
                >
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt=""
                      loading="lazy"
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="h-11 w-11 shrink-0 rounded-full bg-subtle" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className="truncate text-2 font-semibold">{p.name}</span>
                      {p.verified ? <VerifiedBadge size={14} /> : null}
                    </span>
                    <span className="block truncate text-1 text-muted-foreground">
                      {p.headline ??
                        p.roles
                          .slice(0, 2)
                          .map((r) => labelFor(options?.person_types, r))
                          .join(" · ")}
                    </span>
                    {p.city ? (
                      <span className="mt-0.5 flex items-center gap-1 text-1 text-muted-foreground">
                        <MapPin size={12} className="shrink-0" aria-hidden />
                        {p.city}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}
