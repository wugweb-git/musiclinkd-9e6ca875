import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Loading } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import { businessViewFromRecord, type BusinessView } from "@/lib/business-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { getMyAccountIsTalent, getMyBusiness } from "@/lib/profile-groups.functions";
import { joinParts } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";

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
  // A talent account can't turn into a business; a business needs its own account.
  const talent = useQuery({
    queryKey: ["account", "is-talent", user?.id ?? null],
    queryFn: () => getMyAccountIsTalent(),
    enabled: signedIn,
  });
  const pending = loading || (signedIn && (q.isPending || talent.isPending));
  const businesses = signedIn ? (q.data ?? []) : [];
  const canCreate = !businesses.length && !talent.data;

  return (
    <Screen>
      <TopBar
        title="Businesses"
        subtitle="Studios, labels, venues"
        back="/profile"
        // One account, one business: adding shows only while there is none.
        right={
          !canCreate || pending ? undefined : (
            <Link
              to="/business/new"
              search={{ step: "type" as const }}
              aria-label="Add business"
              className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              <Plus size={iconSize.md} />
            </Link>
          )
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
                  <div aria-hidden className="h-28 w-full bg-background" />
                )}
                <div className="space-y-2 p-4 pt-0">
                  <div className="flex items-start gap-3">
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-sm object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div aria-hidden className="h-11 w-11 shrink-0 rounded-sm bg-subtle" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{b.name}</p>
                      <p className="truncate text-1 text-muted-foreground">
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
                    <div className="flex gap-4 text-1 text-muted-foreground">
                      <span>
                        ★ {b.rating} ({b.reviewCount})
                      </span>
                    </div>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))
        ) : talent.data ? (
          <EmptyState
            title="A business has its own account"
            body="Your talent profile stays as it is. Add a business account, then switch between the two."
          >
            <BtnLink to="/accounts" className="w-full">
              Add a Business Account
            </BtnLink>
          </EmptyState>
        ) : (
          <EmptyState
            title="No business yet"
            body="A business profile has its own spaces, services and bookings."
          >
            <BtnLink to="/business/new" search={{ step: "type" as const }} className="w-full">
              Create a Business
            </BtnLink>
          </EmptyState>
        )}
      </div>
    </Screen>
  );
}
