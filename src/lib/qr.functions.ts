import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Scan history and analytics for the QR module (public.qr_scans, 20260918130000_qr_real.sql).
 * A MusicLinkd QR only ever encodes a profile URL — scanning one means visiting that profile,
 * so recording a scan is just "I opened this username's profile from a code."
 */

// The generated types predate this table.
const scansTable = (client: unknown) =>
  (client as SupabaseClient).from("qr_scans" as never) as unknown as ReturnType<
    SupabaseClient["from"]
  >;

export type ScannedProfile = {
  username: string;
  name: string;
  avatarUrl: string | null;
};

/** Resolve a scanned username to a public profile, and log the scan. No-op for your own code. */
export const recordScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ username: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ context, data }): Promise<ScannedProfile | null> => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, visibility")
      .eq("username", data.username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.visibility === "private") return null;

    if (row.id !== context.userId) {
      const { error: insertError } = await scansTable(context.supabase).insert({
        scanner_id: context.userId,
        scanned_profile_id: row.id,
      } as never);
      if (insertError) throw new Error(insertError.message);
    }

    return {
      username: row.username ?? data.username,
      name: row.display_name ?? row.username ?? "MusicLinkd profile",
      avatarUrl: row.avatar_url,
    };
  });

type ScanRow = { scanned_profile_id: string; created_at: string };

export const getMyScanHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<(ScannedProfile & { scannedAt: string })[]> => {
    const { data: scans, error } = await scansTable(context.supabase)
      .select("scanned_profile_id, created_at")
      .eq("scanner_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const rows = (scans ?? []) as ScanRow[];
    if (!rows.length) return [];

    const ids = [...new Set(rows.map((r) => r.scanned_profile_id))];
    const { data: profiles, error: profileError } = await context.supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", ids);
    if (profileError) throw new Error(profileError.message);
    const byId = new Map(
      ((profiles ?? []) as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]).map(
        (p) => [p.id, p],
      ),
    );

    return rows
      .map((r) => {
        const p = byId.get(r.scanned_profile_id);
        if (!p) return null;
        return {
          username: p.username ?? "",
          name: p.display_name ?? p.username ?? "Unnamed",
          avatarUrl: p.avatar_url,
          scannedAt: r.created_at,
        };
      })
      .filter((x): x is ScannedProfile & { scannedAt: string } => x !== null);
  });

export type QrAnalytics = {
  totalScans: number;
  uniqueScanners: number;
  last7Days: number;
  last30Days: number;
};

/** Aggregate counts only — never who scanned it, matching the module's own privacy line. */
export const getMyQrAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QrAnalytics> => {
    const { data: scans, error } = await scansTable(context.supabase)
      .select("created_at, scanner_id")
      .eq("scanned_profile_id", context.userId);
    if (error) throw new Error(error.message);
    const rows = (scans ?? []) as { created_at: string; scanner_id: string }[];
    const now = Date.now();
    const days = (n: number) => now - n * 24 * 60 * 60 * 1000;
    return {
      totalScans: rows.length,
      uniqueScanners: new Set(rows.map((r) => r.scanner_id)).size,
      last7Days: rows.filter((r) => new Date(r.created_at).getTime() >= days(7)).length,
      last30Days: rows.filter((r) => new Date(r.created_at).getTime() >= days(30)).length,
    };
  });
