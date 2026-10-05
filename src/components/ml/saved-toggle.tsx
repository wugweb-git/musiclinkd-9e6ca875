import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  listMySavedIds,
  saveTarget,
  unsaveTarget,
  type SavedTargetType,
} from "@/lib/saved.functions";
import { Bookmark } from "lucide-react";

/**
 * The one save (bookmark) control used everywhere a talent, band, studio or business can be
 * shortlisted, wired to the real saved_items table. `SaveButton` below is its look, also used
 * directly where the saved state lives elsewhere (marketplace listings).
 */
export function SavedToggle({
  targetType,
  targetId,
  size,
}: {
  targetType: SavedTargetType;
  targetId: string;
  size?: number;
}) {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(listMySavedIds);
  const save = useServerFn(saveTarget);
  const remove = useServerFn(unsaveTarget);
  const queryKey = ["saved", "ids", targetType];
  const ids = useQuery({
    queryKey,
    queryFn: () => load({ data: { targetType } }),
    enabled: signedIn,
  });
  const saved = signedIn && (ids.data?.includes(targetId) ?? false);

  async function toggle() {
    if (!signedIn) {
      toast("Sign in to save this");
      return;
    }
    const wasSaved = saved;
    queryClient.setQueryData<string[]>(queryKey, (prev) =>
      wasSaved ? (prev ?? []).filter((id) => id !== targetId) : [...(prev ?? []), targetId],
    );
    try {
      if (wasSaved) await remove({ data: { targetType, targetId } });
      else await save({ data: { targetType, targetId } });
      await queryClient.invalidateQueries({ queryKey: ["saved", "mine"] });
    } catch {
      toast.error("Couldn't update saved — try again");
      await queryClient.invalidateQueries({ queryKey });
    }
  }

  return <SaveButton saved={saved} onToggle={() => void toggle()} {...(size ? { size } : {})} />;
}

/** The bookmark button itself (Save is a bookmark, never a heart — owner, 5 Oct): state in, toggle out. `SavedToggle` wires it to saved_items. */
export function SaveButton({
  saved,
  onToggle,
  size = 36,
}: {
  saved: boolean;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      aria-label={saved ? "Remove bookmark" : "Bookmark listing"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="hit-area flex items-center justify-center rounded-full bg-card transition-transform active:scale-97"
      style={{ width: size, height: size }}
    >
      <Bookmark
        size={size * 0.45}
        className={saved ? "text-ink" : "text-foreground"}
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}
