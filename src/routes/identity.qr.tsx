/**
 * FLOW-23 · QR-01 "MusicLinkd ID" + QR-02 "Personal QR" + QR-05 "Share sheet"
 * route: /identity/qr · dataSource: profile, businessProfile, share
 * states: loading, ready, offline, error · actions: share, download, copy, open, scan
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Building2,
  Download,
  History,
  Maximize2,
  Palette,
  Printer,
  QrCode as QrIcon,
  ScanLine,
  Settings2,
  Share2,
  IdCard,
} from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet, SectionHeader } from "@/components/ml/ui";
import {
  QrIdentityCard,
  CopyLinkRow,
  ShareActions,
  ActionRow,
  StateCard,
  Skeleton,
  DownloadNote,
  nativeShare,
} from "@/components/ml/qr";
import { canonicalUrl, myIdentity, type QrStyle } from "@/data/identity";

export const Route = createFileRoute("/identity/qr")({
  head: () => ({
    meta: [
      { title: "Your MusicLinkd ID — QR & digital identity" },
      {
        name: "description",
        content:
          "Share your MusicLinkd professional identity instantly with a scannable QR code, share card or digital business card.",
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
  const url = canonicalUrl(myIdentity.code);

  useEffect(() => {
    const online = typeof navigator === "undefined" || navigator.onLine;
    const t = setTimeout(() => setPhase(online ? "ready" : "offline"), 420);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen>
      <TopBar
        title="Your MusicLinkd ID"
        subtitle={`@${myIdentity.username}`}
        back="/me"
        right={
          <Link
            to="/identity/settings"
            aria-label="QR settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <Settings2 size={17} />
          </Link>
        }
      />

      <main className="px-5 pt-4">
        {phase === "loading" ? (
          <div className="flex flex-col gap-3" aria-busy>
            <Skeleton className="h-[420px] w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : phase === "offline" ? (
          <StateCard
            title="You're offline"
            body="Your QR still works — anyone scanning it will open your profile once they're online."
          >
            <Btn onClick={() => setPhase("ready")}>Show my QR anyway</Btn>
          </StateCard>
        ) : (
          <>
            <QrIdentityCard
              name={myIdentity.name}
              role={myIdentity.role}
              photo={myIdentity.photo}
              verified={myIdentity.verified}
              handle={myIdentity.username}
              code={myIdentity.code}
              style={style}
              tagline={myIdentity.tagline}
            />

            <div className="mt-3">
              <CopyLinkRow url={url} />
            </div>

            <div className="mt-3 flex gap-2">
              <Btn className="flex-1" onClick={() => setShare(true)}>
                <Share2 size={16} className="mr-2" /> Share
              </Btn>
              <BtnLink
                to="/identity/full"
                search={{ style }}
                variant="outline"
                className="flex-1 w-full"
              >
                <Maximize2 size={16} className="mr-2" /> Fullscreen
              </BtnLink>
            </div>

            <div className="rail mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {(["light", "dark", "branded", "minimal"] as QrStyle[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  aria-pressed={style === s}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold capitalize ${
                    style === s
                      ? "border-transparent bg-ink text-background"
                      : "border-border bg-card"
                  }`}
                >
                  {s === "branded" ? "MusicLinkd" : s}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <SectionHeader title="Use it everywhere" />
              <div className="flex flex-col gap-2">
                <ActionRow
                  icon={<IdCard size={17} />}
                  label="Digital business card"
                  hint="Name, role, contact you choose to share"
                  to="/identity/contact"
                />
                <ActionRow
                  icon={<QrIcon size={17} />}
                  label="Share card"
                  hint="A printable identity card"
                  to="/identity/card"
                />
                <ActionRow
                  icon={<Building2 size={17} />}
                  label="Business QR"
                  hint="Octave Sound Labs"
                  to="/identity/business"
                />
                <ActionRow
                  icon={<Palette size={17} />}
                  label="Customise presentation"
                  to="/identity/customize"
                />
                <ActionRow
                  icon={<Printer size={17} />}
                  label="Print preview"
                  hint="Card, poster, studio sign, badge"
                  to="/identity/print"
                />
                <ActionRow
                  icon={<ScanLine size={17} />}
                  label="Scan a MusicLinkd QR"
                  to="/identity/scan"
                />
                <ActionRow
                  icon={<History size={17} />}
                  label="Scan history"
                  to="/identity/history"
                />
                <ActionRow
                  icon={<BarChart3 size={17} />}
                  label="QR analytics"
                  hint="Scans, visits, conversions"
                  to="/identity/analytics"
                />
              </div>
            </div>

            <p className="mt-5 px-1 text-[12px] text-muted-foreground">
              Your QR never carries personal data — it points to your public MusicLinkd profile, so
              edits show up instantly without reprinting anything.
            </p>
          </>
        )}
      </main>

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
        <div className="mt-4">
          <BtnLink to="/identity/card" variant="outline" className="w-full">
            <Download size={16} className="mr-2" /> Make a share card instead
          </BtnLink>
        </div>
      </Sheet>
    </Screen>
  );
}
