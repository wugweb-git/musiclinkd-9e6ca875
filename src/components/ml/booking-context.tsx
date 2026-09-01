import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getBookable, getResource, priceFor, type Bookable, type Resource } from "@/data/booking";

export type BookingDraft = {
  resourceId: string;
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

type Ctx = {
  bookable: Bookable;
  resource: Resource;
  draft: BookingDraft;
  set: (patch: Partial<BookingDraft>) => void;
  toggleAddOn: (id: string) => void;
  price: ReturnType<typeof priceFor>;
  endTime: string;
};

const BookingCtx = createContext<Ctx | null>(null);

export function useBookingDraft() {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBookingDraft must be used inside BookingDraftProvider");
  return ctx;
}

export function BookingDraftProvider({ id, children }: { id: string; children: ReactNode }) {
  const bookable = getBookable(id);
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    resourceId: bookable?.resources[0]?.id ?? "",
    hours: 2,
    people: 2,
    purpose: "",
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

  const resource = getResource(bookable, draft.resourceId);

  const value = useMemo<Ctx | null>(() => {
    if (!bookable || !resource) return null;
    const startHour = Number((draft.start ?? "10:00").split(":")[0]);
    const endHour = Math.min(23, startHour + draft.hours);
    return {
      bookable,
      resource,
      draft,
      set,
      toggleAddOn,
      price: priceFor(bookable, resource, draft.hours, draft.addOnIds),
      endTime: `${String(endHour).padStart(2, "0")}:00`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookable, resource, draft]);

  if (!value) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-center justify-center bg-background px-8 text-center">
        <div>
          <p className="text-lg font-semibold">This space is unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been removed or is no longer taking bookings.
          </p>
        </div>
      </div>
    );
  }

  return <BookingCtx.Provider value={value}>{children}</BookingCtx.Provider>;
}
