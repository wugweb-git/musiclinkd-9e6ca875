import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Chip, BtnLink, Btn } from "@/components/ml/ui";
import { EmptyState, ListingRow } from "@/components/ml/market";
import { loadMyCatalogListings } from "@/lib/market-view";
import { answerOffer, listOffersOnMyListings } from "@/lib/offers.functions";
import { inr } from "@/lib/price";
import { useAuth } from "@/hooks/use-auth";
import { TextLink } from "@/components/ml/links";

export const Route = createFileRoute("/marketplace/mine")({
  head: () => ({
    meta: [
      { title: "My Marketplace | MusicLinkd" },
      {
        name: "description",
        content: "Manage your listings, offers, enquiries and marketplace performance.",
      },
      { property: "og:title", content: "My Marketplace | MusicLinkd" },
      {
        property: "og:description",
        content: "A lightweight seller workspace for MusicLinkd Market.",
      },
    ],
  }),
  component: Mine,
});

const tabs = ["Active", "Drafts", "Offers"];

function Mine() {
  const [tab, setTab] = useState(tabs[0]!);
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const mine = useQuery({
    queryKey: ["marketplace", "mine"],
    queryFn: loadMyCatalogListings,
    enabled: signedIn,
  });
  const listings = mine.data ?? [];

  const fetchOffers = useServerFn(listOffersOnMyListings);
  const offersQuery = useQuery({
    queryKey: ["marketplace", "offers", "received"],
    queryFn: () => fetchOffers(),
    enabled: signedIn && tab === "Offers",
  });
  const answer = useServerFn(answerOffer);
  const [answering, setAnswering] = useState<string | null>(null);
  async function respond(id: string, status: "accepted" | "declined") {
    setAnswering(id);
    try {
      await answer({ data: { id, status } });
      await queryClient.invalidateQueries({ queryKey: ["marketplace", "offers", "received"] });
    } catch {
      toast.error("Couldn't save that — try again");
    } finally {
      setAnswering(null);
    }
  }

  return (
    <Screen>
      <TopBar
        title="My Marketplace"
        {...(mine.isLoading
          ? {}
          : {
              subtitle: `${listings.length} active listing${listings.length === 1 ? "" : "s"}`,
            })}
        back="/marketplace"
        right={
          <TextLink to="/marketplace/sell" className="text-1">
            New
          </TextLink>
        }
      />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5">
        {tab === "Active" ? (
          mine.isLoading ? (
            <div className="space-y-3" aria-busy>
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-subtle" />
              ))}
            </div>
          ) : listings.length ? (
            listings.map((l) => <ListingRow key={l.id} l={l} />)
          ) : (
            <EmptyState
              emoji="🛍️"
              title="No listings yet"
              body="Everything you list on the marketplace shows up here."
              action={<BtnLink to="/marketplace/sell">Create a Listing</BtnLink>}
            />
          )
        ) : null}

        {tab === "Drafts" ? (
          <EmptyState
            emoji="📝"
            title="No drafts"
            body="Start a listing and we'll keep it here until you publish."
            action={<BtnLink to="/marketplace/sell">Create a Listing</BtnLink>}
          />
        ) : null}

        {tab === "Offers" ? (
          offersQuery.isLoading ? (
            <div className="space-y-3" aria-busy>
              {[0, 1].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-subtle" />
              ))}
            </div>
          ) : (offersQuery.data ?? []).length ? (
            (offersQuery.data ?? []).map((o) => (
              <article key={o.id} className="rounded-lg bg-subtle p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-1 font-semibold">
                      {o.listing?.title ?? "Listing"}
                    </p>
                    <p className="text-1 text-muted-foreground">
                      {inr(Math.round(o.amount_paise / 100))} from{" "}
                      {o.buyer?.display_name ?? o.buyer?.username ?? "a buyer"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-background pill text-muted-foreground">
                    {o.status}
                  </span>
                </div>
                {o.message ? (
                  <p className="mt-2 text-1 text-muted-foreground">{o.message}</p>
                ) : null}
                {o.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <Btn
                      className="flex-1 text-1"
                      disabled={answering === o.id}
                      onClick={() => void respond(o.id, "accepted")}
                    >
                      Accept
                    </Btn>
                    <Btn
                      variant="outline"
                      className="flex-1 text-1"
                      disabled={answering === o.id}
                      onClick={() => void respond(o.id, "declined")}
                    >
                      Decline
                    </Btn>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              emoji="🤝"
              title="No offers yet"
              body="Offers buyers make on your listings show up here."
            />
          )
        ) : null}
      </div>
    </Screen>
  );
}
