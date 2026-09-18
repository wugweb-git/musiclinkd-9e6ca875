/**
 * FLOW-23 · QR-24 "Scan history" · route: /identity/history
 * states: populated, empty · actions: open, scan
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ScanLine, Trash2 } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { ActionRow, StateCard, Skeleton } from "@/components/ml/qr";
import { getMyScanHistory } from "@/lib/qr.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/identity/history")({
  head: () => ({
    meta: [
      { title: "Scan history — MusicLinkd" },
      {
        name: "description",
        content:
          "Every MusicLinkd code you've scanned, so a conversation started at a gig doesn't get lost.",
      },
      { property: "og:title", content: "Scan history on MusicLinkd" },
      { property: "og:description", content: "Pick a connection back up later." },
    ],
  }),
  component: ScanHistory,
});

function timeAgo(iso: string): string {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ScanHistory() {
  const load = useServerFn(getMyScanHistory);
  const q = useQuery({ queryKey: ["qr", "history"], queryFn: () => load() });
  const items = q.data ?? [];
  return (
    <Screen>
      <TopBar
        title="Scan history"
        subtitle="Your account"
        back="/identity/qr"
        right={
          items.length ? (
            <button
              type="button"
              onClick={() => toast("Clearing history — coming soon")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              aria-label="Clear history — coming soon"
            >
              <Trash2 size={iconSize.sm} />
            </button>
          ) : null
        }
      />
      <main className="px-5 pt-4">
        {q.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : q.isError ? (
          <StateCard title="Couldn't load your history" body="Check your connection and retry." />
        ) : items.length === 0 ? (
          <StateCard
            title="No scans yet"
            body="Codes you scan appear here so you can find that studio or session player again."
          >
            <BtnLink to="/identity/scan" className="w-full">
              <ScanLine size={iconSize.sm} className="mr-2" /> Open Scanner
            </BtnLink>
          </StateCard>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((h, i) => (
              <Link
                key={`${h.username}-${i}`}
                to="/profile/$username"
                params={{ username: h.username }}
              >
                <ActionRow
                  icon={<ScanLine size={iconSize.sm} />}
                  label={h.name}
                  hint={timeAgo(h.scannedAt)}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </Screen>
  );
}
