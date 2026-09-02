import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PortfolioKind = "track" | "ep" | "album" | "video" | "credit" | "live";

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(120),
  kind: z.string().min(1).max(24),
  description: z.string().max(1200).optional().nullable(),
  role: z.string().max(120).optional().nullable(),
  collaborators: z.array(z.string().max(80)).max(20).default([]),
  cover_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  media_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  published: z.boolean().default(true),
});

/** Owner view: every item including drafts. */
export const listMyPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", context.userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyPortfolioItem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("portfolio_items")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const savePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => itemSchema.parse(d))
  .handler(async ({ context, data }) => {
    const payload = {
      user_id: context.userId,
      title: data.title,
      kind: data.kind,
      description: data.description || null,
      role: data.role || null,
      collaborators: data.collaborators,
      cover_url: data.cover_url || null,
      media_url: data.media_url || null,
      release_year: data.release_year ?? null,
      published: data.published,
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("portfolio_items")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    const { data: row, error } = await context.supabase
      .from("portfolio_items")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("portfolio_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Onboarding + profile edit persistence. */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        username: z.string().min(3).max(30).optional().nullable(),
        display_name: z.string().max(80).optional().nullable(),
        headline: z.string().max(160).optional().nullable(),
        bio: z.string().max(1200).optional().nullable(),
        city: z.string().max(80).optional().nullable(),
        roles: z.array(z.string().max(40)).max(12).optional(),
        availability: z.string().max(40).optional().nullable(),
        onboarding_complete: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data }, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
