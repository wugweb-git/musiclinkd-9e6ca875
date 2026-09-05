import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Building2 } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState } from "@/components/ml/kit";
import { myBusinesses, businessTypeLabel } from "@/data/business";

export const Route = createFileRoute("/business/")({
  head: () => ({
    meta: [
      { title: "Business profiles | MusicLinkd" },
      { name: "description", content: "Studios, labels, venues and agencies you run — separate from your personal profile." },
      { property: "og:title", content: "Business profiles | MusicLinkd" },
      { property: "og:description", content: "Manage the businesses you own on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessHome,
});

function BusinessHome() {
  return (
    <Screen>
      <TopBar
        title="Businesses"
        subtitle="Studios, labels, venues"
        back="/me"
        right={
          <Link to="/business/new" aria-label="Add business" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus size={18} />
          </Link>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {myBusinesses.length ? (
          myBusinesses.map((b) => (
            <Link key={b.id} to="/business/$id" params={{ id: b.id }} className="block">
              <Card className="space-y-3 p-0 overflow-hidden">
                <img src={b.cover} alt="" className="h-28 w-full object-cover" loading="lazy" />
                <div className="space-y-2 p-4 pt-0">
                  <div className="flex items-start gap-3">
                    <img src={b.logo} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{b.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {businessTypeLabel(b.type)} · {b.city}
                      </p>
                    </div>
                    {b.verified ? <StatusPill label="verified" tone="good" /> : <StatusPill label="unverified" tone="neutral" />}
                  </div>
                  <div className="flex gap-4 text-[11px] text-muted-foreground">
                    <span>{b.stats.followers} followers</span>
                    <span>{b.stats.bookings} bookings</span>
                    <span>★ {b.stats.rating} ({b.stats.reviews})</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <EmptyState title="No business yet" body="A business profile is separate from you — it has its own team, spaces and bookings.">
            <Link to="/business/new">
              <Btn className="w-full">Create a business</Btn>
            </Link>
          </EmptyState>
        )}

        <Card className="space-y-1">
          <p className="flex items-center gap-2 text-[13px] font-semibold">
            <Building2 size={15} /> Work at a studio you do not own?
          </p>
          <p className="text-[12px] text-muted-foreground">
            Ask the owner to invite you as staff — you keep your own profile and appear on their team.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
