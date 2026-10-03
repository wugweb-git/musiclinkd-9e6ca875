import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { GalleryGrid, ImagePickButton } from "./profile";
import { PhotoSheet } from "./booking";
import { LoadError, Loading } from "./kit";
import { Btn, useConfirm } from "./ui";
import {
  MAX_GALLERY_PHOTOS,
  addMyGalleryPhoto,
  listMyGallery,
  removeMyGalleryPhoto,
  reorderMyGallery,
  type GalleryPhoto,
  type MyGallery,
} from "@/lib/gallery.functions";
import { uploadGalleryPhoto } from "@/lib/gallery";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

/*
 * Galleries (profile_gallery) on a person's profile and a business page. Visitors see GalleryView:
 * the grid, each photo opening them all full size in PhotoSheet. The signed-in owner sees
 * GalleryEditor instead: add several photos in one pick, remove one, and drag (or, from the
 * keyboard, space and the arrow keys) to reorder; the first photo leads. Uploads go through
 * src/lib/gallery.ts. The rows come from a GallerySource: by default the signed-in account's own
 * gallery (src/lib/gallery.functions.ts); a band's showcase passes its own (band-sections.tsx).
 */

/** A gallery for anyone looking at it: tap a photo to see them full size. */
export function GalleryView({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <GalleryGrid images={images} onOpen={() => setOpen(true)} />
      <PhotoSheet title={title} photos={open ? images : []} onClose={() => setOpen(false)} />
    </>
  );
}

/** Where an editable gallery's photos are read from and saved to. */
export type GallerySource = {
  /** The react-query key its photos are cached under. */
  queryKey: readonly unknown[];
  list: () => Promise<MyGallery>;
  add: (url: string) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  reorder: (ids: string[]) => Promise<unknown>;
};

/** The signed-in account's own gallery (profile_gallery). */
function useMyGallerySource(): GallerySource {
  const load = useServerFn(listMyGallery);
  const add = useServerFn(addMyGalleryPhoto);
  const remove = useServerFn(removeMyGalleryPhoto);
  const reorder = useServerFn(reorderMyGallery);
  return {
    queryKey: ["gallery", "mine"],
    list: () => load(),
    add: (url) => add({ data: { url } }),
    remove: (id) => remove({ data: { id } }),
    reorder: (ids) => reorder({ data: { ids } }),
  };
}

type GalleryEditorProps = {
  title: string;
  onChange?: (() => void) | undefined;
  /** Where the photos live; the signed-in account's own gallery when left out. */
  source?: GallerySource | undefined;
};

/**
 * An editable gallery: the signed-in owner's own, or the one `source` names. `onChange` runs after
 * every saved change, so the page around it can refresh what it shows elsewhere.
 */
export function GalleryEditor({ source, ...rest }: GalleryEditorProps) {
  return source ? <EditableGallery source={source} {...rest} /> : <MyGalleryEditor {...rest} />;
}

function MyGalleryEditor(props: Omit<GalleryEditorProps, "source">) {
  const source = useMyGallerySource();
  return <EditableGallery source={source} {...props} />;
}

function EditableGallery({
  title,
  onChange,
  source,
}: Omit<GalleryEditorProps, "source"> & { source: GallerySource }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const queryKey = source.queryKey;
  const q = useQuery({ queryKey, queryFn: () => source.list() });
  const [viewing, setViewing] = useState(false);
  // The pointer lifting at the end of a drag can land as a click; that one doesn't open the photos.
  const dragged = useRef(false);

  // The order on screen: moves show straight away and roll back if the save fails.
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  useEffect(() => {
    if (q.data) setPhotos(q.data.photos);
  }, [q.data]);

  // A short hold starts a drag, so a tap still opens the photo and a swipe still scrolls.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
    onChange?.();
  };

  async function onPick(_kind: "gallery", file: File) {
    const current = queryClient.getQueryData<{ photos: GalleryPhoto[] }>(queryKey);
    if ((current?.photos.length ?? 0) >= MAX_GALLERY_PHOTOS) {
      toast.error(`Up to ${MAX_GALLERY_PHOTOS} photos in a gallery.`, { id: "gallery-add" });
      return;
    }
    try {
      const url = await uploadGalleryPhoto(file);
      await source.add(url);
      await refresh();
      toast.success("Photo added", { id: "gallery-add" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that photo", {
        action: { label: "Try again", onClick: () => void onPick(_kind, file) },
      });
    }
  }

  async function onRemove(id: string) {
    const before = photos;
    setPhotos((list) => list.filter((p) => p.id !== id));
    try {
      await source.remove(id);
      await refresh();
      toast.success("Photo removed");
    } catch {
      setPhotos(before);
      toast.error("Couldn't remove that photo");
    }
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setTimeout(() => (dragged.current = false), 0);
    if (!over || active.id === over.id) return;
    const before = photos;
    const from = photos.findIndex((p) => p.id === active.id);
    const to = photos.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(photos, from, to);
    setPhotos(next);
    try {
      await source.reorder(next.map((p) => p.id));
      await refresh();
    } catch {
      setPhotos(before);
      toast.error("That didn't save. Try again.");
    }
  }

  // Loading and a failed read show as such, not as an empty space (brief §2, 29 Sep).
  if (q.isLoading) return <Loading rows={1} />;
  if (q.isError || !q.data)
    return (
      <LoadError
        what="the photos"
        action={
          <Btn variant="outline" onClick={() => void q.refetch()}>
            Try again
          </Btn>
        }
      />
    );
  // Before the gallery bucket exists nothing can be uploaded; what's there can still be managed.
  const canAdd = q.data.ready && photos.length < MAX_GALLERY_PHOTOS;
  if (!photos.length && !canAdd) return null;

  return (
    <>
      {confirm.dialog}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => (dragged.current = true)}
        onDragCancel={() => (dragged.current = false)}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <SortablePhoto
                key={p.id}
                photo={p}
                index={i}
                total={photos.length}
                onView={() => {
                  if (!dragged.current) setViewing(true);
                }}
                onRemove={() =>
                  confirm.ask({ title: "Remove this photo?", confirmLabel: "Remove" }, () =>
                    onRemove(p.id),
                  )
                }
              />
            ))}
            {canAdd ? (
              <ImagePickButton
                kind="gallery"
                label="Add photos"
                multiple
                className="h-24 w-full rounded-lg border border-dashed border-border text-muted-foreground"
                onPick={onPick}
              >
                <ImagePlus size={iconSize.sm} aria-hidden />
              </ImagePickButton>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>
      <PhotoSheet
        title={title}
        photos={viewing ? photos.map((p) => p.image_url) : []}
        onClose={() => setViewing(false)}
      />
    </>
  );
}

function SortablePhoto({
  photo,
  index,
  total,
  onView,
  onRemove,
}: {
  photo: GalleryPhoto;
  index: number;
  total: number;
  onView: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative touch-manipulation ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      {/* A tap opens the photos; a hold (or space, then the arrow keys) moves this one. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onView}
        aria-label={`Photo ${index + 1} of ${total}. Tap to view, hold to move.`}
        className="block h-24 w-full cursor-grab overflow-hidden rounded-lg bg-subtle"
      >
        <img
          src={sized(photo.image_url, { width: 412 })}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove photo ${index + 1}`}
        title="Remove photo"
        className="hit-area absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground"
      >
        <X size={iconSize.xs} aria-hidden />
      </button>
    </div>
  );
}
