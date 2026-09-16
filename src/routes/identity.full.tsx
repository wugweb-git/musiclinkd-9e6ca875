/**
 * FLOW-23 · QR-04 "QR fullscreen" · route: /identity/full
 * states: ready · actions: share, download, open
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { QrCode, nativeShare } from "@/components/ml/qr";
import { canonicalUrl, myIdentity, styleFor, type QrStyle } from "@/data/identity";

export const Route = createFileRoute("/identity/full")({
  validateSearch: (s: Record<string, unknown>): { style: QrStyle } => ({
    style: (["light", "dark", "branded", "minimal"] as const).includes(s["style"] as QrStyle)
      ? (s["style"] as QrStyle)
      : "light",
  }),
  head: () => ({
    meta: [
      { title: "Fullscreen QR — MusicLinkd ID" },
      {
        name: "description",
        content: "Show your MusicLinkd QR full screen so anyone can scan it across a room.",
      },
      { property: "og:title", content: "Fullscreen MusicLinkd QR" },
      {
        property: "og:description",
        content: "Maximum brightness, maximum contrast, nothing in the way of the scan.",
      },
    ],
  }),
  component: FullscreenQr,
});

function FullscreenQr() {
  const { style } = Route.useSearch();
  const s = styleFor(style);
  const url = canonicalUrl(myIdentity.code);

  return (
    <div
      className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+16px)]"
      style={{ background: s.light, color: s.dark }}
    >
      <div className="flex justify-end">
        <Link
          to="/identity/qr"
          aria-label="Close fullscreen QR"
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: `${s.dark}12`, color: s.dark }}
        >
          <X size={20} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <QrCode
          value={url}
          size={300}
          style={style}
          label={`Fullscreen MusicLinkd QR for ${myIdentity.name}`}
        />
        <div className="text-center">
          <p className="text-[18px]">{myIdentity.name}</p>
          <p className="text-[13px]" style={{ opacity: 0.6 }}>
            musiclinkd.app/q/{myIdentity.code}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void nativeShare({ title: `${myIdentity.name} on MusicLinkd`, url })}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold"
          style={{ background: s.dark, color: s.light }}
        >
          <Share2 size={16} /> Share
        </button>
        <button
          type="button"
          onClick={() => toast.success("QR image saved")}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold"
          style={{ border: `1px solid ${s.dark}33`, color: s.dark }}
        >
          <Download size={16} /> Save
        </button>
      </div>
    </div>
  );
}
