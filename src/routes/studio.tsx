import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { EmptyState, Price } from "@/components/ml/kit";
import { listStudios } from "@/lib/catalog.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { discoverStudioFromRow, type DiscoverStudio } from "@/lib/studio-view";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

/*
 * Every studio. A studio is a business account with a username, so each row opens that business
 * profile; a studio whose owner has no username yet opens its booking page instead.
 */
export const Route = createFileRoute("/studio")({
  loader: async () => {
    const [rows, labels] = await Promise.all([
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    return { studios: rows.map((row) => discoverStudioFromRow(row, labels)) };
  },
  head: () => ({
    meta: [
      { title: "Studios | MusicLinkd" },
      {
        name: "description",
        content: "Recording studios and rehearsal spaces on MusicLinkd, with their rates.",
      },
      { property: "og:title", content: "Studios | MusicLinkd" },
      { property: "og:description", content: "Recording studios and rehearsal spaces." },
    ],
  }),
  component: Studios,
});

function StudioRow({ s }: { s: DiscoverStudio }) {
  const body = (
    <>
      {s.photo ? (
        <img
          src={s.photo}
          alt=""
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-sm object-cover"
        />
      ) : (
        <span aria-hidden className="h-14 w-14 shrink-0 rounded-sm bg-background" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-2 font-semibold">{s.name}</span>
        <span className="mt-0.5 flex items-center gap-1 truncate text-1 text-muted-foreground">
          {s.location ? <MapPin size={iconSize.xs} className="shrink-0" aria-hidden /> : null}
          <span className="truncate">
            {joinParts(s.location, s.rating == null ? "" : `${s.rating.toFixed(1)}`)}
          </span>
          {s.rating == null ? null : (
            <Star size={iconSize.xs} fill="currentColor" className="shrink-0" aria-hidden />
          )}
        </span>
      </span>
      <Price
        price={s.rate}
        align="end"
        amountClassName="text-sm font-semibold"
        unitClassName="text-1"
      />
    </>
  );
  const cls = "state-layer flex items-center gap-3 px-4 py-3.5";
  return s.username ? (
    <Link to="/profile/$username" params={{ username: s.username }} className={cls}>
      {body}
    </Link>
  ) : (
    <Link to="/booking/$id" params={{ id: s.slug }} className={cls}>
      {body}
    </Link>
  );
}

function Studios() {
  const { studios } = Route.useLoaderData();
  return (
    <Screen>
      <TopBar title="Studios" subtitle="Recording and rehearsal spaces" back="/home" />
      <div className="px-5 pt-4">
        {studios.length ? (
          <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
            {studios.map((s) => (
              <li key={s.slug}>
                <StudioRow s={s} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No studios yet"
            body="Studios appear here as soon as their business profiles are live."
          />
        )}
      </div>
    </Screen>
  );
}
