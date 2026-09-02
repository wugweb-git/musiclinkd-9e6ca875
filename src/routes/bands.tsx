import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Screen, TopBar, SearchBar, Btn } from "@/components/ml/ui";
import { Card, Segmented, StatusPill, EmptyState, Loading } from "@/components/ml/kit";
import { bands, myBandId } from "@/data/band";

export const Route = createFileRoute("/bands")({
  head: () => ({
    meta: [
      { title: "Bands & Groups | MusicLinkd" },
      { name: "description", content: "Discover working bands, manage your own group, and find members on MusicLinkd." },
      { property: "og:title", content: "Bands & Groups | MusicLinkd" },
      { property: "og:description", content: "Discover working bands and manage your own group." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BandsIndex,
});

const tabs = ["Discover", "My bands"] as const;

function BandsIndex() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Discover");
  const [q, setQ] = useState("");
  const [loading] = useState(false);

  const list = bands.filter((b) =>
    (q ? `${b.name} ${b.genres.join(" ")} ${b.city}`.toLowerCase().includes(q.toLowerCase()) : true) &&
    (tab === "My bands" ? b.id === myBandId : true),
  );

  return (
    <Screen>
      <TopBar
        title="Bands"
        subtitle="Groups, line-ups and open seats"
        right={
          <Link to="/bands/new" aria-label="Create a band" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Plus size={18} aria-hidden />
          </Link>
        }
      />
      <div className="space-y-4 px-5 pt-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search bands, genres, cities" />
        <Segmented value={tab} options={tabs} onChange={setTab} />

        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <EmptyState title="No bands here yet" body="Create your group and invite the people you already play with.">
            <Link to="/bands/new"><Btn className="w-full">Create a band</Btn></Link>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {list.map((b) => (
              <Link key={b.id} to="/bands/$id" params={{ id: b.id }} className="block">
                <Card className="p-0 overflow-hidden">
                  <img src={b.cover} alt="" loading="lazy" className="h-28 w-full object-cover" />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <img src={b.avatar} alt="" loading="lazy" className="-mt-10 h-14 w-14 shrink-0 rounded-2xl border-2 border-card object-cover" />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[17px] leading-tight">{b.name}</h2>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{b.genres.join(" · ")} · {b.city}</p>
                      </div>
                      <StatusPill label={b.availability} tone={b.availability === "Available" ? "good" : b.availability === "Booked" ? "bad" : "warn"} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-[13px] text-text2">{b.tagline}</p>
                    <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Users size={14} aria-hidden />
                      <span className="truncate">{b.members.length} members · {b.followers.toLocaleString()} followers</span>
                    </div>
                    {b.lookingFor.length ? (
                      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                        {b.lookingFor.map((l) => (
                          <span key={l} className="shrink-0 rounded-full bg-subtle px-3 py-1 text-[11px] font-semibold text-text2">Looking for: {l}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
