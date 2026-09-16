/**
 * FLOW-23 · QR-01 "MusicLinkd ID" + QR-02 "Personal QR" + QR-05 "Share sheet"
 * route: /identity/qr · dataSource: profile, businessProfile, share
 * states: loading, ready, offline, error · actions: share, download, copy, open, scan
 *
 * The screen is the code: one big scannable tile with the person's photo set into it, their name
 * under it, and the things you do with it as rows below — the shape Snapchat settled on, because
 * someone holding a phone up to a camera should not have to find the QR first.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  BadgeCheck,
  Building2,
  History,
  IdCard,
  Palette,
  Printer,
  ScanLine,
  Settings2,
  Share2,
} from "lucide-react";
import { Screen, Btn, Sheet } from "@/components/ml/ui";
import {
  QrCode,
  CopyLinkRow,
  ShareActions,
  ActionRow,
  StateCard,
  Skeleton,
  DownloadNote,
  nativeShare,
} from "@/components/ml/qr";
import { canonicalUrl, myIdentity, qrStyles, type QrStyle } from "@/data/identity";

export const Route = createFileRoute("/identity/qr")({
  head: () => ({
    meta: [
      { title: "Your MusicLinkd ID — QR & digital identity" },
      {
        name: "description",
        content:
          "Share your MusicLinkd professional identity instantly with a scannable QR code or digital business card.",
      },
      { property: "og:title", content: "Your MusicLinkd ID" },
      {
        property: "og:description",
        content: "A portable professional identity for studios, events and business cards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DigitalId,
});

function DigitalId() {
  const [phase, setPhase] = useState<"loading" | "ready" | "offline">("loading");
  const [style, setStyle] = useState<QrStyle>("light");
  const [share, setShare] = useState(false);
  const [look, setLook] = useState(false);
  const url = canonicalUrl(myIdentity.code);

  useEffect(() => {
    const online = typeof navigator === "undefined" || navigator.onLine;
    const t = setTimeout(() => setPhase(online ? "ready" : "offline"), 420);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen>
      {/* The code sits on ink, so the tile is the brightest thing on the screen. */}
      <section className="relative bg-ink px-5 pb-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-background">
        <div className="flex items-center justify-between">
          <Link
            to="/profile"
            aria-label="Back to your profile"
            className="hit-area state-layer flex h-10 w-10 items-center justify-center rounded-full border border-background/25 bg-background/10"
          >
            <ArrowLeft size={20} aria-hidden />
          </Link>
          <Link
            to="/identity/settings"
            aria-label="QR settings"
            className="hit-area state-layer flex h-10 w-10 items-center justify-center rounded-full border border-background/25 bg-background/10"
          >
            <Settings2 size={16} aria-hidden />
          </Link>
        </div>

        {phase === "loading" ? (
          <div className="mt-6 flex justify-center" aria-busy>
            <Skeleton className="h-[260px] w-[260px] rounded-3xl" />
          </div>
        ) : phase === "offline" ? (
          <div className="mt-6">
            <StateCard
              title="You're offline"
              body="Your QR still works — anyone scanning it opens your profile once they're online."
            >
              <Btn onClick={() => setPhase("ready")}>Show My QR Anyway</Btn>
            </StateCard>
          </div>
        ) : (
          <>
            <div className="mt-6 flex justify-center">
              <div className="rounded-3xl bg-background p-4">
                <QrCode
                  value={url}
                  size={232}
                  style={style}
                  overlay={myIdentity.photo}
                  label={`MusicLinkd QR for ${myIdentity.name}`}
                />
              </div>
            </div>

            <div className="mt-5 text-center">
              <h1 className="flex items-center justify-center gap-1.5 text-3 leading-tight">
                {myIdentity.name}
                {myIdentity.verified ? (
                  <BadgeCheck size={20} aria-label="Verified" className="shrink-0" />
                ) : null}
              </h1>
              <p className="mt-1 text-sm text-background/70">
                @{myIdentity.username} · {myIdentity.role}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              <Btn
                variant="ghost"
                className="min-w-0 flex-1 bg-background px-3 text-foreground"
                icon={<Share2 size={16} aria-hidden />}
                onClick={() => setShare(true)}
              >
                Share
              </Btn>
              <Btn
                variant="ghost"
                className="min-w-0 flex-1 border border-background/25 px-3 text-background"
                icon={<Palette size={16} aria-hidden />}
                onClick={() => setLook(true)}
              >
                Style
              </Btn>
            </div>
          </>
        )}
      </section>

      {phase === "ready" ? (
        <main className="px-5 pt-5 pb-8">
          <CopyLinkRow url={url} />

          <div className="mt-4 flex flex-col gap-2">
            <ActionRow
              icon={<ScanLine size={16} />}
              label="Scan a MusicLinkd QR"
              hint="Point the camera at someone's code"
              to="/identity/scan"
            />
            <ActionRow
              icon={<IdCard size={16} />}
              label="Digital business card"
              hint="Name, role, the contact details you choose to share"
              to="/identity/contact"
            />
            <ActionRow
              icon={<Building2 size={16} />}
              label="Business QR"
              hint="Octave Sound Labs"
              to="/identity/business"
            />
            <ActionRow
              icon={<Printer size={16} />}
              label="Print preview"
              hint="Card, poster, studio sign, badge"
              to="/identity/print"
            />
            <ActionRow icon={<History size={16} />} label="Scan history" to="/identity/history" />
            <ActionRow
              icon={<BarChart3 size={16} />}
              label="QR analytics"
              hint="Scans, visits, conversions"
              to="/identity/analytics"
            />
          </div>

          <p className="mt-5 px-1 text-1 text-muted-foreground">
            Your QR never carries personal data — it points to your public MusicLinkd profile, so
            edits show up instantly without reprinting anything.
          </p>
        </main>
      ) : null}

      <Sheet open={share} onClose={() => setShare(false)} title="Share your MusicLinkd ID">
        <ShareActions
          url={url}
          title={`${myIdentity.name} on MusicLinkd`}
          onDownload={() => toast.success("QR image saved")}
          onSaveContact={() => void nativeShare({ title: myIdentity.name, url })}
        />
        <div className="mt-3">
          <DownloadNote />
        </div>
      </Sheet>

      {/* Presentation only: the code's colours, nothing about what it points at. */}
      <Sheet open={look} onClose={() => setLook(false)} title="How your code looks">
        <div className="flex flex-col gap-2">
          {qrStyles.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setStyle(s.value);
                setLook(false);
              }}
              aria-pressed={style === s.value}
              className={`state-layer flex items-center gap-3 rounded-lg border px-4 py-3 text-left ${
                style === s.value ? "border-foreground bg-subtle" : "border-border bg-card"
              }`}
            >
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-sm border border-border"
                style={{ background: s.light, boxShadow: `inset 0 0 0 6px ${s.dark}` }}
              />
              <span className="min-w-0">
                <span className="block text-2 font-semibold">{s.label}</span>
                <span className="block text-1 text-muted-foreground">{s.blurb}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 px-1 text-1 text-muted-foreground">
          Every option keeps a wide quiet zone and passes contrast checks, so cameras still read it
          from across a room.
        </p>
      </Sheet>
    </Screen>
  );
}
