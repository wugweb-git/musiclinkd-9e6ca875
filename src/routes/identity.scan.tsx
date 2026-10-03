import { StateCard } from "@/components/ml/kit";
/**
 * FLOW-23 · QR-06 "Scanner", QR-07 "Scanning", QR-25/26 permission, QR-27 image scan
 * route: /identity/scan · states: permission, denied, ready, scanning, error, offline
 *
 * Reads a real MusicLinkd QR (a profile URL). The camera opens as soon as the screen does (the
 * browser asks for permission itself), on every phone: src/lib/qr-decode.ts uses the browser's own
 * reader where it has one and jsQR elsewhere (iPhone Safari). With the camera blocked, a photo
 * taken with the phone's camera app or a saved picture is read instead. Only a browser with no
 * camera access at all falls back to typing the code.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PUBLIC_HOST } from "@/lib/site";
import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, ScanLine, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { CameraSurface, ScanFrame, ActionRow } from "@/components/ml/qr";
import { recordScan } from "@/lib/qr.functions";
import { decodeQr } from "@/lib/qr-decode";
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

type Phase = "denied" | "ready" | "scanning" | "error" | "unsupported";

const cameraAvailable = () =>
  typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

/** A MusicLinkd QR encodes a profile URL (short link /@username or legacy /profile/username) — extract the username. */
export function usernameFromScan(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Short link format: /@username or trailing /@username
  const atMatch = trimmed.match(/(?:^|\/)@([a-z0-9._]{3,30})\/?$/i);
  if (atMatch?.[1]) return atMatch[1];

  // 2. Legacy profile URL: /profile/username
  const legacyMatch = trimmed.match(/\/profile\/([a-z0-9._]{3,30})\/?$/i);
  if (legacyMatch?.[1]) return legacyMatch[1];

  // 3. Parse as URL in case of full address with query params or hash
  try {
    const url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`,
    );
    const atPathMatch = url.pathname.match(/^\/@([a-z0-9._]{3,30})\/?$/i);
    if (atPathMatch?.[1]) return atPathMatch[1];
    const legacyPathMatch = url.pathname.match(/^\/profile\/([a-z0-9._]{3,30})\/?$/i);
    if (legacyPathMatch?.[1]) return legacyPathMatch[1];
  } catch {
    // Not a URL, continue checking handle patterns
  }

  // 4. Raw handle with @ (e.g. @rahul.iyer)
  if (/^@([a-z0-9._]{3,30})$/i.test(trimmed)) {
    return trimmed.slice(1);
  }

  // 5. Bare username without slash or @ (e.g. rahul.iyer)
  if (/^[a-z0-9._]{3,30}$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function Scanner() {
  const nav = useNavigate();
  // Straight to the camera; the browser's own prompt asks for permission.
  const [phase, setPhase] = useState<Phase>(() => (cameraAvailable() ? "ready" : "unsupported"));
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scan = useServerFn(recordScan);

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
    if (phase !== "ready") return;
    let active = true;
    let timer = 0;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
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
        // A few reads a second is enough to catch a code and keeps the phone cool.
        const tick = async () => {
          if (!active || !videoRef.current) return;
          try {
            const value = await decodeQr(videoRef.current);
            const username = value ? usernameFromScan(value) : null;
            if (username) {
              active = false;
              streamRef.current?.getTracks().forEach((t) => t.stop());
              void resolveAndGo(username);
              return;
            }
          } catch {
            // A frame that fails to decode just tries again.
          }
          timer = window.setTimeout(() => void tick(), 200);
        };
        timer = window.setTimeout(() => void tick(), 200);
      })
      .catch((e: unknown) => {
        if (!active) return;
        const name = e instanceof Error ? e.name : "";
        setPhase(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      });

    return () => {
      active = false;
      window.clearTimeout(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function onPickImage(file: File) {
    try {
      const bitmap = await createImageBitmap(file);
      const value = await decodeQr(bitmap);
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

  /** The phone's own camera app (capture) or a saved picture, read the same way. */
  const pickInput = (capture: boolean) => (
    <input
      type="file"
      accept="image/*"
      {...(capture ? { capture: "environment" as const } : {})}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) void onPickImage(file);
      }}
    />
  );

  return (
    <Screen bottomNav={false}>
      <TopBar title="Scan QR" subtitle="MusicLinkd codes only" back="/identity/qr" />

      <main className="flex flex-col px-5 pt-4">
        {phase === "denied" ? (
          <StateCard
            variant="subtle"
            title="Camera is blocked"
            body="Enable camera permission for MusicLinkd in your browser or Android settings, or scan a saved QR image instead."
          >
            <Btn onClick={() => setPhase("ready")}>Try again</Btn>
            <label className="hit-area flex min-h-touch w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-1 font-semibold text-ink-foreground">
              <Camera size={iconSize.sm} /> Take a photo of the code
              {pickInput(true)}
            </label>
            <label className="hit-area flex min-h-touch w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border text-1 font-semibold">
              <ImageIcon size={iconSize.sm} /> Scan an image instead
              {pickInput(false)}
            </label>
          </StateCard>
        ) : phase === "unsupported" ? (
          <StateCard
            variant="subtle"
            title="Camera scanning isn't supported in this browser"
            body="Take a photo of the code, or type the username or paste the profile link."
          >
            <label className="hit-area flex min-h-touch w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-1 font-semibold text-ink-foreground">
              <Camera size={iconSize.sm} /> Take a photo of the code
              {pickInput(true)}
            </label>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={`username or ${PUBLIC_HOST}/@username`}
              className="min-h-control w-full rounded-lg border border-input bg-background px-3 text-1 outline-none focus:border-ink"
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
            variant="subtle"
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
              <label
                aria-label="Scan a saved image"
                className="hit-area flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border bg-card"
              >
                <ImageIcon size={iconSize.md} aria-hidden />
                {pickInput(false)}
              </label>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2"></div>
      </main>
    </Screen>
  );
}
