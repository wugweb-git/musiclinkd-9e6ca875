import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { PIN_CODE, cityFromDistrict } from "@/lib/place";
import { placeFromPin } from "@/lib/postcode.functions";

/**
 * Where a PIN code is, as a city and state the app can store.
 *
 * Three screens ask somebody where they are — onboarding, Create business page and Edit profile —
 * and all three used to lean on a picker of 79 cities. Anyone in Thane, Dombivli or Central Delhi
 * had nothing to choose, so the field was left empty or filled with something that matched nothing.
 * Six digits they already know answer it instead.
 *
 * Callers fill only what is still blank: a city somebody typed is their answer, not ours to
 * overwrite. Every failure — a short PIN, a mistyped one, a slow directory — returns null, and they
 * carry on picking a city by hand.
 */
export function usePinFill() {
  const lookUp = useServerFn(placeFromPin);
  return useCallback(
    async (pin: string): Promise<{ city: string; state: string } | null> => {
      if (!PIN_CODE.test(pin)) return null;
      const place = await lookUp({ data: { pin } }).catch(() => null);
      if (!place) return null;
      const city = cityFromDistrict(place.district);
      return city ? { city, state: place.state } : null;
    },
    [lookUp],
  );
}
