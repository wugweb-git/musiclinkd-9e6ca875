/**
 * FLOW-23 · QR-06 "Scanner", QR-07 "Scanning", QR-25/26 permission, QR-27 image scan
 * route: /identity/scan · states: permission, denied, ready, scanning, error, offline
 *
 * Reads a real MusicLinkd QR (a profile URL) via the browser's native BarcodeDetector where
 * available, decoding either the live camera feed or a picked image. Browsers without
 * BarcodeDetector (notably iOS Safari, as of this writing) fall back to typing the code by hand
 * rather than pretending to scan.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, ScanLine, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { CameraSurface, ScanFrame, StateCard, ActionRow } from "@/components/ml/qr";
import { recordScan } from "@/lib/qr.functions";
import { iconSize } from "@/lib/tokens";

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

type Phase = "permission" | "denied" | "ready" | "scanning" | "error" | "unsupported";

/** A MusicLinkd QR only ever encodes a profile URL — pull the username off the end of it. */
function usernameFromScan(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\/profile\/([a-z0-9._]{3,30})\/?$/i);
  if (match?.[1]) return match[1];
  if (/^[a-z0-9._]{3,30}$/i.test(trimmed)) return trimmed;
  return null;
}

function Scanner() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("permission");
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scan = useServerFn(recordScan);
  const detectorSupported = typeof window !== "undefined" && "BarcodeDetector" in window;

  async function resolveAndGo(username: string) {
    setPhase("scanning");
    try {
      const profile = await scan({ data: { username } });
      if (!profile) {
        toast.error("That code doesn't match a public MusicLinkd profile");
        setPhase("ready");
        return;
      }
      void nav({ to: "/profile/$username", params: { username: profile.username } });
    } catch {
      toast.error("Couldn't open that code — try again");
      setPhase("ready");
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !detectorSupported) return;
    let active = true;
    let raf = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Detector = (window as any).BarcodeDetector;
    const detector = new Detector({ formats: ["qr_code"] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
        const tick = async () => {
          if (!active || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes?.[0]?.rawValue as string | undefined;
            const username = value ? usernameFromScan(value) : null;
            if (username) {
              active = false;
              streamRef.current?.getTracks().forEach((t) => t.stop());
              void resolveAndGo(username);
              return;
            }
          } catch {
            // A frame that fails to decode just tries again next tick.
          }
          raf = requestAnimationFrame(() => void tick());
        };
        raf = requestAnimationFrame(() => void tick());
      })
      .catch(() => {
        if (active) setPhase("denied");
      });

    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, detectorSupported]);

  async function onPickImage(file: File) {
    if (!detectorSupported) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      const value = codes?.[0]?.rawValue as string | undefined;
      const username = value ? usernameFromScan(value) : null;
      if (!username) {
        toast.error("Couldn't find a MusicLinkd QR in that image");
        return;
      }
      await resolveAndGo(username);
    } catch {
      toast.error("Couldn't read that image");
    }
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Scan QR" subtitle="MusicLinkd codes only" back="/identity/qr" />

      <main className="flex flex-col px-5 pt-4">
        {phase === "permission" ? (
          <StateCard
            title="Camera access needed"
            body="MusicLinkd uses your camera only while this scanner is open, to read QR codes. Nothing is recorded or uploaded."
          >
            <Btn onClick={() => setPhase(detectorSupported ? "ready" : "unsupported")}>
              <Camera size={iconSize.sm} className="mr-2" /> Allow camera
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
            <label className="hit-area flex min-h-touch w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border text-1 font-semibold">
              <ImageIcon size={iconSize.sm} /> Scan an image instead
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onPickImage(file);
                }}
              />
            </label>
          </StateCard>
        ) : phase === "unsupported" ? (
          <StateCard
            title="Camera scanning isn't supported in this browser"
            body="Type the username or paste the profile link instead."
          >
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="username or musiclinkd.app/profile/username"
              className="min-h-control w-full rounded-lg border border-border bg-background px-3 text-1 outline-none focus:border-primary"
            />
            <Btn
              className="mt-2 w-full"
              disabled={!manualCode.trim()}
              onClick={() => {
                const username = usernameFromScan(manualCode);
                if (!username) {
                  toast.error("That doesn't look like a MusicLinkd profile");
                  return;
                }
                void resolveAndGo(username);
              }}
            >
              Open
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
              <video
                ref={videoRef}
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="relative">
                <ScanFrame scanning={phase === "scanning"} />
                <p className="mt-6 text-center text-1 text-background/80">
                  {phase === "scanning" ? "Opening profile…" : "Line the QR up inside the frame"}
                </p>
              </div>
            </CameraSurface>

            <div className="mt-5 flex justify-center">
              <label className="hit-area flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border bg-card">
                <ImageIcon size={iconSize.md} aria-hidden />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onPickImage(file);
                  }}
                />
              </label>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <p className="pill px-1 bg-subtle text-muted-foreground">Recently scanned</p>
          <ActionRow
            icon={<ShieldQuestion size={iconSize.sm} />}
            label="See your scan history"
            hint="Everyone you've scanned"
            onClick={() => void nav({ to: "/identity/history" })}
          />
        </div>
      </main>
    </Screen>
  );
}
