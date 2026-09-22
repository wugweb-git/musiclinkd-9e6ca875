import type { ServiceItem } from "@/data/profile";
import { rupeeParts } from "@/lib/price";

/** A business service as the shared ServiceCard reads it (booking screens, business page). */
export function serviceItem(sv: {
  id: string;
  name: string;
  description?: string | null | undefined;
  price_paise: number | null;
  price_unit: string | null;
  uses?: string[] | undefined;
}): ServiceItem {
  return {
    id: sv.id,
    name: sv.name,
    description: sv.description ?? "",
    ...(sv.price_paise ? { from: rupeeParts(sv.price_paise / 100, sv.price_unit) } : {}),
    ...(sv.uses?.length ? { uses: sv.uses } : {}),
  };
}
