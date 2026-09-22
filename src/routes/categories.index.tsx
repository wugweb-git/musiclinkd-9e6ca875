import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { categories } from "@/data/discover";
import { roleIcon } from "@/lib/role-icons";
import { useTaxonomy } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Browse Categories | MusicLinkd" },
      {
        name: "description",
        content:
          "Browse singers, musicians, DJs, engineers, composers, bands, studios, labels, venues and music schools.",
      },
      { property: "og:title", content: "Browse Categories | MusicLinkd" },
      {
        property: "og:description",
        content: "Every corner of India's music industry, organised in one directory.",
      },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { options } = useTaxonomy();
  const roles = options?.person_types ?? [];

  return (
    <Screen>
      <TopBar title="Browse categories" subtitle="Find people by what they do" back="/discover" />
      <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle mx-5 my-5">
        {categories.map((c) => {
          const option = roles.find((o) => o.slug === c.role);
          const Icon = option ? roleIcon(option) : roleIcon({ slug: c.role, metadata: null });
          return (
            <li key={c.slug}>
              <Link
                to="/categories/$slug"
                params={{ slug: c.slug }}
                className="state-layer flex items-center gap-3 px-4 py-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-icon-chip">
                  <Icon
                    size={20}
                    strokeWidth={1.75}
                    className="text-primary-foreground"
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1 truncate text-2">{c.label}</span>
                <ChevronRight
                  size={iconSize.md}
                  className="shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
