import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Marketplace offers: a buyer proposes a price on a listing, the seller accepts or declines.
 * No money moves through MusicLinkd — the two of them settle it directly, same boundary as
 * booking_requests and rental_bookings. Schema: supabase/migrations/20260918170000_marketplace_offers.sql.
 */

const db = (client: unknown) => client as unknown as SupabaseClient;

export type OfferStatus = "pending" | "accepted" | "declined" | "withdrawn";

export type OfferRow = {
  id: string;
  amount_paise: number;
  message: string | null;
  status: OfferStatus;
  created_at: string;
  listing: { id: string; slug: string; title: string; image_url: string | null } | null;
  buyer: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

const SELECT = `id, amount_paise, message, status, created_at,
  listing:marketplace_listings(id, slug, title, image_url),
  buyer:profiles!marketplace_offers_buyer_profile_id_fkey(id, username, display_name, avatar_url)`;

/** Make an offer on someone else's listing. */
export const makeOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        listingId: z.string().uuid(),
        amountPaise: z.number().int().positive(),
        message: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const { data: row, error } = await db(context.supabase)
      .from("marketplace_offers")
      .insert({
        listing_id: data.listingId,
        buyer_profile_id: context.userId,
        amount_paise: data.amountPaise,
        message: data.message ?? null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string };
  });

/** Offers this account has made, newest first. */
export const listMyOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OfferRow[]> => {
    const { data, error } = await db(context.supabase)
      .from("marketplace_offers")
      .select(SELECT)
      .eq("buyer_profile_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OfferRow[];
  });

/** Offers made on listings this account sells, newest first. */
export const listOffersOnMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OfferRow[]> => {
    const client = db(context.supabase);
    const { data: mine, error: listingError } = await client
      .from("marketplace_listings")
      .select("id")
      .eq("seller_profile_id", context.userId);
    if (listingError) throw new Error(listingError.message);
    const ids = ((mine ?? []) as { id: string }[]).map((l) => l.id);
    if (!ids.length) return [];
    const { data, error } = await client
      .from("marketplace_offers")
      .select(SELECT)
      .in("listing_id", ids)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OfferRow[];
  });

/** The seller accepts or declines an offer on their own listing. */
export const answerOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["accepted", "declined"]) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ status: OfferStatus }> => {
    const { error } = await db(context.supabase)
      .from("marketplace_offers")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { status: data.status };
  });

/** The buyer pulls their own offer back. */
export const withdrawOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ status: "withdrawn" }> => {
    const { error } = await db(context.supabase)
      .from("marketplace_offers")
      .update({ status: "withdrawn" } as never)
      .eq("id", data.id)
      .eq("buyer_profile_id", context.userId);
    if (error) throw new Error(error.message);
    return { status: "withdrawn" };
  });
