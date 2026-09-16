import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Account data only: now-playing and top artists wait until a surface uses them.
const SCOPES = "user-read-private user-read-email";
const STATE_COOKIE = "ml_spotify_state";

export type SpotifySharing = "connections" | "approved";
export type SpotifyStatus =
  | { state: "unavailable" }
  | { state: "disconnected" }
  | { state: "revoked"; displayName: string | null }
  | { state: "connected"; displayName: string | null; sharing: SpotifySharing };

type ConnectionRow = {
  display_name: string | null;
  sharing: SpotifySharing;
  revoked: boolean;
  refresh_token: string;
  expires_at: string;
};

function config() {
  const id = process.env["SPOTIFY_CLIENT_ID"];
  const secret = process.env["SPOTIFY_CLIENT_SECRET"];
  const redirect =
    process.env["SPOTIFY_REDIRECT_URI"] ?? "https://app.musiclinkd.com/settings/spotify";
  return id && secret ? { id, secret, redirect } : null;
}

// The table is not in the generated types until its migration is applied.
const table = () => (supabaseAdmin as unknown as SupabaseClient).from("spotify_connections");

async function tokenRequest(body: Record<string, string>) {
  const cfg = config();
  if (!cfg) throw new Error("unavailable");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${cfg.id}:${cfg.secret}`)}`,
    },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(res.status === 400 ? "revoked" : "spotify_error");
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
}

export const getSpotifyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SpotifyStatus> => {
    if (!config()) return { state: "unavailable" };
    const { data, error } = await table()
      .select("display_name, sharing, revoked, refresh_token, expires_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) return { state: "unavailable" };
    const row = data as ConnectionRow | null;
    if (!row) return { state: "disconnected" };
    if (row.revoked) return { state: "revoked", displayName: row.display_name };
    // A token Spotify no longer honours means the person revoked access there: say reconnect.
    if (new Date(row.expires_at).getTime() < Date.now()) {
      try {
        const t = await tokenRequest({
          grant_type: "refresh_token",
          refresh_token: row.refresh_token,
        });
        await table()
          .update({
            access_token: t.access_token,
            ...(t.refresh_token ? { refresh_token: t.refresh_token } : {}),
            expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
          })
          .eq("user_id", context.userId);
      } catch (e) {
        if (e instanceof Error && e.message === "revoked") {
          await table().update({ revoked: true }).eq("user_id", context.userId);
          return { state: "revoked", displayName: row.display_name };
        }
      }
    }
    return { state: "connected", displayName: row.display_name, sharing: row.sharing };
  });

export const startSpotifyConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ sharing: z.enum(["connections", "approved"]) }).parse(d))
  .handler(async ({ data }) => {
    const cfg = config();
    if (!cfg) throw new Error("unavailable");
    const nonce = crypto.randomUUID();
    setCookie(STATE_COOKIE, `${nonce}.${data.sharing}`, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    const url = new URL("https://accounts.spotify.com/authorize");
    url.search = new URLSearchParams({
      client_id: cfg.id,
      response_type: "code",
      redirect_uri: cfg.redirect,
      scope: SCOPES,
      state: nonce,
    }).toString();
    return { url: url.toString() };
  });

export const finishSpotifyConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(1), state: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    const cfg = config();
    if (!cfg) throw new Error("unavailable");
    const [nonce, sharing] = (getCookie(STATE_COOKIE) ?? "").split(".");
    deleteCookie(STATE_COOKIE, { path: "/" });
    if (!nonce || nonce !== data.state) throw new Error("state_mismatch");

    const t = await tokenRequest({
      grant_type: "authorization_code",
      code: data.code,
      redirect_uri: cfg.redirect,
    });
    const me = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    if (!me.ok) throw new Error("spotify_error");
    const profile = (await me.json()) as { id: string; display_name: string | null };

    const { error } = await table().upsert(
      {
        user_id: context.userId,
        spotify_user_id: profile.id,
        display_name: profile.display_name,
        access_token: t.access_token,
        refresh_token: t.refresh_token ?? "",
        expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
        scopes: t.scope,
        sharing: sharing === "approved" ? "approved" : "connections",
        revoked: false,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectSpotify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await table().delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
