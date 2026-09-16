import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Loading } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import { businessViewFromRecord, type BusinessView } from "@/lib/business-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { getMyBusiness } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/business/")({
  head: () => ({
    meta: [
      { title: "Business profiles | MusicLinkd" },
      {
        name: "description",
        content:
          "Studios, labels, venues and agencies you run — separate from your personal profile.",
      },
      { property: "og:title", content: "Business profiles | MusicLinkd" },
      { property: "og:description", content: "Manage the businesses you own on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessHome,
});

/** The signed-in account when it is a business account; none without a session. */
async function loadMyBusiness(): Promise<BusinessView[]> {
  const [record, labels] = await Promise.all([
    getMyBusiness(),
    getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
  ]);
  return record ? [businessViewFromRecord(record, labels)] : [];
}

function BusinessHome() {
  const { user, signedIn, loading } = useAuth();
  const q = useQuery({
    queryKey: ["business", "mine", user?.id ?? null],
    queryFn: loadMyBusiness,
    enabled: signedIn,
  });
  const pending = loading || (signedIn && q.isPending);
  const businesses = signedIn ? (q.data ?? []) : [];

  return (
    <Screen>
      <TopBar
        title="Businesses"
        subtitle="Studios, labels, venues"
        back="/me"
        right={
          <Link
            to="/business/new"
            search={{ step: "type" as const }}
            aria-label="Add business"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus size={18} />
          </Link>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {pending ? (
          <Loading rows={1} />
        ) : businesses.length ? (
          businesses.map((b) => (
            <Link key={b.id} to="/business/$id" params={{ id: b.id }} className="block">
              <Card className="space-y-3 p-0 overflow-hidden">
                {b.cover ? (
                  <img src={b.cover} alt="" className="h-28 w-full object-cover" loading="lazy" />
                ) : (
                  <div aria-hidden className="h-28 w-full bg-subtle" />
                )}
                <div className="space-y-2 p-4 pt-0">
                  <div className="flex items-start gap-3">
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div aria-hidden className="h-11 w-11 shrink-0 rounded-md bg-subtle" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{b.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {joinParts(b.typeLabel, b.city)}
                      </p>
                    </div>
                    {b.verified ? (
                      <StatusPill label="verified" tone="good" />
                    ) : (
                      <StatusPill label="unverified" tone="neutral" />
                    )}
                  </div>
                  {b.rating != null && b.reviewCount != null ? (
                    <div className="flex gap-4 text-[11px] text-muted-foreground">
                      <span>
                        ★ {b.rating} ({b.reviewCount})
                      </span>
                    </div>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <EmptyState
            title="No business yet"
            body="A business profile is separate from you — it has its own team, spaces and bookings."
          >
            <BtnLink to="/business/new" search={{ step: "type" as const }} className="w-full">
              Create a business
            </BtnLink>
          </EmptyState>
        )}

        <Card className="space-y-1">
          <p className="flex items-center gap-2 text-[13px] font-semibold">
            <Building2 size={15} /> Work at a studio you do not own?
          </p>
          <p className="text-[12px] text-muted-foreground">
            Ask the owner to invite you as staff — you keep your own profile and appear on their
            team.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
