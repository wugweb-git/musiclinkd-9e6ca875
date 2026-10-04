import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, ChevronRight, Link2, LoaderCircle, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { Btn, Sheet } from "@/components/ml/ui";
import { ContributorPicker } from "@/components/ml/portfolio";
import { ChipPicker, InlineField, useScrollEdges } from "@/components/ml/onboarding";
import { creditRoles, genres, workType, type PortfolioItem } from "@/data/portfolio";
import { haptic } from "@/lib/haptics";
import { getLinkPreview, type LinkPreview } from "@/lib/link-preview.functions";
import { savePortfolioItem } from "@/lib/portfolio.functions";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";
import { imageWidth, sized } from "@/lib/image-url";
import { uploadGalleryPhoto } from "@/lib/gallery";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-images";

/*
 * Add or edit a piece of work, link first. Pasting a YouTube, Spotify, SoundCloud or any page link
 * reads its title and cover on the server (getLinkPreview) and fills them in. The title is typed
 * straight onto the page. Everything else is one list of rows, each opening a bottom sheet, and a
 * Public switch. Save draft and Publish sit in the bottom bar.
 */

const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((p) => p !== v) : [...list, v];

const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(v.trim());

type Panel = "role" | "genre" | "year" | "contributors" | "description" | null;

function EditRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="state-layer flex min-h-control-lg w-full items-center gap-3 px-4 text-left"
    >
      <span className="shrink-0 text-sm font-medium">{label}</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-right text-sm",
          value ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {value ?? "Add"}
      </span>
      <ChevronRight size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

export function WorkForm({
  kind,
  initial,
  signedIn,
  fromOnboarding = false,
}: {
  kind: string;
  initial?: PortfolioItem;
  signedIn: boolean;
  /** The new user's first work: publish only (no draft), then on to Review profile. */
  fromOnboarding?: boolean;
}) {
  const navigate = useNavigate();
  const save = useServerFn(savePortfolioItem);
  const readLink = useServerFn(getLinkPreview);
  const t = workType(kind);
  const edges = useScrollEdges();

  const [link, setLink] = useState(initial?.media_url ?? "");
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [reading, setReading] = useState(false);
  const [cover, setCover] = useState(initial?.cover_url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const autoTitle = useRef<string | null>(null);
  const [description, setDescription] = useState(initial?.description ?? "");
  // `role` holds the credit roles and then the genres, one list (portfolio_items has no genre
  // column). Read back, a genre goes to Genre and the rest to Your role, so editing never moves
  // genres into the role.
  const stored = initial?.role ? initial.role.split(", ").filter(Boolean) : [];
  const genreNames = new Set<string>(genres);
  const [roles, setRoles] = useState<string[]>(stored.filter((r) => !genreNames.has(r)));
  const [genre, setGenre] = useState<string[]>(stored.filter((r) => genreNames.has(r)));
  const [year, setYear] = useState(initial?.release_year ? String(initial.release_year) : "");
  const [collabList, setCollabList] = useState<string[]>(initial?.collaborators ?? []);
  const [isPublic, setIsPublic] = useState(initial ? initial.published : true);
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<"draft" | "publish" | null>(null);
  const [tried, setTried] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function pickPhoto(file?: File) {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      setCover(await uploadGalleryPhoto(file));
      haptic("confirm");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the photo. Try again.");
    } finally {
      setUploadingPhoto(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  // Read the link once typing settles: fill the cover, and the title unless the person wrote one.
  useEffect(() => {
    const url = link.trim();
    if (!signedIn || !isUrl(url) || url === (preview?.url ?? initial?.media_url)) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setReading(true);
      readLink({ data: { url } })
        .then((p) => {
          if (!active) return;
          setPreview(p);
          if (p.image) setCover(p.image);
          if (p.title && (!title.trim() || title === autoTitle.current)) {
            autoTitle.current = p.title;
            setTitle(p.title);
          }
          if (p.title || p.image) haptic("select");
        })
        .catch(() => active && setPreview(null))
        .finally(() => active && setReading(false));
    }, 500);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // Reading depends on the link only; title is read at the moment the preview lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link, signedIn]);

  const linkError =
    link.trim() && !isUrl(link) ? "Paste a full link, starting with https://" : undefined;
  const titleError = tried && !title.trim() ? "Give this work a title." : undefined;
  const yearError =
    year && !/^\d{4}$/.test(year.trim()) ? "Use a four-digit year, like 2024." : undefined;
  const source = preview?.source
    ? [preview.source, preview.author].filter(Boolean).join(" · ")
    : null;

  async function submit(publish: boolean) {
    setTried(true);
    if (!title.trim() || linkError || yearError) {
      haptic("error");
      if (!title.trim()) document.getElementById("work-title")?.focus();
      else if (yearError) setPanel("year");
      return;
    }
    if (!signedIn) {
      void navigate({ to: "/welcome" });
      return;
    }
    setBusy(publish ? "publish" : "draft");
    try {
      const parsedYear = year ? Number(year) : null;
      const row = (await save({
        data: {
          ...(initial?.id ? { id: initial.id } : {}),
          title: title.trim(),
          kind,
          description: description.trim() || null,
          role: [...roles, ...genre].join(", ") || null,
          collaborators: collabList,
          cover_url: cover || null,
          media_url: link.trim() || null,
          release_year: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : null,
          published: publish && isPublic,
        },
      })) as PortfolioItem;
      haptic("confirm");
      toast.success(publish && isPublic ? "Work published" : "Draft saved");
      void navigate({
        to: "/portfolio/$id",
        params: { id: row.id },
        search: fromOnboarding ? { from: "onboarding" } : {},
      });
    } catch (err) {
      haptic("error");
      toast.error(err instanceof Error ? err.message : "Could not save this work");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit(true);
      }}
    >
      <InlineField
        label={t.media === "none" ? "Link (optional)" : "Link"}
        inputId="work-link"
        leading={
          reading ? (
            <LoaderCircle size={iconSize.md} className="animate-spin text-muted-foreground" />
          ) : (
            <Link2 size={iconSize.md} />
          )
        }
        value={link}
        onChange={setLink}
        inputMode="url"
        autoComplete="url"
        placeholder="Paste a YouTube, Spotify or SoundCloud link"
        hint={
          reading
            ? "Reading the link…"
            : preview && !preview.title && !preview.image
              ? "Couldn't read this link. Add the title yourself."
              : "We'll fill in the title and cover from the link."
        }
        {...(linkError ? { error: linkError } : {})}
      />

      {/* The cover from the link, at the size people will see it. */}
      {cover ? (
        <figure className="mt-5 animate-message">
          <img
            src={sized(cover, { width: imageWidth.wide })}
            alt=""
            className={cn(
              "w-full rounded-lg bg-subtle object-cover",
              t.media === "video" ? "aspect-video" : "aspect-square",
            )}
          />
          {source ? (
            <figcaption className="mt-2 text-1 text-muted-foreground">{source}</figcaption>
          ) : null}
        </figure>
      ) : null}
      <input ref={photoInput} type="file" accept={PROFILE_IMAGE_ACCEPT} capture="environment" className="sr-only" aria-label="Choose a photo for this work" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
      <Btn type="button" variant="outline" className="mt-4 w-full" loading={uploadingPhoto} disabled={!signedIn} icon={<Camera size={iconSize.sm} aria-hidden />} onClick={() => photoInput.current?.click()}>
        {cover ? "Change work photo" : "Add work photo"}
      </Btn>

      {/* The title is written on the page, not in a box. */}
      <label htmlFor="work-title" className="sr-only">
        Title
      </label>
      <textarea
        id="work-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value.replace(/\n/g, ""));
          autoTitle.current = null;
        }}
        maxLength={120}
        rows={1}
        placeholder={`${t.label} title`}
        aria-invalid={Boolean(titleError) || undefined}
        className="mt-6 field-sizing-content w-full resize-none rounded-sm bg-transparent text-3 font-bold leading-tight outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring"
      />
      {titleError ? (
        <p role="alert" className="mt-1 animate-message text-1 text-destructive">
          {titleError}
        </p>
      ) : null}

      {/* Everything else: one list of rows. */}
      <div className="mt-6 divide-y divide-border overflow-hidden rounded-lg bg-subtle">
        <EditRow
          label="Your role"
          value={roles.length ? roles.join(", ") : null}
          onClick={() => setPanel("role")}
        />
        <EditRow
          label="Genre"
          value={genre.length ? genre.join(", ") : null}
          onClick={() => setPanel("genre")}
        />
        <EditRow label="Year" value={year || null} onClick={() => setPanel("year")} />
        <EditRow
          label="Contributors"
          value={collabList.length ? collabList.join(", ") : null}
          onClick={() => setPanel("contributors")}
        />
        <EditRow
          label="Description"
          value={description.trim() || null}
          onClick={() => setPanel("description")}
        />
        <label htmlFor="work-public" className="flex min-h-control-lg items-center gap-3 px-4">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Public</span>
            <span className="block text-1 text-muted-foreground">
              {isPublic ? "Shows on your profile" : "Only you can see it"}
            </span>
          </span>
          <Switch
            id="work-public"
            className="hit-area"
            checked={isPublic}
            onCheckedChange={(on) => {
              haptic("select");
              setIsPublic(on);
            }}
          />
        </label>
      </div>

      <RowSheet open={panel === "role"} title="Your role" onDone={() => setPanel(null)}>
        <ChipPicker
          options={creditRoles}
          selected={roles}
          onToggle={(v) => setRoles((prev) => toggle(prev, v))}
        />
      </RowSheet>
      <RowSheet open={panel === "genre"} title="Genre" onDone={() => setPanel(null)}>
        <ChipPicker
          options={genres}
          selected={genre}
          onToggle={(v) => setGenre((prev) => toggle(prev, v))}
        />
      </RowSheet>
      <RowSheet open={panel === "year"} title="Year" onDone={() => setPanel(null)}>
        <InlineField
          label="Year"
          inputId="work-year"
          value={year}
          onChange={(v) => setYear(v.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          enterKeyHint="done"
          placeholder="2025"
          {...(yearError ? { error: yearError } : {})}
        />
      </RowSheet>
      <RowSheet open={panel === "contributors"} title="Contributors" onDone={() => setPanel(null)}>
        <ContributorPicker value={collabList} onChange={setCollabList} />
      </RowSheet>
      <RowSheet open={panel === "description"} title="Description" onDone={() => setPanel(null)}>
        <InlineField
          label="What did you do on it?"
          inputId="work-description"
          value={description}
          onChange={setDescription}
          multiline
          maxLength={600}
          placeholder="Your part, and what came of it"
        />
      </RowSheet>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-bar mx-auto flex w-full max-w-app gap-2 border-t bg-background/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-colors duration-200 ease-standard",
          edges.bottom ? "border-border" : "border-transparent",
        )}
      >
        {fromOnboarding ? null : (
          <Btn
            variant="outline"
            className="flex-1"
            loading={busy === "draft"}
            disabled={busy === "publish"}
            icon={<Save size={iconSize.sm} aria-hidden />}
            onClick={() => void submit(false)}
          >
            Save draft
          </Btn>
        )}
        <Btn
          type="submit"
          className="flex-[1.4]"
          loading={busy === "publish"}
          disabled={busy === "draft"}
          icon={<Send size={iconSize.sm} aria-hidden />}
          pending={!title.trim()}
        >
          {initial ? "Save changes" : "Publish"}
        </Btn>
      </div>
    </form>
  );
}

function RowSheet({
  open,
  title,
  onDone,
  children,
}: {
  open: boolean;
  title: string;
  onDone: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onClose={onDone} title={title}>
      {children}
      <Btn className="mt-6 w-full" onClick={onDone}>
        Done
      </Btn>
    </Sheet>
  );
}
