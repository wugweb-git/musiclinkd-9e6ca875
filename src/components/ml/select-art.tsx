import { cn } from "@/lib/utils";

/*
 * Branded artwork for the Select screen banners (owner refs, 5 Oct 2026). Every piece carries an
 * id (`art-…`) and a brand id (`data-brand-id="brand-0001"`…) so it can be named in feedback,
 * listed in Storybook and swapped later. brand-0007 is the "Coming soon" sticker. Drawn in ink, white and the brand
 * pink only. Each piece is a tilted "object" that rises from the banner's bottom edge.
 */

type ArtProps = { className?: string | undefined };

function Tile({
  id,
  brandId,
  className,
  children,
}: {
  id: string;
  /** Brand asset id (owner, 6 Oct 2026): every branded artwork is labelled for Storybook. */
  brandId: string;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <span
      id={id}
      data-art={id}
      data-brand-id={brandId}
      className={cn(
        "select-art relative block h-full w-full shrink-0 transition-[rotate,translate] duration-300 ease-standard motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A record, label in brand pink. */
export function ArtVinyl({ className }: ArtProps) {
  return (
    <Tile id="art-talent-vinyl" brandId="brand-0001" className={className}>
      <svg viewBox="0 0 80 80" className="h-full w-full drop-shadow-md" aria-hidden>
        <circle cx="40" cy="40" r="38" className="fill-ink" />
        {[32, 27, 22].map((r) => (
          <circle
            key={r}
            cx="40"
            cy="40"
            r={r}
            fill="none"
            className="stroke-card/15"
            strokeWidth="1"
          />
        ))}
        <circle cx="40" cy="40" r="13" className="fill-brand" />
        <circle cx="40" cy="40" r="2.5" className="fill-card" />
      </svg>
    </Tile>
  );
}

/** A handwritten setlist card, like the note in the reference. */
export function ArtSetlist({ className }: ArtProps) {
  return (
    <Tile id="art-talent-setlist" brandId="brand-0002" className={className}>
      <span className="flex h-full w-full flex-col rounded-lg bg-card p-2.5 text-left shadow-md">
        <span className="text-[10px] font-semibold text-foreground">Setlist</span>
        <span className="mt-1.5 space-y-1">
          {["w-4/5", "w-3/5", "w-11/12", "w-2/3"].map((w, i) => (
            <span key={i} className={cn("block h-1 rounded-full bg-ink/15", w)} />
          ))}
        </span>
        <svg viewBox="0 0 40 16" className="mt-auto h-4 w-10 stroke-brand" fill="none" aria-hidden>
          <path d="M2 12c6-10 10 6 16-2s8 2 12-4 6 4 8 2" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    </Tile>
  );
}

/** A stage mic on a white tile. */
export function ArtMic({ className }: ArtProps) {
  return (
    <Tile id="art-talent-mic" brandId="brand-0003" className={className}>
      <span className="flex h-full w-full items-center justify-center rounded-lg bg-card shadow-md">
        <svg viewBox="0 0 40 56" className="h-3/5" aria-hidden>
          <rect x="12" y="2" width="16" height="26" rx="8" className="fill-ink" />
          <path
            d="M8 22a12 12 0 0 0 24 0"
            fill="none"
            className="stroke-ink"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 34v14M12 50h16"
            className="stroke-ink"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="20" cy="10" r="2" className="fill-brand" />
        </svg>
      </span>
    </Tile>
  );
}

/** A gig ticket with a punched edge. */
export function ArtTicket({ className }: ArtProps) {
  return (
    <Tile id="art-business-ticket" brandId="brand-0004" className={className}>
      <span className="relative flex h-full w-full flex-col justify-between rounded-lg bg-brand p-2.5 text-left text-white shadow-md">
        <span className="text-[10px] font-semibold">Live · Fri</span>
        <span className="border-t border-dashed border-white/50 pt-1 text-[10px]">Admit one</span>
        <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-ink" />
        <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-ink" />
      </span>
    </Tile>
  );
}

/** A studio booking slip: a day, three slots, one taken. */
export function ArtBooking({ className }: ArtProps) {
  return (
    <Tile id="art-business-booking" brandId="brand-0005" className={className}>
      <span className="flex h-full w-full flex-col rounded-lg bg-ink p-2.5 text-left text-ink-foreground shadow-md">
        <span className="text-[10px] font-semibold">Studio A</span>
        <span className="mt-1.5 space-y-1">
          {[false, true, false].map((taken, i) => (
            <span
              key={i}
              className={cn("block h-2.5 rounded-sm", taken ? "bg-brand" : "bg-white/15")}
            />
          ))}
        </span>
      </span>
    </Tile>
  );
}

/** A mixing fader strip. */
export function ArtFader({ className }: ArtProps) {
  return (
    <Tile id="art-business-fader" brandId="brand-0006" className={className}>
      <span className="flex h-full w-full items-center justify-center gap-2 rounded-lg bg-card shadow-md">
        {["top-2", "top-6", "top-3.5"].map((pos, i) => (
          <span key={i} className="relative h-4/5 w-1 rounded-full bg-ink/15">
            <span
              className={cn(
                "absolute -left-1.5 h-2 w-4 rounded-sm",
                pos,
                i === 1 ? "bg-brand" : "bg-ink",
              )}
            />
          </span>
        ))}
      </span>
    </Tile>
  );
}

/** The coming-soon placeholder: a dashed tile with a plus. */
export function ArtSoon({ className }: ArtProps) {
  return (
    <Tile id="art-academy-soon" brandId="brand-0007" className={className}>
      <span className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-input text-2 text-muted-foreground">
        +
      </span>
    </Tile>
  );
}

/** Academy: a frosted tile with a pink play mark. */
export function ArtPlay({ className }: ArtProps) {
  return (
    <Tile id="art-academy-play" brandId="brand-0009" className={className}>
      <span className="flex h-full w-full items-center justify-center rounded-lg border border-white/60 bg-white/70 shadow-md backdrop-blur-md">
        <svg viewBox="0 0 24 24" className="h-2/5 w-2/5 fill-brand" aria-hidden>
          <path d="M7 4.5v15l12-7.5z" />
        </svg>
      </span>
    </Tile>
  );
}

/** Academy: a frosted pink tile with a waveform. */
export function ArtWave({ className }: ArtProps) {
  return (
    <Tile id="art-academy-wave" brandId="brand-0010" className={className}>
      <span className="flex h-full w-full items-center justify-center gap-0.5 rounded-lg border border-white/60 bg-brand/15 shadow-md backdrop-blur-md">
        {[30, 60, 45, 80, 55, 70, 35, 50].map((h, i) => (
          <span key={i} className="w-0.5 rounded-full bg-brand/70" style={{ height: `${h}%` }} />
        ))}
      </span>
    </Tile>
  );
}
