import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Loading } from "@/components/ml/kit";
import { ProviderSummary, RentalStatusPill } from "@/components/ml/rental";
import { inr } from "@/data/rentals";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyRentalBooking,
  getRentalListingDetail,
  getRentalProvider,
  setRentalBookingStatus,
} from "@/lib/rentals.functions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/marketplace/rent/active/$id")({
  // The booking is owner-only (signed-in read), so the title stays generic.
  head: () => {
    const title = "Rental | MusicLinkd";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: "Manage this rental — dates, pickup, extensions, returns and reviews.",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: "Rental details and actions on MusicLinkd." },
      ],
    };
  },
  component: RentalBooking,
});

/** A booking id (rental_bookings) is a uuid; anything else can't be one. */
function RentalBooking() {
  const { id } = Route.useParams();
  return UUID_RE.test(id) ? (
    <RealRentalBooking id={id} />
  ) : (
    <Screen>
      <TopBar title="Rental not found" back="/marketplace/rent/mine" />
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        This rental is no longer available on your account.
      </p>
    </Screen>
  );
}

/**
 * A booking, from the database: dates, status, fulfilment, total, deposit, plus the listing's
 * provider (getRentalProvider — a profile, no badges or response times).
 * Extend and Review have no backend yet (owner's call, 18 Sep 2026) — both stay as "coming soon".
 * Return is real: it moves the booking to "completed" via setRentalBookingStatus.
 */
function RealRentalBooking({ id }: { id: string }) {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(getMyRentalBooking);
  const setStatus = useServerFn(setRentalBookingStatus);
  const q = useQuery({
    queryKey: ["rental-bookings", "mine", id],
    queryFn: () => load({ data: { id } }),
    enabled: signedIn,
  });
  const slug = q.data?.listingSlug;
  const loadListing = useServerFn(getRentalListingDetail);
  const loadProvider = useServerFn(getRentalProvider);
  const listing = useQuery({
    queryKey: ["rental-listing", slug],
    queryFn: () => loadListing({ data: { slug: slug! } }),
    enabled: Boolean(slug),
  });
  const providerId = listing.data?.providerId;
  const provider = useQuery({
    queryKey: ["rental-provider", providerId],
    queryFn: () => loadProvider({ data: { profileId: providerId! } }),
    enabled: Boolean(providerId),
  });
  const p = provider.data;
  const complete = useMutation({
    mutationFn: () => setStatus({ data: { id, status: "completed" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-bookings", "mine", id] });
      queryClient.invalidateQueries({ queryKey: ["rental-bookings", "mine"] });
      toast.success("Marked as returned.");
    },
    onError: () => toast.error("That didn't save. Try again."),
  });

  if (!signedIn || q.isLoading) {
    return (
      <Screen>
        <TopBar title="Rental" back="/marketplace/rent/mine" />
        <div className="px-5 py-4">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

  const b = q.data;
  if (!b) {
    return (
      <Screen>
        <TopBar title="Rental not found" back="/marketplace/rent/mine" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This rental is no longer available on your account.
        </p>
      </Screen>
    );
  }

  const days = Math.max(
    1,
    Math.round((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86_400_000),
  );
  const fulfilmentLabel = b.fulfilment.replace(/_/g, " ");

  return (
    <Screen>
      <TopBar
        title="Rental"
        back="/marketplace/rent/mine"
        {...(b.listingTitle ? { subtitle: b.listingTitle } : {})}
      />
      <div className="px-5 py-4">
        <div className="overflow-hidden rounded-lg bg-subtle">
          {b.listingPhoto ? (
            <img
              src={b.listingPhoto}
              alt={b.listingTitle ?? ""}
              className="h-40 w-full object-cover"
            />
          ) : null}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2 leading-tight">{b.listingTitle ?? "Rental"}</h1>
              <RentalStatusPill status={b.status} />
            </div>
            <p className="mt-1 text-1 text-muted-foreground">
              {new Date(b.startDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}{" "}
              →{" "}
              {new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
              · {days} days · {b.quantity} unit{b.quantity > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
          {[
            { k: "Fulfilment", v: fulfilmentLabel },
            ...(b.totalPaise != null
              ? [{ k: "Rental total", v: inr(Math.round(b.totalPaise / 100)) }]
              : []),
            ...(b.depositPaise != null
              ? [{ k: "Security deposit", v: inr(Math.round(b.depositPaise / 100)) }]
              : []),
            ...(b.note ? [{ k: "Instructions", v: b.note }] : []),
          ].map((r) => (
            <div key={r.k} className="flex items-start justify-between gap-3 px-4 py-3">
              <dt className="shrink-0 text-1 text-muted-foreground">{r.k}</dt>
              <dd className="text-right text-1 font-semibold">{r.v}</dd>
            </div>
          ))}
        </dl>

        {b.listingSlug ? (
          <BtnLink
            to="/marketplace/rent/e/$id"
            params={{ id: b.listingSlug }}
            variant="outline"
            className="mt-4 w-full"
          >
            View listing
          </BtnLink>
        ) : null}

        {p ? (
          <>
            <h2 className="mt-6 text-2">Provider</h2>
            <div className="mt-2 rounded-lg bg-subtle p-4">
              <ProviderSummary p={p} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <BtnLink to="/messages" variant="outline" className="w-full">
                  Message
                </BtnLink>
                <BtnLink
                  to="/marketplace/rent/provider/$id"
                  params={{ id: p.id }}
                  variant="outline"
                  className="w-full"
                >
                  Profile
                </BtnLink>
              </div>
            </div>
          </>
        ) : null}

        <h2 className="mt-6 text-2">Actions</h2>
        <div className="mt-2 space-y-2">
          {b.status === "Active" ? (
            <>
              <Btn
                variant="outline"
                className="w-full"
                onClick={() => toast("Extensions — coming soon")}
              >
                Request Extension
              </Btn>
              <Btn
                className="w-full"
                loading={complete.isPending}
                onClick={() => complete.mutate()}
              >
                Return Equipment
              </Btn>
            </>
          ) : null}
          {b.status === "Completed" ? (
            <>
              <Btn className="w-full" onClick={() => toast("Reviews — coming soon")}>
                Rate Provider & Equipment
              </Btn>
              {b.listingSlug ? (
                <BtnLink
                  to="/marketplace/rent/e/$id"
                  params={{ id: b.listingSlug }}
                  variant="outline"
                  className="w-full"
                >
                  Book Again
                </BtnLink>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
