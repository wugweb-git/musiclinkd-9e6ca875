import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PUBLIC_ORIGIN } from "@/lib/site";

/*
 * The person's calendar subscription link (queue item 5d, 4 Oct 2026). A new random token each
 * time, stored only as its SHA-256 hash on their owner-only profile_private row (20261004210000):
 * the link is shown once, when made; making a new one replaces it and the old one stops working.
 */

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export type CalendarFeedLinks = {
  /** https://…/cal/<token>.ics — what Outlook takes. */
  https: string;
  /** webcal://… — Apple Calendar's subscribe prompt. */
  webcal: string;
  /** Google Calendar's own add-by-URL screen. */
  google: string;
  /** Outlook on the web's add-from-web screen. */
  outlook: string;
};

/** Makes the person's calendar link (replacing any earlier one) and returns it, once. */
export const createCalendarFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CalendarFeedLinks> => {
    const token = randomToken();
    const { error } = await (context.supabase as unknown as SupabaseClient)
      .from("profile_private")
      .upsert(
        { id: context.userId, calendar_feed_token_hash: await sha256Hex(token) },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    const https = `${PUBLIC_ORIGIN}/cal/${token}.ics`;
    const webcal = https.replace(/^https?:/, "webcal:");
    return {
      https,
      webcal,
      google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
      outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=MusicLinkd`,
    };
  });

/** The signed-in person's confirmed bookings and rentals, for the device calendar sync (5b). */
export const listMyCalendarItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { calendarItemsOf } = await import("@/lib/calendar-feed.server");
    return calendarItemsOf(supabaseAdmin as unknown as SupabaseClient, context.userId);
  });
