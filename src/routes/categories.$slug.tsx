import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar } from "@/components/ml/ui";
import { PersonRow } from "@/components/ml/cards";
import { StateCard } from "@/components/ml/portfolio";
import { categories } from "@/data/discover";
import { listPeopleByRole } from "@/lib/profile-groups.functions";
import { useTaxonomy } from "@/lib/taxonomy";

/*
 * One category of people, e.g. /categories/singers. The list is the live profiles table filtered by
 * the category's taxonomy role; there are no counts, because nothing counts them honestly yet.
 */
export const Route = createFileRoute("/categories/$slug")({
  loader: ({ params }) => {
    // Studios are a dedicated table (public.studios), not a profiles.roles tag, so the
    // people-by-role query here would always come back empty. /studio is the real listing.
    if (params.slug === "studios") throw redirect({ to: "/studio", replace: true });
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
          <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
            {people.data.map((p) => (
              <PersonRow key={p.id} person={p} roleLabels={options?.person_types} />
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}
