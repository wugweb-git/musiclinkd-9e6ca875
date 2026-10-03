/**
 * FLOW 23 — QR / Digital Identity & Sharing
 * Reusable Gestalt-native pieces. No new tokens, no separate design system.
 */

import { Link, type LinkProps } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
/*
 * The qrcode library is loaded only in the browser, when a code is drawn or saved. Its server
 * build imports node:fs, which the Cloudflare worker that renders every page does not have; a
 * static import here put it in the server bundle of every page that shows a profile, and every
 * page failed with "No such module node:fs" (3 Oct 2026).
 */
const loadQrCode = () => import("qrcode").then((m) => m.default);
import { Camera, Check, Copy, Download, Image as ImageIcon, Share2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Btn, BtnLink, Sheet, VerifiedBadge } from "./ui";
import { useViewer } from "./viewer";
import { Price, SoonBadge } from "./kit";
import { styleFor, type DestinationPreview, type QrStyle } from "@/data/identity";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";
import { DOWNLOAD_UNAVAILABLE, downloadBlob } from "@/lib/download";

/**
 * Saves the QR for `value` as a PNG through the browser (talent and business QR screens).
 * Black on white with a quiet zone, large enough to print.
 */
export async function downloadQr(value: string, fileName: string) {
  try {
    const { name, png } = await qrPng(value, fileName);
    if (downloadBlob(name, png)) toast.success("QR image saved");
    else toast.error(DOWNLOAD_UNAVAILABLE);
  } catch {
    toast.error("Couldn't make the QR image. Try again.");
  }
}

/** The QR for `value` as a printable PNG (black on white, quiet zone), with its file name. */
async function qrPng(value: string, fileName: string) {
  const QRCode = await loadQrCode();
  const dataUrl = await QRCode.toDataURL(value, {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
  const name = `${fileName.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "musiclinkd"}-qr.png`;
  return { name, png: await (await fetch(dataUrl)).blob() };
}

/**
 * Sends the QR image itself through the share sheet. Where the device can't share files, the
 * image is saved instead, so the control always does what it says: gives you the code image.
 */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export async function shareQr(value: string, title: string) {
  let file: File;
  try {
    const { name, png } = await qrPng(value, title);
    file = new File([png], name, { type: "image/png" });
  } catch {
    toast.error("Couldn't make the QR image. Try again.");
    return;
  }
  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean;
    share?: (d: ShareData) => Promise<void>;
  };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ title, files: [file] });
    } catch {
      /* user dismissed — no error state needed */
    }
    return;
  }
  await downloadQr(value, title);
}

/* ------------------------------------------------------------------ */
/* QR matrix — rendered client-side, high contrast, generous quiet zone */
/* ------------------------------------------------------------------ */

export function QrCode({
  value,
  size = 220,
  style = "light",
  className = "",
  label,
  overlay,
}: {
  value: string;
  size?: number;
  style?: QrStyle;
  className?: string;
  label?: string;
  /** A photo set into the middle of the code. Raises error correction so it still scans. */
  overlay?: string | undefined;
}) {
  const s = styleFor(style);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    loadQrCode()
      .then((QRCode) =>
        QRCode.toDataURL(value, {
          errorCorrectionLevel: overlay ? "H" : "M",
          margin: 2, // quiet zone
          width: size * 3,
          color: { dark: s.dark, light: s.light },
        }),
      )
      .then((d) => {
        if (alive) setSrc(d);
      })
      .catch(() => {
        if (!alive) return;
        setSrc(null);
        setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [value, size, s.dark, s.light, overlay]);

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg ${className}`}
      style={{ background: s.light, width: size, height: size }}
    >
      {src ? (
        <>
          <img
            src={sized(src, { width: 412 })}
            alt={label ?? `QR code for ${value}`}
            width={size}
            height={size}
            className="h-full w-full rounded-lg"
          />
          {overlay ? (
            <img
              src={overlay}
              alt=""
              aria-hidden
              className="absolute rounded-full border-4 object-cover"
              style={{
                width: size * 0.26,
                height: size * 0.26,
                borderColor: s.light,
              }}
            />
          ) : null}
        </>
      ) : failed ? (
        <p className="p-3 text-center text-1 text-muted-foreground" role="alert">
          Couldn't make the QR code
        </p>
      ) : (
        <div
          className="h-full w-full animate-pulse rounded-lg bg-subtle"
          role="img"
          aria-label="Generating QR code"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Identity card — WHO / WHAT THEY DO / MUSICLINKD / HOW TO CONNECT     */
/* ------------------------------------------------------------------ */

export function QrIdentityCard({
  name,
  role,
  photo,
  verified,
  handle,
  url,
  style = "light",
  tagline,
  compact,
}: {
  name: string;
  role: string;
  photo: string;
  verified?: boolean;
  handle: string;
  /** The real address a scan lands on — no `/q/$code` resolver exists, so this is shown as-is. */
  url: string;
  style?: QrStyle;
  tagline?: string;
  compact?: boolean;
}) {
  const s = styleFor(style);
  const onInk = style === "dark";
  return (
    <article
      className="overflow-hidden rounded-lg border border-border p-5 text-center"
      style={{ background: s.light, color: s.dark }}
    >
      <p className="pill bg-background/10">MusicLinkd</p>

      <div className="mt-4 flex flex-col items-center gap-2">
        <img
          src={sized(photo, { width: 64 })}
          alt=""
          className="h-16 w-16 rounded-full object-cover"
          style={{ border: `2px solid ${s.dark}20` }}
        />
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-2 leading-tight" style={{ color: s.dark }}>
            {name}
          </h2>
          {verified ? <VerifiedBadge size={16} /> : null}
        </div>
        <p className="text-1 opacity-70">{role}</p>
        {tagline && !compact ? <p className="max-w-[240px] text-1 opacity-60">{tagline}</p> : null}
      </div>

      <div className="mt-5 flex justify-center">
        <QrCode
          value={url}
          size={compact ? 160 : 200}
          style={style}
          label={`MusicLinkd QR for ${name}`}
        />
      </div>

      <p className={`mt-4 truncate text-1 font-semibold ${onInk ? "opacity-85" : "opacity-70"}`}>
        {url.replace(/^https?:\/\//, "")}
      </p>
      <p className="text-1 opacity-50">@{handle}</p>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Scanner chrome                                                       */
/* ------------------------------------------------------------------ */

export function ScanFrame({ scanning }: { scanning: boolean }) {
  return (
    <div className="relative mx-auto aspect-square w-[260px]" aria-hidden>
      {[
        "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
        "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
        "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-lg",
        "right-0 bottom-0 border-r-4 border-b-4 rounded-br-lg",
      ].map((c) => (
        <span key={c} className={`absolute h-12 w-12 border-ink ${c}`} />
      ))}
      {scanning ? (
        <span className="absolute inset-x-6 top-1/2 h-0.5 animate-pulse rounded-full bg-ink/80" />
      ) : null}
    </div>
  );
}

export function CameraSurface({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[440px] flex-1 items-center justify-center overflow-hidden rounded-lg bg-ink">
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(120%_80%_at_50%_20%,#374151,transparent)]" />
      <div className="relative w-full px-6">{children}</div>
    </div>
  );
}

export function ScannerControls({
  flash,
  onFlash,
  onGallery,
}: {
  flash: boolean;
  onFlash: () => void;
  onGallery: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onFlash}
        aria-pressed={flash}
        aria-label="Toggle flash"
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-border ${
          flash ? "bg-ink text-ink-foreground" : "bg-card text-foreground"
        }`}
      >
        <Zap size={iconSize.md} />
      </button>
      <button
        type="button"
        onClick={onGallery}
        className="inline-flex min-h-control items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold"
      >
        <ImageIcon size={iconSize.sm} /> Choose from gallery
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Destination preview — what a scan resolves to, before opening        */
/* ------------------------------------------------------------------ */

const kindLabel: Record<DestinationPreview["kind"], string> = {
  profile: "MusicLinkd profile",
  business: "Business profile",
  portfolio: "Portfolio",
  portfolioItem: "Portfolio work",
  service: "Service",
  listing: "Marketplace listing",
  opportunity: "Opportunity",
  band: "Band profile",
};

export function DestinationPreviewCard({ preview }: { preview: DestinationPreview }) {
  return (
    <section className="rounded-lg bg-subtle p-4">
      <p className="pill bg-background text-muted-foreground">{kindLabel[preview.kind]}</p>
      <div className="mt-3 flex gap-3">
        {preview.image ? (
          <img
            src={sized(preview.image, { width: 80 })}
            alt=""
            className={`h-20 w-20 shrink-0 object-cover ${
              preview.kind === "profile" ? "rounded-full" : "rounded-lg"
            }`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h2 className="min-w-0 text-2 leading-tight">{preview.title}</h2>
            {preview.verified ? <VerifiedBadge size={16} /> : null}
          </div>
          {preview.subtitle ? (
            <p className="mt-1 text-1 text-muted-foreground">{preview.subtitle}</p>
          ) : null}
          {preview.meta ? (
            <p className="mt-0.5 truncate text-1 text-muted-foreground">{preview.meta}</p>
          ) : null}
          <Price price={preview.price} className="mt-1" amountClassName="text-1 font-semibold" />
          {preview.extra ? (
            <p className="mt-0.5 truncate text-1 text-muted-foreground">{preview.extra}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared small pieces                                                  */
/* ------------------------------------------------------------------ */

export function ActionRow({
  icon,
  label,
  hint,
  onClick,
  to,
  search,
  soon,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
  to?: LinkProps["to"];
  /** Search params for `to`, so one screen with a subject param can be linked without a second row. */
  search?: LinkProps["search"];
  /** Screen exists but has no backend yet — show, but don't link. */
  soon?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {hint ? <span className="block truncate text-1 text-muted-foreground">{hint}</span> : null}
      </span>
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-lg bg-subtle px-4 py-3 text-left";
  if (soon) {
    return (
      <div aria-disabled="true" className={cls}>
        {inner}
        <SoonBadge />
      </div>
    );
  }
  if (to) {
    return (
      <Link to={to} {...(search ? { search } : {})} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function CopyLinkRow({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
      <span className="min-w-0 flex-1 truncate text-1 text-muted-foreground">{url}</span>
      <button
        type="button"
        aria-label="Copy link"
        onClick={() => {
          void copyText(url).then((ok) => {
            if (!ok) return;
            setDone(true);
            timer.current = setTimeout(() => setDone(false), 1600);
          });
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-background"
      >
        {done ? <Check size={iconSize.sm} /> : <Copy size={iconSize.sm} />}
      </button>
    </div>
  );
}

/** Share / download use native capabilities where available, with honest fallbacks. */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export async function nativeShare(payload: { title: string; text?: string; url: string }) {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({
        title: payload.title,
        ...(payload.text ? { text: payload.text } : {}),
        url: payload.url,
      });
      return;
    } catch {
      /* user dismissed — no error state needed */
      return;
    }
  }
  await copyText(payload.url, "Sharing isn't available here, so the link was copied");
}

/**
 * Copies `text` and says so only once the clipboard write has resolved; a failed write says it
 * failed. Returns whether it worked.
 */
// eslint-disable-next-line react-refresh/only-export-components -- helper intentionally co-located with its component
export async function copyText(text: string, success = "Link copied") {
  try {
    if (!navigator.clipboard) throw new Error("No clipboard");
    await navigator.clipboard.writeText(text);
    toast.success(success);
    return true;
  } catch {
    toast.error("Couldn't copy the link");
    return false;
  }
}

export function ShareActions({
  url,
  title,
  onDownload,
  onSaveContact,
}: {
  url: string;
  title: string;
  onDownload?: () => void;
  onSaveContact?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ActionRow
        icon={<Share2 size={iconSize.sm} />}
        label="Share QR"
        hint="Send the code image"
        onClick={() => void shareQr(url, title)}
      />
      <ActionRow
        icon={<Camera size={iconSize.sm} />}
        label="Share profile"
        hint={url}
        onClick={() => void nativeShare({ title, url })}
      />
      <ActionRow
        icon={<Copy size={iconSize.sm} />}
        label="Copy link"
        onClick={() => void copyText(url)}
      />
      <ActionRow
        icon={<Share2 size={iconSize.sm} />}
        label="Send via MusicLinkd"
        hint="Opens Connections"
        to="/messages"
      />
      {onDownload ? (
        <ActionRow
          icon={<Download size={iconSize.sm} />}
          label="Download image"
          onClick={onDownload}
        />
      ) : null}
      {onSaveContact ? (
        <ActionRow
          icon={<Check size={iconSize.sm} />}
          label="Add to contacts"
          onClick={onSaveContact}
        />
      ) : null}
    </div>
  );
}

export function DownloadNote() {
  return (
    <p className="px-1 text-1 text-muted-foreground">
      Downloads save through your browser. On some Android browsers the image opens in a new tab —
      long-press to save it.
    </p>
  );
}

/** A button action: a typed route or a handler. */
type PairAction = { label: string; onClick?: () => void; to?: LinkProps["to"] };

export function PrimaryPair({
  primary,
  secondary,
}: {
  primary: PairAction;
  secondary?: PairAction;
}) {
  const wrap = (a: PairAction, variant: "primary" | "outline") =>
    a.to ? (
      <BtnLink to={a.to} variant={variant} className="flex-1 w-full">
        {a.label}
      </BtnLink>
    ) : (
      <Btn variant={variant} className="flex-1" {...(a.onClick ? { onClick: a.onClick } : {})}>
        {a.label}
      </Btn>
    );
  return (
    <div className="flex gap-2">
      {wrap(primary, "primary")}
      {secondary ? wrap(secondary, "outline") : null}
    </div>
  );
}
