/**
 * FLOW-23 · QR-23 "QR analytics" · route: /identity/analytics
 * Aggregate, owner-only counts, backed by public.qr_scans. No downstream conversion (visits,
 * follows, messages, bookings) is tracked by a scan event, so this only shows what a scan
 * actually records: that someone opened your code.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { StateCard, Skeleton } from "@/components/ml/qr";
import { getMyQrAnalytics } from "@/lib/qr.functions";

export const Route = createFileRoute("/identity/analytics")({
  head: () => ({
    meta: [
      { title: "QR analytics — MusicLinkd" },
      {
        name: "description",
        content: "See how many people have scanned your MusicLinkd QR code.",
      },
      { property: "og:title", content: "QR analytics on MusicLinkd" },
      { property: "og:description", content: "Scans of your code, aggregate only." },
    ],
  }),
  component: QrAnalytics,
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] bg-subtle px-4 py-3">
      <p className="text-3 leading-tight tabular-nums">{value}</p>
      <p className="text-1 text-muted-foreground">{label}</p>
    </div>
  );
}

function QrAnalytics() {
  const load = useServerFn(getMyQrAnalytics);
  const q = useQuery({ queryKey: ["qr", "analytics"], queryFn: () => load() });

  return (
    <Screen>
      <TopBar title="QR analytics" subtitle="All time" back="/identity/qr" />
      <main className="px-5 pt-4">
        {q.isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-[20px]" />
            ))}
          </div>
        ) : q.isError || !q.data ? (
          <StateCard title="Couldn't load analytics" body="Check your connection and retry." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Total scans" value={q.data.totalScans} />
              <Stat label="Unique people" value={q.data.uniqueScanners} />
              <Stat label="Last 7 days" value={q.data.last7Days} />
              <Stat label="Last 30 days" value={q.data.last30Days} />
            </div>

            <p className="mt-3 px-1 text-1 text-muted-foreground">
              Counts are aggregate. MusicLinkd never shows who scanned your code.
            </p>
          </>
        )}

        <div className="mt-4">
          <BtnLink to="/identity/print" variant="outline" className="w-full">
            Print More of What Works
          </BtnLink>
        </div>
      </main>
    </Screen>
  );
}
