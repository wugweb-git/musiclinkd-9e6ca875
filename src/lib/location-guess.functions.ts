import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";

/*
 * A rough location from the connection, with no permission prompt: the hosting edge (Cloudflare)
 * knows the visitor's city and region. It is a guess the person confirms, often wrong on mobile
 * data or a VPN, and never stored by this function. Local dev has no edge, so it returns nulls.
 */
export type LocationGuess = { city: string | null; region: string | null; country: string | null };

export const getLocationGuess = createServerFn({ method: "GET" }).handler(
  async (): Promise<LocationGuess> => {
    const cf = (getRequest() as Request & { cf?: Record<string, unknown> }).cf ?? {};
    const pick = (header: string, key: string) => {
      const value = getRequestHeader(header) ?? cf[key];
      return typeof value === "string" && value ? decodeURIComponent(value) : null;
    };
    return {
      city: pick("cf-ipcity", "city"),
      region: pick("cf-region", "region"),
      country: pick("cf-ipcountry", "country"),
    };
  },
);
