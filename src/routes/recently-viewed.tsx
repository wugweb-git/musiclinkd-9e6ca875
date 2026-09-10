import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState } from "@/components/ml/kit";
import { studios, talents } from "@/data/discover";

export const Route = createFileRoute("/recently-viewed")({
  head: () => ({
    meta: [
      { title: "Recently viewed | MusicLinkd" },
      { name: "description", content: "The profiles, studios and listings you looked at, so you can get back to them." },
      { property: "og:title", content: "Recently viewed | MusicLinkd" },
      { property: "og:description", content: "Profiles and listings you looked at recently." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecentlyViewed,
});

function RecentlyViewed() {
  const people = talents.slice(0, 4);
  const spaces = studios.slice(0, 2);
  const empty = people.length === 0 && spaces.length === 0;

  return (
    <Screen>
      <TopBar title="Recently viewed" subtitle="Last 30 days" back="/" />

      <div className="space-y-5 px-5 pt-4 pb-8">
        {empty ? (
          <EmptyState title="Nothing here yet" body="Profiles and studios you open will be listed here for a month.">
            <Link to="/">
              <Btn>Start discovering</Btn>
            </Link>
          </EmptyState>
        ) : (
          <>
            <section>
              <p className="mb-2 text-sm font-semibold">People</p>
              <div className="space-y-3">
                {people.map((t) => (
                  <Link key={t.id} to="/talent/$id" params={{ id: t.id }} className="block">
                    <Card>
                      <div className="flex items-center gap-3">
                        <img src={t.photo} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{t.name}</p>
                          <p className="truncate text-[12px] text-muted-foreground">{t.role} · {t.location}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-sm font-semibold">Studios</p>
              <div className="space-y-3">
                {spaces.map((s) => (
                  <Card key={s.name}>
                    <div className="flex items-center gap-3">
                      <img src={s.image} alt="" className="h-11 w-11 rounded-[14px] object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{s.location}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <Btn variant="ghost" className="w-full">Clear history</Btn>
          </>
        )}
      </div>
    </Screen>
  );
}
