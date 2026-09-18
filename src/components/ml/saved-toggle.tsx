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
import { SaveButton } from "./market";

/**
 * The one save/heart control used everywhere a talent, band, studio or business can be
 * shortlisted — same look as the marketplace's SaveButton, wired to the real saved_items table.
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
