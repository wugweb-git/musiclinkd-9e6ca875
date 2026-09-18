import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/ml/ui";
import { BusinessOnlyGate, EmptyState, Loading } from "@/components/ml/kit";
import { useRequireBusiness } from "@/hooks/use-require-business";
import { StickyBar } from "@/components/ml/booking";
import { getMyStudio, updateMyStudio, updateStudioRoomRate } from "@/lib/studio-owner.functions";

export const Route = createFileRoute("/business/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — MusicLinkd provider" },
      {
        name: "description",
        content: "Set your hourly rate, and each room's, for MusicLinkd booking requests.",
      },
      { property: "og:title", content: "Pricing — MusicLinkd provider" },
      { property: "og:description", content: "Rates for your space and its rooms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const gate = useRequireBusiness();
  return (
    <BusinessOnlyGate allowed={gate.allowed} loading={gate.loading} signedIn={gate.signedIn}>
      <PricingContent />
    </BusinessOnlyGate>
  );
}

function rupees(paise: number | null | undefined) {
  return paise == null ? "" : String(Math.round(paise / 100));
}

function PricingContent() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyStudio);
  const saveStudio = useServerFn(updateMyStudio);
  const saveRoom = useServerFn(updateStudioRoomRate);
  const q = useQuery({ queryKey: ["business", "studio", "mine"], queryFn: () => load() });

  const [baseRate, setBaseRate] = useState("");
  const [roomRates, setRoomRates] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!q.data) return;
    setBaseRate(rupees(q.data.hourly_rate_paise));
    setRoomRates(Object.fromEntries(q.data.rooms.map((r) => [r.id, rupees(r.hourly_rate_paise)])));
  }, [q.data]);

  async function save() {
    if (!q.data) return;
    try {
      await saveStudio({
        data: { hourly_rate_paise: baseRate.trim() ? Math.round(Number(baseRate) * 100) : null },
      });
      await Promise.all(
        q.data.rooms.map((r) => {
          const v = roomRates[r.id];
          if (v === undefined || v === rupees(r.hourly_rate_paise)) return Promise.resolve();
          return saveRoom({
            data: { roomId: r.id, hourly_rate_paise: v.trim() ? Math.round(Number(v) * 100) : 0 },
          });
        }),
      );
      await queryClient.invalidateQueries({ queryKey: ["business", "studio", "mine"] });
      toast.success("Pricing saved");
    } catch {
      toast.error("Couldn't save that — try again");
    }
  }

  if (q.isLoading) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Pricing" back="/business/bookings" />
        <div className="px-5 pt-8">
          <Loading />
        </div>
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen bottomNav={false}>
        <TopBar title="Pricing" back="/business/bookings" />
        <div className="px-5 pt-4">
          <EmptyState title="No studio yet" body="Set up your studio profile first." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Pricing" subtitle={q.data.name} back="/business/bookings" />

      <main className="space-y-6 px-5 pb-40 pt-4">
        <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
          A flat hourly rate per space. Tiered rates and add-ons aren't supported yet.
        </p>

        <MoneyRow
          label="Base hourly rate"
          hint="Whole studio"
          value={baseRate}
          onChange={setBaseRate}
        />

        {q.data.rooms.length ? (
          <section className="min-w-0">
            <h2 className="text-2">Rooms</h2>
            <div className="mt-3 space-y-2">
              {q.data.rooms.map((r) => (
                <MoneyRow
                  key={r.id}
                  label={r.name}
                  hint="per hour"
                  value={roomRates[r.id] ?? ""}
                  onChange={(v) => setRoomRates((s) => ({ ...s, [r.id]: v }))}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <StickyBar
        primaryLabel="Save pricing"
        hint="Applies to new requests only"
        onPrimary={() => void save()}
      />
    </Screen>
  );
}

function MoneyRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `rate-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg bg-subtle p-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block truncate text-1 font-semibold">
          {label}
        </label>
        {hint ? <p className="truncate text-1 text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-background px-3 py-2">
        <span className="text-1 font-semibold text-muted-foreground">₹</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-transparent text-right text-1 font-bold outline-none"
        />
      </div>
    </div>
  );
}
