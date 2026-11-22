import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBookableEquipment } from "@/lib/bookable-owner.functions";
import { listMyBookablePhotos } from "@/lib/bookable-photos.functions";

export const PHOTOS_KEY = ["studio-photos", "mine"] as const;
export const EQUIPMENT_KEY = ["studio-equipment", "mine"] as const;

/** The business's amenities and photos. Off for accounts that aren't a business. */
export function useMyBookablePhotos(enabled = true) {
  const load = useServerFn(listMyBookablePhotos);
  return useQuery({ queryKey: PHOTOS_KEY, queryFn: () => load(), enabled, retry: false });
}

/** The business's equipment list. Off for accounts that aren't a business. */
export function useMyBookableEquipment(enabled = true) {
  const load = useServerFn(getMyBookableEquipment);
  return useQuery({ queryKey: EQUIPMENT_KEY, queryFn: () => load(), enabled, retry: false });
}
