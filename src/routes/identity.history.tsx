/**
 * FLOW-23 · QR-24 "Scan history" · route: /identity/history
 * states: populated, empty · actions: open, scan
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ScanLine, Trash2 } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { ActionRow, StateCard } from "@/components/ml/qr";
import { scanHistory } from "@/data/identity";

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

function ScanHistory() {
  const [items, setItems] = useState(scanHistory);
  return (
    <Screen>
      <TopBar
        title="Scan history"
        subtitle="Stored on this device"
        back="/identity/qr"
        right={
          items.length ? (
            <button
              type="button"
              onClick={() => setItems([])}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              aria-label="Clear history"
            >
              <Trash2 size={16} />
            </button>
          ) : null
        }
      />
      <main className="px-5 pt-4">
        {items.length === 0 ? (
          <StateCard
            title="No scans yet"
            body="Codes you scan appear here so you can find that studio or session player again."
          >
            <BtnLink to="/identity/scan" className="w-full">
              <ScanLine size={16} className="mr-2" /> Open Scanner
            </BtnLink>
          </StateCard>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((h) => (
              <Link key={h.code} to="/identity/q/$code" params={{ code: h.code }}>
                <ActionRow
                  icon={<ScanLine size={17} />}
                  label={h.label}
                  hint={`${h.kind} · ${h.when}`}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </Screen>
  );
}
