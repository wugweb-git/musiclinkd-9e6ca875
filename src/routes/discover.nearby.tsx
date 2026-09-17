import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { studios, talents } from "@/data/discover";
import { listStudios } from "@/lib/catalog.functions";
import { listPeopleByRole } from "@/lib/profile-groups.functions";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { discoverStudioFromRow } from "@/lib/studio-view";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/discover/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby on MusicLinkd" },
      {
        name: "description",
        content: "Musicians, studios and rooms close enough to actually work with this week.",
      },
      { property: "og:title", content: "Nearby on MusicLinkd" },
      { property: "og:description", content: "People and studios close to you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  // Database studios and people follow the seeded ones; without them the lists show seed data only.
  loader: async () => {
    const [rows, labels, dbPeople] = await Promise.all([
      listStudios().catch(() => []),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
      listPeopleByRole({ data: {} }).catch(() => []),
    ]);
    return { dbStudios: rows.map((row) => discoverStudioFromRow(row, labels)), dbPeople };
  },
  component: Nearby,
});

const radii = ["2 km", "5 km", "10 km", "City"];

function Nearby() {
  const { dbStudios, dbPeople } = Route.useLoaderData();
  const [radius, setRadius] = useState(radii[1]!);
  const [allowed, setAllowed] = useState(false);

  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Nearby" back="/discover" />
        <div className="space-y-4 px-5 pt-6">
          <Card className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-background text-foreground">
              <MapPin size={iconSize.lg} />
            </span>
            <h2 className="mt-3 text-3 leading-tight">Show people near you</h2>
            <p className="mt-2 text-1 text-muted-foreground">
              We only use your location to sort results by distance. It is never shown on your
              profile.
            </p>
          </Card>
          <Btn className="w-full" onClick={() => setAllowed(true)}>
            Use My Location
          </Btn>
          <BtnLink to="/search" variant="ghost" className="w-full">
            Pick a City Instead
          </BtnLink>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Nearby" subtitle="Sorted by distance" back="/discover" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <div className="rail no-scrollbar flex gap-2 overflow-x-auto">
          {radii.map((r) => (
            <Chip key={r} active={radius === r} onClick={() => setRadius(r)}>
              {r}
            </Chip>
          ))}
        </div>

        <section>
          <p className="mb-2 text-sm font-semibold">Studios around you</p>
          {studios.length || dbStudios.length ? (
            <div className="space-y-3">
              {studios.slice(0, 4).map((s) => (
                <Card key={s.name}>
                  <div className="flex items-center gap-3">
                    <img
                      src={s.photo}
                      alt=""
                      className="h-12 w-12 rounded-[14px] object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="truncate text-1 text-muted-foreground">{s.location}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {dbStudios.map((s) => (
                <Link key={s.slug} to="/booking/$id" params={{ id: s.slug }} className="block">
                  <Card>
                    <div className="flex items-center gap-3">
                      {s.photo ? (
                        <img
                          src={s.photo}
                          alt=""
                          className="h-12 w-12 rounded-[14px] object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        {s.location ? (
                          <p className="truncate text-1 text-muted-foreground">{s.location}</p>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing within this radius" body="Try widening the distance." />
          )}
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">People around you</p>
          {talents.length || dbPeople.length ? (
            <div className="space-y-3">
              {talents.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  to="/profile/$username"
                  params={{ username: t.id }}
                  className="block"
                >
                  <Card>
                    <div className="flex items-center gap-3">
                      <img
                        src={t.photo}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{t.name}</p>
                        <p className="truncate text-1 text-muted-foreground">
                          {t.role} · {t.location}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
              {dbPeople.map((p) =>
                p.username ? (
                  <Link
                    key={p.id}
                    to="/profile/$username"
                    params={{ username: p.username }}
                    className="block"
                  >
                    <Card>
                      <div className="flex items-center gap-3">
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{p.name}</p>
                          <p className="truncate text-1 text-muted-foreground">
                            {[p.roles[0], p.city].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ) : null,
              )}
            </div>
          ) : (
            <EmptyState title="Nobody nearby yet" body="Try widening the distance." />
          )}
        </section>
      </div>
    </Screen>
  );
}
