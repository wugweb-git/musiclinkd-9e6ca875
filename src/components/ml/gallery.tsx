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
import {
  MAX_GALLERY_PHOTOS,
  addMyGalleryPhoto,
  listMyGallery,
  removeMyGalleryPhoto,
  reorderMyGallery,
  type GalleryPhoto,
} from "@/lib/gallery.functions";
import { uploadGalleryPhoto } from "@/lib/gallery";
import { iconSize } from "@/lib/tokens";

/*
 * Galleries (profile_gallery) on a person's profile and a business page. Visitors see GalleryView:
 * the grid, each photo opening them all full size in PhotoSheet. The signed-in owner sees
 * GalleryEditor instead: add several photos in one pick, remove one, and drag (or, from the
 * keyboard, space and the arrow keys) to reorder; the first photo leads. Uploads go through
 * src/lib/gallery.ts and the rows through src/lib/gallery.functions.ts.
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

const GALLERY_KEY = ["gallery", "mine"];

/**
 * The signed-in owner's gallery, editable. `onChange` runs after every saved change, so the page
 * around it can refresh what it shows elsewhere.
 */
export function GalleryEditor({ title, onChange }: { title: string; onChange?: () => void }) {
  const queryClient = useQueryClient();
  const load = useServerFn(listMyGallery);
  const add = useServerFn(addMyGalleryPhoto);
  const remove = useServerFn(removeMyGalleryPhoto);
  const reorder = useServerFn(reorderMyGallery);
  const q = useQuery({ queryKey: GALLERY_KEY, queryFn: () => load() });
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
    await queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
    onChange?.();
  };

  async function onPick(_kind: "gallery", file: File) {
    const current = queryClient.getQueryData<{ photos: GalleryPhoto[] }>(GALLERY_KEY);
    if ((current?.photos.length ?? 0) >= MAX_GALLERY_PHOTOS) {
      toast.error(`Up to ${MAX_GALLERY_PHOTOS} photos in a gallery.`, { id: "gallery-add" });
      return;
    }
    try {
      const url = await uploadGalleryPhoto(file);
      await add({ data: { url } });
      await refresh();
      toast.success("Photo added", { id: "gallery-add" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that photo");
    }
  }

  async function onRemove(id: string) {
    const before = photos;
    setPhotos((list) => list.filter((p) => p.id !== id));
    try {
      await remove({ data: { id } });
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
      await reorder({ data: { ids: next.map((p) => p.id) } });
      await refresh();
    } catch {
      setPhotos(before);
      toast.error("That didn't save. Try again.");
    }
  }

  if (q.isLoading || q.isError || !q.data) return null;
  // Before the gallery bucket exists nothing can be uploaded; what's there can still be managed.
  const canAdd = q.data.ready && photos.length < MAX_GALLERY_PHOTOS;
  if (!photos.length && !canAdd) return null;

  return (
    <>
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
                onRemove={() => void onRemove(p.id)}
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
          src={photo.image_url}
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
        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground"
      >
        <X size={iconSize.xs} aria-hidden />
      </button>
    </div>
  );
}
