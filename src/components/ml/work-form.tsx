import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Btn } from "@/components/ml/ui";
import { Field, TextInput, StickyBar } from "@/components/ml/collab";
import { ContributorPicker, MediaUploader, SelectableChips } from "@/components/ml/portfolio";
import {
  creditRoles,
  genres,
  visibilityOptions,
  workType,
  type PortfolioItem,
} from "@/data/portfolio";
import { savePortfolioItem } from "@/lib/portfolio.functions";

export function WorkForm({
  kind,
  initial,
  signedIn,
}: {
  kind: string;
  initial?: PortfolioItem;
  signedIn: boolean;
}) {
  const navigate = useNavigate();
  const save = useServerFn(savePortfolioItem);
  const t = workType(kind);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [roles, setRoles] = useState<string[]>(
    initial?.role ? initial.role.split(", ").filter(Boolean) : [],
  );
  const [genre, setGenre] = useState<string[]>([]);
  const [year, setYear] = useState(initial?.release_year ? String(initial.release_year) : "");
  const [collabList, setCollabList] = useState<string[]>(initial?.collaborators ?? []);
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [visibility, setVisibility] = useState<string>(
    initial ? (initial.published ? "public" : "private") : "public",
  );
  const [busy, setBusy] = useState(false);

  async function submit(publish: boolean) {
    if (!title.trim()) {
      toast.error("Give this work a title");
      return;
    }
    if (!signedIn) {
      toast.error("Sign in to save work to your portfolio");
      navigate({ to: "/auth", search: { mode: "signin" } });
      return;
    }
    setBusy(true);
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
          cover_url: coverUrl.trim() || null,
          media_url: mediaUrl.trim() || null,
          release_year: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : null,
          published: publish && visibility !== "private",
        },
      })) as PortfolioItem;
      toast.success(publish ? "Work published" : "Draft saved");
      navigate({ to: "/portfolio/$id", params: { id: row.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this work");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="text-2xl" aria-hidden>
          {t.emoji}
        </p>
        <h2 className="mt-1 text-[17px]">{t.label}</h2>
        <p className="text-xs text-muted-foreground">{t.blurb}</p>
      </div>

      <div className="mt-6">
        <Field label="Title">
          <TextInput value={title} onChange={setTitle} placeholder="What is this work called?" />
        </Field>

        <Field label="Your role" hint="Pick every credit that applies">
          <SelectableChips
            options={creditRoles}
            value={roles}
            onToggle={(v) =>
              setRoles((prev) => (prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v]))
            }
          />
        </Field>

        <Field label="Description" optional hint="Overview, your contribution, outcome">
          <TextInput
            value={description}
            onChange={setDescription}
            multiline
            placeholder="What did you do, and what changed because of it?"
          />
        </Field>

        <Field label="Genre" optional>
          <SelectableChips
            options={genres}
            value={genre}
            onToggle={(v) =>
              setGenre((prev) => (prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v]))
            }
          />
        </Field>

        <Field label="Year" optional>
          <TextInput value={year} onChange={setYear} placeholder="2025" />
        </Field>

        <Field
          label="Contributors"
          optional
          hint="Search MusicLinkd first — invite by name if they're not here yet"
        >
          <ContributorPicker value={collabList} onChange={setCollabList} />
        </Field>

        {t.media !== "none" ? (
          <Field label="Media" optional hint="Link a file, YouTube, Spotify or SoundCloud">
            <MediaUploader type={t.media} url={mediaUrl} onUrl={setMediaUrl} />
          </Field>
        ) : null}

        <Field label="Cover image URL" optional>
          <TextInput value={coverUrl} onChange={setCoverUrl} placeholder="https://" />
        </Field>

        <Field label="Visibility">
          <div className="space-y-2">
            {visibilityOptions.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setVisibility(v.value)}
                aria-pressed={visibility === v.value}
                className={`w-full rounded-2xl border p-4 text-left ${
                  visibility === v.value ? "border-primary bg-card" : "border-border bg-card"
                }`}
              >
                <span className="block text-sm font-semibold">{v.label}</span>
                <span className="block text-xs text-muted-foreground">{v.blurb}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>

      <StickyBar>
        <div className="flex gap-2">
          <Btn variant="outline" className="flex-1" onClick={() => submit(false)}>
            Save draft
          </Btn>
          <Btn className="flex-[1.4]" onClick={() => submit(true)}>
            {busy ? "Saving…" : initial ? "Save changes" : "Publish work"}
          </Btn>
        </div>
      </StickyBar>
    </>
  );
}
