/**
 * FLOW-23 · QR-23 "QR analytics" · route: /identity/analytics
 * Aggregate, owner-only counts. Reuses profile analytics language, adds no new tracking.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { qrAnalytics } from "@/data/identity";

export const Route = createFileRoute("/identity/analytics")({
  head: () => ({
    meta: [
      { title: "QR analytics — MusicLinkd" },
      { name: "description", content: "See how your printed and shared MusicLinkd codes turn into profile visits, follows, messages and bookings." },
      { property: "og:title", content: "QR analytics on MusicLinkd" },
      { property: "og:description", content: "Which surface actually brings work in." },
    ],
  }),
  component: QrAnalytics,
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-border bg-card px-4 py-3">
      <p className="text-[20px] leading-tight">{value}</p>
      <p className="text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

function QrAnalytics() {
  const max = Math.max(...qrAnalytics.bySource.map((s) => s.value));
  return (
    <Screen>
      <TopBar title="QR analytics" subtitle="Last 30 days" back="/identity/qr" />
      <main className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Scans" value={qrAnalytics.scans} />
          <Stat label="Unique people" value={qrAnalytics.unique} />
          <Stat label="Profile visits" value={qrAnalytics.profileVisits} />
          <Stat label="New follows" value={qrAnalytics.follows} />
          <Stat label="Messages started" value={qrAnalytics.messages} />
          <Stat label="Bookings" value={qrAnalytics.bookings} />
        </div>

        <section className="mt-4 rounded-[24px] border border-border bg-card p-4">
          <h2 className="text-[17px]">Where scans come from</h2>
          <div className="mt-3 flex flex-col gap-3">
            {qrAnalytics.bySource.map((s) => (
              <div key={s.label}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-muted-foreground">{s.value}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-subtle">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.round((s.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-3 px-1 text-[12px] text-muted-foreground">
          Counts are aggregate. MusicLinkd never shows who scanned your code.
        </p>

        <div className="mt-4">
          <Link to="/identity/print">
            <Btn variant="outline" className="w-full">Print more of what works</Btn>
          </Link>
        </div>
      </main>
    </Screen>
  );
}
