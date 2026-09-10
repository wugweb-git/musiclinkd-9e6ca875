/**
 * FLOW-23 · QR-17 "Customise QR" · route: /identity/customize
 * Controlled presentation only — scannability is never traded for styling.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { QrIdentityCard } from "@/components/ml/qr";
import { myIdentity, qrStyles, type QrStyle } from "@/data/identity";

export const Route = createFileRoute("/identity/customize")({
  head: () => ({
    meta: [
      { title: "Customise your MusicLinkd QR" },
      {
        name: "description",
        content:
          "Choose a QR presentation that fits your posters, cards and stage backdrops without hurting scannability.",
      },
      { property: "og:title", content: "Customise your MusicLinkd QR" },
      {
        property: "og:description",
        content: "Four contrast-checked presentations, one canonical destination.",
      },
    ],
  }),
  component: Customize,
});

function Customize() {
  const [style, setStyle] = useState<QrStyle>("light");
  const [showName, setShowName] = useState(true);

  return (
    <Screen>
      <TopBar title="Customise" subtitle="Presentation only" back="/identity/qr" />
      <main className="px-5 pt-4">
        <QrIdentityCard
          name={myIdentity.name}
          role={showName ? myIdentity.role : "MusicLinkd"}
          photo={myIdentity.photo}
          verified={myIdentity.verified}
          handle={myIdentity.username}
          code={myIdentity.code}
          style={style}
          compact
        />

        <div className="mt-5 flex flex-col gap-2">
          {qrStyles.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              aria-pressed={style === s.value}
              className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left ${
                style === s.value ? "border-primary bg-pinkc" : "border-border bg-card"
              }`}
            >
              <span
                className="h-10 w-10 shrink-0 rounded-[12px] border border-border"
                style={{ background: s.light, boxShadow: `inset 0 0 0 6px ${s.dark}` }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{s.label}</span>
                <span className="block text-[12px] text-muted-foreground">{s.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-center justify-between rounded-[20px] border border-border bg-card px-4 py-3">
          <span className="text-sm font-semibold">Show role under my name</span>
          <input
            type="checkbox"
            checked={showName}
            onChange={(e) => setShowName(e.target.checked)}
            className="h-5 w-5 accent-[var(--pink)]"
          />
        </label>

        <p className="mt-3 px-1 text-[12px] text-muted-foreground">
          Every option keeps a wide quiet zone and passes contrast checks, so cameras still read it
          from across a room.
        </p>

        <div className="mt-4">
          <Btn
            className="w-full"
            onClick={() => toast.success("QR presentation updated for this session")}
          >
            Save presentation
          </Btn>
        </div>
      </main>
    </Screen>
  );
}
