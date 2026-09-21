/**
 * FLOW-23 · QR-24 "Scanned QR history" · route: /identity/history
 * states: populated, empty · actions: open, scan
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ScanLine, Trash2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Dialog } from "@/components/ml/kit";
import { useState } from "react";
import { ActionRow, StateCard, Skeleton } from "@/components/ml/qr";
import { clearMyScanHistory, getMyScanHistory } from "@/lib/qr.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/identity/history")({
  head: () => ({
    meta: [
      { title: "Scanned QR history — MusicLinkd" },
      {
        name: "description",
        content:
          "Every MusicLinkd code you've scanned, so a conversation started at a gig doesn't get lost.",
      },
      { property: "og:title", content: "Scanned QR history on MusicLinkd" },
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
  const queryClient = useQueryClient();
  const clear = useServerFn(clearMyScanHistory);

  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function clearHistory() {
    setClearing(true);
    try {
      await clear();
      await queryClient.invalidateQueries({ queryKey: ["qr", "history"] });
      toast.success("History cleared");
    } catch {
      toast.error("Couldn't clear your history — try again");
    } finally {
      setClearing(false);
      setConfirming(false);
    }
  }

  return (
    <Screen>
      <TopBar
        title="Scanned QR history"
        subtitle="Your account"
        back="/identity/qr"
        right={
          items.length ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              aria-label="Clear history"
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
            title="No scanned QRs yet"
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
      <Dialog
        open={confirming}
        title="Clear scanned QR history?"
        body="Every scan in your history is deleted. This cannot be undone."
        onClose={() => setConfirming(false)}
      >
        <div className="space-y-2">
          <Btn className="w-full" loading={clearing} onClick={() => void clearHistory()}>
            Yes, Clear
          </Btn>
          <Btn variant="ghost" className="w-full" onClick={() => setConfirming(false)}>
            Keep It
          </Btn>
        </div>
      </Dialog>
    </Screen>
  );
}
