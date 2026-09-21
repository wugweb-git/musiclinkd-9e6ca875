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
  Share2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useMyIdentity } from "@/hooks/use-my-identity";
import { saveMyProfile } from "@/lib/portfolio.functions";
import { Screen, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import {
  QrCode,
  CopyLinkRow,
  ShareActions,
  ActionRow,
  StateCard,
  Skeleton,
  DownloadNote,
  downloadQr,
  nativeShare,
} from "@/components/ml/qr";
import { qrStyles, type QrStyle } from "@/data/identity";
import { iconSize } from "@/lib/tokens";

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
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<"loading" | "ready" | "offline">("loading");
  const [share, setShare] = useState(false);
  const [look, setLook] = useState(false);
  const me = useMyIdentity();
  const url = me.url;
  const style = me.qrStyle;
  const save = useServerFn(saveMyProfile);
  async function setStyle(next: QrStyle) {
    queryClient.setQueryData(["profile", "me"], (prev: unknown) =>
      prev && typeof prev === "object" ? { ...prev, qr_style: next } : prev,
    );
    try {
      await save({ data: { qr_style: next } });
    } catch {
      toast.error("Couldn't save that style — try again");
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    }
  }

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
            <ArrowLeft size={iconSize.md} aria-hidden />
          </Link>
        </div>

        {phase === "loading" || !me.ready ? (
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
            {url ? (
              <div className="mt-6 flex justify-center">
                <div className="rounded-3xl bg-background p-4">
                  <QrCode
                    value={url}
                    size={232}
                    style={style}
                    overlay={me.photo || undefined}
                    label={`MusicLinkd QR for ${me.name || "your profile"}`}
                  />
                </div>
              </div>
            ) : (
              // No username, no public address: there is nothing honest to put in a code yet.
              <div className="mt-6 rounded-3xl bg-background/10 p-5 text-center">
                <h1 className="text-2 font-semibold">Claim your username first</h1>
                <p className="mt-1 text-1 text-background/70">
                  Your code points at your public profile, and that needs a username.
                </p>
                <BtnLink
                  to="/profile/edit"
                  variant="ghost"
                  className="mt-4 w-full bg-background text-foreground"
                >
                  Set Username
                </BtnLink>
              </div>
            )}

            <div className="mt-5 text-center">
              <h1 className="flex items-center justify-center gap-1.5 text-3 leading-tight">
                {me.name}
                {me.verified ? (
                  <BadgeCheck size={iconSize.md} aria-label="Verified" className="shrink-0" />
                ) : null}
              </h1>
              {me.username || me.role ? (
                <p className="mt-1 text-sm text-background/70">
                  {[me.username ? `@${me.username}` : "", me.role].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>

            <div className={`mt-5 flex items-center justify-center gap-2 ${url ? "" : "hidden"}`}>
              <Btn
                variant="ghost"
                className="min-w-0 flex-1 bg-background px-3 text-foreground"
                icon={<Share2 size={iconSize.sm} aria-hidden />}
                onClick={() => setShare(true)}
              >
                Share
              </Btn>
              <Btn
                variant="ghost"
                className="min-w-0 flex-1 border border-background/25 px-3 text-background"
                icon={<Palette size={iconSize.sm} aria-hidden />}
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
          {url ? <CopyLinkRow url={url} /> : null}

          <div className="mt-4 flex flex-col gap-2">
            <ActionRow
              icon={<ScanLine size={iconSize.sm} />}
              label="Scan a MusicLinkd QR"
              hint="Point the camera at someone's code"
              to="/identity/scan"
            />
            <ActionRow
              icon={<IdCard size={iconSize.sm} />}
              label="Digital business card"
              hint="Name, role, the contact details you choose to share"
              to="/identity/contact"
            />
            <ActionRow
              icon={<Building2 size={iconSize.sm} />}
              label="Business QR"
              hint="A code for a studio, label or venue you run"
              to="/identity/business"
              soon
            />
            <ActionRow
              icon={<Printer size={iconSize.sm} />}
              label="Print preview"
              hint="Card, poster, studio sign, badge"
              to="/identity/print"
            />
            <ActionRow
              icon={<History size={iconSize.sm} />}
              label="Scanned QR history"
              to="/identity/history"
            />
            <ActionRow
              icon={<BarChart3 size={iconSize.sm} />}
              label="QR analytics"
              hint="Total scans, unique people, recent activity"
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
          title={`${me.name || "My profile"} on MusicLinkd`}
          onDownload={() => void downloadQr(url, me.username ?? "profile")}
          onSaveContact={() => void nativeShare({ title: me.name || "MusicLinkd", url })}
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
              className={`state-layer flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left ${
                style === s.value ? "border-foreground bg-subtle" : "border-transparent bg-subtle"
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
