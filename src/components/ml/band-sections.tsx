import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Btn, IconBtn, Sheet } from "@/components/ml/ui";
import { Card } from "@/components/ml/kit";
import { PhotoSheet } from "@/components/ml/booking";
import { MediaEmbed } from "@/components/ml/media-embed";
import { ImagePickButton } from "@/components/ml/profile";
import { Field, TagListField, inputClass, videoProblem } from "@/components/ml/listing-form";
import { riderLine, type BandLiveVideoView } from "@/lib/band-view";
import {
  addBandLiveVideo,
  removeBandLiveVideo,
  saveBandRider,
  saveBandStagePlot,
} from "@/lib/bands.functions";
import { uploadProfileImage } from "@/lib/profile-images";
import { iconSize } from "@/lib/tokens";

/*
 * A band's live performance videos, technical rider and stage plot: the sections the first band
 * page had (src/routes/band.tsx, 11 Aug), now on the database. Visitors see them on the band page
 * when the band has added them; the owner and admins edit them from Manage band and the portfolio.
 */

const failed = (e: unknown) =>
  toast.error(e instanceof Error && e.message ? e.message : "That didn't save. Try again.");

/** Live videos as a rail, each playing in place. */
export function BandLiveVideoRail({ videos }: { videos: BandLiveVideoView[] }) {
  return (
    <div className="rail -mx-5 flex gap-3 overflow-x-auto px-5 no-scrollbar">
      {videos.map((v) => (
        <article key={v.id} className="w-[260px] shrink-0 rounded-lg bg-subtle p-3">
          <MediaEmbed url={v.url} title={v.title} />
          <h3 className="mt-2 truncate text-1">{v.title}</h3>
        </article>
      ))}
    </div>
  );
}

/** Live videos as a list, for the portfolio. The owner and admins can remove one. */
export function BandLiveVideoList({
  videos,
  canManage,
}: {
  videos: BandLiveVideoView[];
  canManage: boolean;
}) {
  const router = useRouter();
  const remove = useServerFn(removeBandLiveVideo);
  const [busy, setBusy] = useState<string | null>(null);
  const onRemove = async (videoId: string) => {
    setBusy(videoId);
    try {
      await remove({ data: { videoId } });
      await router.invalidate();
    } catch (e) {
      failed(e);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-3">
      {videos.map((v) => (
        <Card key={v.id}>
          <div className="mb-3 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{v.title}</p>
            {canManage ? (
              <IconBtn
                label={`Remove ${v.title}`}
                variant="ghost"
                loading={busy === v.id}
                onClick={() => void onRemove(v.id)}
              >
                <Trash2 size={iconSize.sm} aria-hidden />
              </IconBtn>
            ) : null}
          </div>
          <MediaEmbed url={v.url} title={v.title} />
        </Card>
      ))}
    </div>
  );
}

/** The add-a-live-video form: a title and a link. */
export function BandLiveVideoSheet({
  bandId,
  open,
  onClose,
}: {
  bandId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const add = useServerFn(addBandLiveVideo);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);
  const linkProblem = url.trim() ? videoProblem(url) : "Paste the video's link";
  const titleProblem = title.trim() ? null : "Give the video a title";

  const save = async () => {
    setTried(true);
    if (linkProblem || titleProblem) return;
    setSaving(true);
    try {
      await add({ data: { id: bandId, title: title.trim(), url: url.trim() } });
      await router.invalidate();
      setTitle("");
      setUrl("");
      setTried(false);
      onClose();
    } catch (e) {
      failed(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add live video">
      <div className="space-y-4">
        <Field label="Title" id="live-video-title" error={tried ? titleProblem : null}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Full set, venue and year"
            aria-labelledby="live-video-title"
            className={inputClass}
          />
        </Field>
        <Field
          label="Link"
          id="live-video-link"
          hint="YouTube or any https link"
          error={tried ? linkProblem : null}
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            placeholder="https://"
            aria-labelledby="live-video-link"
            className={inputClass}
          />
        </Field>
        <Btn
          className="w-full"
          loading={saving}
          pending={Boolean(linkProblem || titleProblem)}
          onClick={() => void save()}
        >
          Add video
        </Btn>
      </div>
    </Sheet>
  );
}

/** The rider as label and value rows, like the first band page had it. */
export function BandRiderCard({ lines }: { lines: string[] }) {
  return (
    <Card>
      <h2 className="text-sm">Technical rider</h2>
      <div className="mt-2 divide-y divide-border">
        {lines.map((line) => {
          const { label, value } = riderLine(line);
          return (
            <div key={line} className="flex justify-between gap-3 py-2.5">
              {label ? (
                <span className="shrink-0 text-1 text-muted-foreground">{label}</span>
              ) : null}
              <span className={`text-1 font-semibold ${label ? "text-right" : ""}`}>{value}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** The stage plot image; tapping it opens it full size. */
export function BandStagePlotCard({
  plot,
  bandName,
}: {
  plot: { url: string; note: string };
  bandName: string;
}) {
  const [open, setOpen] = useState(false);
  const title = `${bandName} stage plot`;
  return (
    <Card>
      <h2 className="text-sm">Stage plot</h2>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View the stage plot full size"
        className="mt-3 block w-full overflow-hidden rounded-lg bg-background"
      >
        <img src={plot.url} alt="" loading="lazy" className="max-h-64 w-full object-contain" />
      </button>
      {plot.note ? <p className="mt-2 text-1 text-muted-foreground">{plot.note}</p> : null}
      <PhotoSheet title={title} photos={open ? [plot.url] : []} onClose={() => setOpen(false)} />
    </Card>
  );
}

/** Edit the rider, one line at a time. */
export function BandRiderSheet({
  bandId,
  lines,
  open,
  onClose,
}: {
  bandId: string;
  lines: string[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const save = useServerFn(saveBandRider);
  const [value, setValue] = useState(lines);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ data: { id: bandId, rider: value } });
      await router.invalidate();
      onClose();
    } catch (e) {
      failed(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Technical rider">
      <div className="space-y-4">
        <p className="text-1 text-muted-foreground">
          Backline, inputs and channels, monitors, power and anything else the venue needs. Write a
          label before a colon to show it beside the value.
        </p>
        <TagListField
          label="Rider lines"
          id="band-rider"
          placeholder="Monitors: 4 wedges"
          value={value}
          onChange={setValue}
        />
        <Btn className="w-full" loading={saving} onClick={() => void onSave()}>
          Save rider
        </Btn>
      </div>
    </Sheet>
  );
}

/** Upload or replace the stage plot image, with an optional note. */
export function BandStagePlotSheet({
  bandId,
  plot,
  open,
  onClose,
}: {
  bandId: string;
  plot: { url: string; note: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const save = useServerFn(saveBandStagePlot);
  const [url, setUrl] = useState(plot?.url ?? "");
  const [note, setNote] = useState(plot?.note ?? "");
  const [saving, setSaving] = useState<"save" | "remove" | null>(null);

  const pick = async (_kind: "cover", file: File) => {
    try {
      setUrl(await uploadProfileImage("cover", file));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "That didn't upload. Try again.");
    }
  };

  const write = async (next: { url: string; note: string }, which: "save" | "remove") => {
    setSaving(which);
    try {
      await save({ data: { id: bandId, url: next.url, note: next.url ? next.note.trim() : "" } });
      await router.invalidate();
      onClose();
    } catch (e) {
      failed(e);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Stage plot">
      <div className="space-y-4">
        <Field
          label="Image"
          id="band-stage-plot"
          hint="A photo or drawing of where everyone stands"
        >
          <div className="relative overflow-hidden rounded-lg bg-background">
            {url ? (
              <img src={url} alt="" className="max-h-64 w-full object-contain" />
            ) : (
              <div aria-hidden className="h-40 w-full" />
            )}
            <ImagePickButton
              kind="cover"
              label={url ? "Replace the stage plot image" : "Upload a stage plot image"}
              className={
                url
                  ? "absolute right-2 top-2 h-10 w-10 bg-card/90 text-foreground"
                  : "absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 border border-border bg-card text-foreground"
              }
              onPick={pick}
            >
              <ImagePlus size={iconSize.md} aria-hidden />
            </ImagePickButton>
          </div>
        </Field>
        <Field label="Note (optional)" id="band-stage-plot-note">
          <textarea
            rows={3}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Drum riser size, where the keys go"
            aria-labelledby="band-stage-plot-note"
            className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Btn
          className="w-full"
          loading={saving === "save"}
          disabled={!url || saving === "remove"}
          onClick={() => void write({ url, note }, "save")}
        >
          Save stage plot
        </Btn>
        {plot ? (
          <Btn
            variant="ghost"
            className="w-full"
            loading={saving === "remove"}
            disabled={saving === "save"}
            onClick={() => void write({ url: "", note: "" }, "remove")}
          >
            Remove stage plot
          </Btn>
        ) : null}
      </div>
    </Sheet>
  );
}
