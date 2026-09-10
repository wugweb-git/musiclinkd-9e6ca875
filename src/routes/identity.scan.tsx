/**
 * FLOW-23 · QR-06 "Scanner", QR-07 "Scanning", QR-25/26 permission, QR-27 image scan
 * route: /identity/scan · states: permission, denied, ready, scanning, error, offline
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, ScanLine, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import {
  CameraSurface,
  ScanFrame,
  ScannerControls,
  StateCard,
  ActionRow,
} from "@/components/ml/qr";
import { destinations, scanHistory } from "@/data/identity";

export const Route = createFileRoute("/identity/scan")({
  head: () => ({
    meta: [
      { title: "Scan a MusicLinkd QR code" },
      {
        name: "description",
        content:
          "Point your camera at a MusicLinkd QR to open a profile, studio, service, listing or portfolio work instantly.",
      },
      { property: "og:title", content: "Scan a MusicLinkd QR" },
      {
        property: "og:description",
        content: "Meet someone at a gig, scan their code, keep the connection.",
      },
    ],
  }),
  component: Scanner,
});

type Phase = "permission" | "denied" | "ready" | "scanning" | "error";

function Scanner() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("permission");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => {
      const target = destinations[0]!;
      void nav({ to: "/identity/q/$code", params: { code: target.code } });
    }, 1400);
    return () => clearTimeout(t);
  }, [phase, nav]);

  return (
    <Screen bottomNav={false}>
      <TopBar title="Scan QR" subtitle="MusicLinkd codes only" back="/identity/qr" />

      <main className="flex flex-col px-5 pt-4">
        {phase === "permission" ? (
          <StateCard
            title="Camera access needed"
            body="MusicLinkd uses your camera only while this scanner is open, to read QR codes. Nothing is recorded or uploaded."
          >
            <Btn onClick={() => setPhase("ready")}>
              <Camera size={16} className="mr-2" /> Allow camera
            </Btn>
            <Btn variant="outline" onClick={() => setPhase("denied")}>
              Not now
            </Btn>
          </StateCard>
        ) : phase === "denied" ? (
          <StateCard
            title="Camera is blocked"
            body="Enable camera permission for MusicLinkd in your browser or Android settings, or scan a saved QR image instead."
          >
            <Btn onClick={() => setPhase("permission")}>Try again</Btn>
            <Btn variant="outline" onClick={() => toast("Pick a QR image from your gallery")}>
              Scan an image instead
            </Btn>
          </StateCard>
        ) : phase === "error" ? (
          <StateCard
            title="The camera couldn't start"
            body="Another app may be using it. Close other camera apps and try again."
          >
            <Btn onClick={() => setPhase("ready")}>Retry</Btn>
          </StateCard>
        ) : (
          <>
            <CameraSurface>
              <ScanFrame scanning={phase === "scanning"} />
              <p className="mt-6 text-center text-[13px] text-background/80">
                {phase === "scanning" ? "Reading code…" : "Line the QR up inside the frame"}
              </p>
            </CameraSurface>

            <ScannerControls
              flash={flash}
              onFlash={() => setFlash((f) => !f)}
              onGallery={() => setPhase("scanning")}
            />

            <div className="mt-4">
              <Btn className="w-full" onClick={() => setPhase("scanning")}>
                <ScanLine size={16} className="mr-2" /> Simulate a scan
              </Btn>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Recently scanned
          </p>
          {scanHistory.slice(0, 3).map((h) => (
            <ActionRow
              key={h.code}
              icon={<ShieldQuestion size={17} />}
              label={h.label}
              hint={h.when}
              onClick={() => void nav({ to: "/identity/q/$code", params: { code: h.code } })}
            />
          ))}
        </div>
      </main>
    </Screen>
  );
}
