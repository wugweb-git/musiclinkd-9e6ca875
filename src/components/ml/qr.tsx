/**
 * FLOW 23 — QR / Digital Identity & Sharing
 * Reusable Gestalt-native pieces. No new tokens, no separate design system.
 */

import { Link, type LinkProps } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { Camera, Check, Copy, Download, Image as ImageIcon, Share2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Btn, BtnLink, VerifiedBadge } from "./ui";
import { Price } from "./kit";
import { canonicalUrl, styleFor, type DestinationPreview, type QrStyle } from "@/data/identity";

/* ------------------------------------------------------------------ */
/* QR matrix — rendered client-side, high contrast, generous quiet zone */
/* ------------------------------------------------------------------ */

export function QrCode({
  value,
  size = 220,
  style = "light",
  className = "",
  label,
}: {
  value: string;
  size?: number;
  style?: QrStyle;
  className?: string;
  label?: string;
}) {
  const s = styleFor(style);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2, // quiet zone
      width: size * 3,
      color: { dark: s.dark, light: s.light },
    })
      .then((d) => {
        if (alive) setSrc(d);
      })
      .catch(() => {
        if (alive) setSrc(null);
      });
    return () => {
      alive = false;
    };
  }, [value, size, s.dark, s.light]);

  return (
    <div
      className={`flex items-center justify-center rounded-lg ${className}`}
      style={{ background: s.light, width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={label ?? `QR code for ${value}`}
          width={size}
          height={size}
          className="h-full w-full rounded-lg"
        />
      ) : (
        <div
          className="h-full w-full animate-pulse rounded-lg bg-subtle"
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
  code,
  style = "light",
  tagline,
  compact,
}: {
  name: string;
  role: string;
  photo: string;
  verified?: boolean;
  handle: string;
  code: string;
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
      <p className="text-1 font-bold uppercase tracking-widest opacity-60">MusicLinkd</p>

      <div className="mt-4 flex flex-col items-center gap-2">
        <img
          src={photo}
          alt=""
          className="h-16 w-16 rounded-full object-cover"
          style={{ border: `2px solid ${s.dark}20` }}
        />
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-2 leading-tight" style={{ color: s.dark }}>
            {name}
          </h2>
          {verified ? <VerifiedBadge size={15} /> : null}
        </div>
        <p className="text-1 opacity-70">{role}</p>
        {tagline && !compact ? <p className="max-w-[240px] text-1 opacity-60">{tagline}</p> : null}
      </div>

      <div className="mt-5 flex justify-center">
        <QrCode
          value={canonicalUrl(code)}
          size={compact ? 160 : 200}
          style={style}
          label={`MusicLinkd QR for ${name}`}
        />
      </div>

      <p className={`mt-4 text-1 font-semibold ${onInk ? "opacity-85" : "opacity-70"}`}>
        musiclinkd.app/q/{code}
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
        <span key={c} className={`absolute h-12 w-12 border-primary ${c}`} />
      ))}
      {scanning ? (
        <span className="absolute inset-x-6 top-1/2 h-0.5 animate-pulse rounded-full bg-primary/80" />
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
          flash ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
        }`}
      >
        <Zap size={18} />
      </button>
      <button
        type="button"
        onClick={onGallery}
        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold"
      >
        <ImageIcon size={16} /> Choose from gallery
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
    <section className="rounded-lg border border-border bg-card p-4">
      <p className="text-1 font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {kindLabel[preview.kind]}
      </p>
      <div className="mt-3 flex gap-3">
        {preview.image ? (
          <img
            src={preview.image}
            alt=""
            className={`h-20 w-20 shrink-0 object-cover ${
              preview.kind === "profile" ? "rounded-full" : "rounded-lg"
            }`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h2 className="min-w-0 text-2 leading-tight">{preview.title}</h2>
            {preview.verified ? <VerifiedBadge size={15} /> : null}
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

export function StateCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 text-center">
      <h2 className="text-2 leading-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground">{body}</p>
      {children ? <div className="mt-5 flex flex-col gap-2">{children}</div> : null}
    </section>
  );
}

export function ActionRow({
  icon,
  label,
  hint,
  onClick,
  to,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
  to?: LinkProps["to"];
}) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {hint ? <span className="block truncate text-1 text-muted-foreground">{hint}</span> : null}
      </span>
    </>
  );
  const cls =
    "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left";
  if (to) {
    return (
      <Link to={to} className={cls}>
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
          void navigator.clipboard?.writeText(url).catch(() => undefined);
          setDone(true);
          toast.success("Link copied");
          timer.current = setTimeout(() => setDone(false), 1600);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle"
      >
        {done ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

/** Share / download use native capabilities where available, with honest fallbacks. */
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
  void navigator.clipboard?.writeText(payload.url).catch(() => undefined);
  toast("Sharing isn't available in this browser — link copied instead");
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
        icon={<Share2 size={17} />}
        label="Share QR"
        hint="Send the code image"
        onClick={() => void nativeShare({ title, url })}
      />
      <ActionRow
        icon={<Camera size={17} />}
        label="Share profile"
        hint={url}
        onClick={() => void nativeShare({ title, url })}
      />
      <ActionRow
        icon={<Copy size={17} />}
        label="Copy link"
        onClick={() => {
          void navigator.clipboard?.writeText(url);
          toast.success("Link copied");
        }}
      />
      <ActionRow
        icon={<Share2 size={17} />}
        label="Send via MusicLinkd"
        hint="Opens Connections"
        to="/messages"
      />
      {onDownload ? (
        <ActionRow icon={<Download size={17} />} label="Download image" onClick={onDownload} />
      ) : null}
      {onSaveContact ? (
        <ActionRow icon={<Check size={17} />} label="Add to contacts" onClick={onSaveContact} />
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

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-subtle ${className}`} />;
}
