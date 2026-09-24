import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/*
 * Where a PIN code is, from India Post's public directory (api.postalpincode.in — free, no key).
 *
 * This exists because the city list cannot be complete. Somebody in Thane, Dombivli or Central
 * Delhi types a city the app has no way to offer them, so the field is either left empty or filled
 * with something that then matches nothing. A PIN code is six digits the person already knows, and
 * it resolves to a real district and state without anyone curating a list.
 *
 * Server-side, so the browser never talks to a third party and the call carries no cookies or
 * identity — only six digits go out, and they are not stored here.
 *
 * Failure is ordinary, not exceptional: the directory is occasionally slow and PIN codes get
 * mistyped. Every failure returns null and the person simply types their city, which is what they
 * would have done anyway.
 */

export type PinPlace = {
  /** The district, as India Post names it: "Mumbai", "Bangalore", "Central Delhi". */
  district: string;
  state: string;
};

export const placeFromPin = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ pin: z.string().regex(/^[1-9]\d{5}$/) }).parse(d))
  .handler(async ({ data }): Promise<PinPlace | null> => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${data.pin}`, {
        signal: AbortSignal.timeout(8000),
        headers: { accept: "application/json" },
      });
      if (!res.ok) return null;

      const body = (await res.json()) as
        [{ Status?: string; PostOffice?: { District?: string; State?: string }[] | null }] | null;
      const entry = body?.[0];
      // "No records found" for a PIN that does not exist is a Status, not an HTTP error.
      if (!entry || entry.Status !== "Success") return null;

      // Every post office under one PIN shares a district, so the first is as good as any.
      const office = entry.PostOffice?.[0];
      const district = office?.District?.trim();
      const state = office?.State?.trim();
      if (!district || !state) return null;

      return { district, state };
    } catch {
      // Timeout, DNS, malformed JSON — all the same answer: we do not know.
      return null;
    }
  });
