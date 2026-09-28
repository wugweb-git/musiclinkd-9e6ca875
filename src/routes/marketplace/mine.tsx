import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CalendarClock,
  ChevronRight,
  Eye,
  EyeOff,
  PenLine,
  Plus,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, IconBtn, IconBtnLink, Sheet } from "@/components/ml/ui";
import { Dialog, LoadError, Price, StatusPill } from "@/components/ml/kit";
import { EmptyState, MarketCategoryIcon } from "@/components/ml/market";
import {
  clearListingDraft,
  readListingDraft,
  type ListingDraft,
} from "@/components/ml/listing-form";
import { deleteListing, listMyManagedListings, type MyListing } from "@/lib/catalog.functions";
import {
  listMyIncomingRentalRequests,
  listMyListingStandings,
  setMyListingStatus,
  setRentalBookingStatus,
} from "@/lib/rentals.functions";
import { RentalStatusPill } from "@/components/ml/rental";
import { answerOffer, listOffersOnMyListings } from "@/lib/offers.functions";
import { gearCategoryOf, useGearTaxonomy } from "@/lib/listing-category";
import { inr, priceParts } from "@/lib/price";
import { iconSize } from "@/lib/tokens";
import { useAuth } from "@/hooks/use-auth";
import { DrawerList, DrawerOptionRow } from "@/components/ml/drawer-list";

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

/*
 * The seller's one place for the market (owner, 22 Sep 2026): no tabs. Numbers at the top, Add
 * listing (sell or rent out), the draft kept on this device, every listing with its own actions
 * — edit, publish or unpublish, delete — and the offers made on them.
 */

const live = (l: MyListing) => !l.listing_status || l.listing_status === "active";

const addOptions: { mode: "sell" | "rent"; label: string; icon: LucideIcon }[] = [
  { mode: "sell", label: "Sell", icon: Tag },
  { mode: "rent", label: "Rent out", icon: CalendarClock },
];

function Mine() {
  const { signedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const load = useServerFn(listMyManagedListings);
  const mine = useQuery({
    queryKey: ["marketplace", "mine", "managed"],
    queryFn: () => load(),
    enabled: signedIn,
  });
  const listings = mine.data ?? [];

  const fetchOffers = useServerFn(listOffersOnMyListings);
  const offersQuery = useQuery({
    queryKey: ["marketplace", "offers", "received"],
    queryFn: () => fetchOffers(),
    enabled: signedIn,
  });
  const offers = offersQuery.data ?? [];

  // Rentals: requests from renters to accept or decline, and which listings are out right now.
  const loadRequests = useServerFn(listMyIncomingRentalRequests);
  const requests = useQuery({
    queryKey: ["rental-bookings", "incoming"],
    queryFn: () => loadRequests(),
    enabled: signedIn,
  });
  const loadStandings = useServerFn(listMyListingStandings);
  const standings = useQuery({
    queryKey: ["marketplace", "mine", "standings"],
    queryFn: () => loadStandings(),
    enabled: signedIn,
  });
  const decideRental = useServerFn(setRentalBookingStatus);
  async function decide(id: string, status: "confirmed" | "declined") {
    setBusy(id);
    try {
      await decideRental({ data: { id, status } });
      await queryClient.invalidateQueries({ queryKey: ["rental-bookings", "incoming"] });
      await queryClient.invalidateQueries({ queryKey: ["marketplace", "mine", "standings"] });
    } catch {
      toast.error("That didn't save. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const setStatus = useServerFn(setMyListingStatus);
  const remove = useServerFn(deleteListing);
  const answer = useServerFn(answerOffer);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<MyListing | null>(null);

  // The draft Save draft keeps on this device, read after mount.
  const [draft, setDraft] = useState<Partial<ListingDraft> | null>(null);
  useEffect(() => setDraft(readListingDraft()), []);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["marketplace", "mine"] });
  }

  async function togglePublished(l: MyListing) {
    setBusy(l.id);
    try {
      await setStatus({ data: { id: l.id, status: live(l) ? "unavailable" : "active" } });
      await refresh();
      toast.success(live(l) ? "Unpublished — hidden from Market" : "Published — live on Market");
    } catch {
      toast.error("Couldn't change that — try again");
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(toDelete.id);
    try {
      await remove({ data: { id: toDelete.id } });
      await refresh();
      toast.success("Listing deleted");
      setToDelete(null);
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === "booked"
          ? "It has a confirmed rental — unpublish it instead"
          : "Couldn't delete that — try again",
      );
    } finally {
      setBusy(null);
    }
  }

  async function respond(id: string, status: "accepted" | "declined") {
    setBusy(id);
    try {
      await answer({ data: { id, status } });
      await queryClient.invalidateQueries({ queryKey: ["marketplace", "offers", "received"] });
    } catch {
      toast.error("Couldn't save that — try again");
    } finally {
      setBusy(null);
    }
  }

  const stats = [
    { label: "Total", value: listings.length },
    { label: "Live", value: listings.filter(live).length },
    { label: "Unpublished", value: listings.filter((l) => !live(l)).length },
    { label: "For sale", value: listings.filter((l) => l.category === "gear_sale").length },
    { label: "For rent", value: listings.filter((l) => l.category === "gear_rental").length },
    {
      label: "Open requests",
      value:
        offers.filter((o) => o.status === "pending").length +
        (requests.data ?? []).filter((r) => r.status === "Requested").length,
    },
  ];

  return (
    <Screen>
      <TopBar title="My listings" back="/marketplace" />

      <div className="space-y-6 px-5 py-4">
        <div
          className="grid grid-cols-3 gap-y-4 rounded-lg bg-subtle p-4"
          aria-busy={mine.isLoading}
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3 font-bold leading-tight">{mine.isLoading ? "—" : s.value}</p>
              <p className="mt-0.5 text-1 text-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Btn className="w-full" onClick={() => setAdding(true)}>
          <Plus size={iconSize.sm} aria-hidden />
          Add listing
        </Btn>

        {draft?.name || draft?.sub ? (
          <section>
            <h2 className="mb-2 text-2">Draft</h2>
            <div className="flex items-center gap-3 rounded-lg bg-subtle p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{draft.name || "Untitled listing"}</p>
                <p className="text-1 text-foreground">
                  {draft.mode ?? "Sell"} · saved on this device
                </p>
              </div>
              <IconBtn
                label="Discard draft"
                onClick={() => {
                  clearListingDraft();
                  setDraft(null);
                }}
              >
                <Trash2 size={iconSize.sm} aria-hidden />
              </IconBtn>
              <BtnLink to="/marketplace/sell" variant="outline" className="min-h-control-sm">
                Continue
              </BtnLink>
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 text-2">Listings</h2>
          {mine.isLoading ? (
            <div className="space-y-3" aria-busy>
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-subtle" />
              ))}
            </div>
          ) : mine.isError ? (
            <LoadError what="your listings" />
          ) : listings.length ? (
            <div className="space-y-3">
              {listings.map((l) => (
                <ManagedListing
                  key={l.id}
                  l={l}
                  out={
                    standings.data?.[l.id]?.rented
                      ? "Rented"
                      : standings.data?.[l.id]?.reserved
                        ? "Reserved"
                        : null
                  }
                  busy={busy === l.id}
                  onToggle={() => void togglePublished(l)}
                  onDelete={() => setToDelete(l)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🛍️"
              title="No listings yet"
              body="Everything you list on the marketplace shows up here."
            />
          )}
        </section>

        {(requests.data ?? []).length ? (
          <section>
            <h2 className="mb-2 text-2">Rental requests</h2>
            <div className="space-y-3">
              {(requests.data ?? []).map((r) => (
                <article key={r.id} className="rounded-lg bg-subtle p-4">
                  <div className="flex items-start gap-3">
                    {r.listingPhoto ? (
                      <img
                        src={r.listingPhoto}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-sm bg-background" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-1 font-semibold">{r.listingTitle ?? "Listing"}</p>
                      <p className="truncate text-1 text-muted-foreground">
                        {new Date(r.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        –{" "}
                        {new Date(r.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {r.quantity} unit{r.quantity > 1 ? "s" : ""}
                      </p>
                      {r.totalPaise != null ? (
                        <p className="mt-1 text-1 font-semibold">
                          {inr(Math.round(r.totalPaise / 100))}
                        </p>
                      ) : null}
                    </div>
                    <RentalStatusPill status={r.status} />
                  </div>
                  {r.status === "Requested" ? (
                    <div className="mt-3 flex gap-2">
                      <Btn
                        className="flex-1 text-1"
                        disabled={busy === r.id}
                        onClick={() => void decide(r.id, "confirmed")}
                      >
                        Accept
                      </Btn>
                      <Btn
                        variant="outline"
                        className="flex-1 text-1"
                        disabled={busy === r.id}
                        onClick={() => void decide(r.id, "declined")}
                      >
                        Decline
                      </Btn>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 text-2">Offers</h2>
          {offersQuery.isLoading ? (
            <div className="space-y-3" aria-busy>
              {[0, 1].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-subtle" />
              ))}
            </div>
          ) : offers.length ? (
            <div className="space-y-3">
              {offers.map((o) => (
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
                        disabled={busy === o.id}
                        onClick={() => void respond(o.id, "accepted")}
                      >
                        Accept
                      </Btn>
                      <Btn
                        variant="outline"
                        className="flex-1 text-1"
                        disabled={busy === o.id}
                        onClick={() => void respond(o.id, "declined")}
                      >
                        Decline
                      </Btn>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🤝"
              title="No offers yet"
              body="Offers buyers make on your listings show up here."
            />
          )}
        </section>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="What are you listing?">
        <DrawerList label="Listing types">
          {addOptions.map((o) => (
            <DrawerOptionRow
              key={o.mode}
              option={{ value: o.mode, label: o.label, icon: o.icon }}
              onClick={() => {
                setAdding(false);
                void navigate({
                  to: "/marketplace/sell",
                  search: o.mode === "rent" ? { type: "rent" } : {},
                });
              }}
            />
          ))}
        </DrawerList>
      </Sheet>

      <Dialog
        open={toDelete !== null}
        title="Delete this listing?"
        body={
          toDelete
            ? `"${toDelete.title}" comes off Market for good, with any offers on it. This can't be undone.`
            : ""
        }
        onClose={() => setToDelete(null)}
      >
        <Btn loading={busy === toDelete?.id} onClick={() => void confirmDelete()}>
          Delete
        </Btn>
        <Btn variant="ghost" onClick={() => setToDelete(null)}>
          Keep It
        </Btn>
      </Dialog>
    </Screen>
  );
}

/** One of the seller's listings, with its actions always in reach. */
function ManagedListing({
  l,
  out,
  busy,
  onToggle,
  onDelete,
}: {
  l: MyListing;
  /** A rental that's out with a renter now, or booked to go. */
  out: "Rented" | "Reserved" | null;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isLive = live(l);
  const taxonomy = useGearTaxonomy();
  return (
    <article className="rounded-lg bg-subtle p-4">
      <div className="flex gap-3">
        {l.image_url ? (
          <img
            src={l.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-icon-chip">
            <MarketCategoryIcon
              slug={gearCategoryOf(l.item_category, taxonomy) ?? "other"}
              size={iconSize.lg}
              className="text-primary-foreground"
            />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{l.title}</h3>
            <StatusPill
              label={out ?? (isLive ? "Live" : "Unpublished")}
              tone={out ? "neutral" : isLive ? "good" : "warn"}
              className="shrink-0"
            />
          </div>
          <p className="text-1 text-foreground">
            {l.category === "gear_rental" ? "For rent" : "For sale"}
          </p>
          <Price
            price={priceParts(l.price_paise, l.price_unit)}
            className="mt-1"
            amountClassName="text-sm font-bold"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <BtnLink
          to="/marketplace/l/$id"
          params={{ id: l.slug }}
          variant="outline"
          className="min-h-control-sm flex-1"
        >
          View
        </BtnLink>
        <IconBtnLink label="Edit" to="/marketplace/sell" search={{ edit: l.id }} variant="outline">
          <PenLine size={iconSize.sm} aria-hidden />
        </IconBtnLink>
        <IconBtn
          label={isLive ? "Unpublish" : "Publish"}
          variant="outline"
          disabled={busy}
          onClick={onToggle}
        >
          {isLive ? (
            <EyeOff size={iconSize.sm} aria-hidden />
          ) : (
            <Eye size={iconSize.sm} aria-hidden />
          )}
        </IconBtn>
        <IconBtn label="Delete" variant="outline" disabled={busy} onClick={onDelete}>
          <Trash2 size={iconSize.sm} aria-hidden />
        </IconBtn>
      </div>
    </article>
  );
}
