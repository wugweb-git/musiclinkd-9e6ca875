import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { priceForService, type Bookable, type PriceLines } from "@/data/booking";
import { BtnLink, Screen, TopBar } from "./ui";
import { EmptyState } from "./kit";

export type BookingDraft = {
  /** The service booked (profile_services id); purpose carries its name. */
  serviceId?: string | undefined;
  date?: string | undefined;
  start?: string | undefined;
  hours: number;
  people: number;
  purpose: string;
  notes: string;
  requirements: string;
  addOnIds: string[];
  acknowledged: boolean;
};

type Service = NonNullable<Bookable["services"]>[number];

type Ctx = {
  bookable: Bookable;
  /** The service picked, once one is. */
  service: Service | undefined;
  draft: BookingDraft;
  set: (patch: Partial<BookingDraft>) => void;
  toggleAddOn: (id: string) => void;
  /** Null when the service picked has no price: nothing is quoted. */
  price: PriceLines | null;
  endTime: string;
};

const BookingCtx = createContext<Ctx | null>(null);

// eslint-disable-next-line react-refresh/only-export-components -- hook intentionally co-located with its provider
export function useBookingDraft() {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBookingDraft must be used inside BookingDraftProvider");
  return ctx;
}

/** Date, time and the steps after them need an availability calendar; without one, stay on services. */
export function CalendarGate({ children }: { children: ReactNode }) {
  const { bookable } = useBookingDraft();
  if (bookable.hasCalendar === false) {
    return <Navigate to="/booking/$id/service" params={{ id: bookable.id }} replace />;
  }
  return <>{children}</>;
}

export function BookingDraftProvider({
  studio,
  service,
  children,
}: {
  id: string;
  /** A service picked before the flow opened (Book on a service card): its id or its name. */
  service?: string | undefined;
  /** The database studio for this id, or null when there is none. */
  studio?: Bookable | null;
  children: ReactNode;
}) {
  const bookable = studio ?? undefined;
  const picked = service
    ? bookable?.services?.find((s) => s.id === service || s.name === service)
    : undefined;
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    serviceId: picked?.id,
    hours: 2,
    people: 2,
    purpose: picked?.name ?? service ?? "",
    notes: "",
    requirements: "",
    addOnIds: [],
    acknowledged: false,
  }));

  const set = (patch: Partial<BookingDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleAddOn = (addOnId: string) =>
    setDraft((d) => ({
      ...d,
      addOnIds: d.addOnIds.includes(addOnId)
        ? d.addOnIds.filter((x) => x !== addOnId)
        : [...d.addOnIds, addOnId],
    }));

  const chosen = bookable?.services?.find((s) => s.id === draft.serviceId);

  const value = useMemo<Ctx | null>(() => {
    // Every service is bookable, and there is nothing else to book (owner, 3 Oct 2026): a place
    // with no services takes no bookings.
    if (!bookable || !bookable.services?.length) return null;
    const startHour = Number((draft.start ?? "10:00").split(":")[0]);
    const endHour = Math.min(23, startHour + draft.hours);
    return {
      bookable,
      service: chosen,
      draft,
      set,
      toggleAddOn,
      price: priceForService(bookable, chosen, draft.hours, draft.addOnIds),
      endTime: `${String(endHour).padStart(2, "0")}:00`,
    };
  }, [bookable, chosen, draft]);

  /*
   * A real screen, not a bare centred div. This branch is reached by a bad slug *and* by a genuine
   * place with no services yet, and
   * it used to render with no Screen, no TopBar, no nav and no link out, so on Android the system
   * back gesture was the only escape (audit C1, 29 Sep 2026).
   */
  if (!value) {
    return (
      <Screen>
        <TopBar title="Booking" back="/discover" />
        <div className="px-5 pt-6">
          <EmptyState
            title="This space is unavailable"
            body="It may have been removed, or it is not taking bookings yet."
            action={<BtnLink to="/discover">Find another</BtnLink>}
          />
        </div>
      </Screen>
    );
  }

  return <BookingCtx.Provider value={value}>{children}</BookingCtx.Provider>;
}
