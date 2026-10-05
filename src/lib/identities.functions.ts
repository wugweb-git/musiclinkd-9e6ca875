import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Sign-in methods: what this account can sign in with, and removing one. Server-side like every
 * other data access (AGENTS.md); the settings row used to call Supabase Auth from the browser.
 * Supabase refuses to unlink an account's last identity, and so does this, before asking it.
 */

export type SignInMethod = {
  id: string;
  provider: string;
  email: string | null;
  /** When the method was linked; the oldest is the one the account was made with. */
  createdAt: string | null;
};

/** The caller's own access token, which requireSupabaseAuth has already checked. */
function callerToken() {
  return (getRequest()?.headers.get("authorization") ?? "").replace("Bearer ", "");
}

async function methodsOf(
  client: { auth: { getUser: (jwt: string) => Promise<unknown> } },
  token: string,
): Promise<SignInMethod[]> {
  const { data, error } = (await client.auth.getUser(token)) as {
    data: {
      user: {
        identities?: {
          identity_id: string;
          provider: string;
          identity_data?: Record<string, unknown>;
          created_at?: string;
        }[];
      } | null;
    };
    error: { message: string } | null;
  };
  if (error || !data.user) throw new Error(error?.message ?? "No account");
  return (data.user.identities ?? []).map((i) => ({
    id: i.identity_id,
    provider: i.provider,
    email: typeof i.identity_data?.["email"] === "string" ? i.identity_data["email"] : null,
    createdAt: i.created_at ?? null,
  }));
}

export const listMySignInMethods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => methodsOf(context.supabase, callerToken()));

export const removeMySignInMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const token = callerToken();
    const methods = await methodsOf(context.supabase, token);
    if (!methods.some((m) => m.id === data.id)) throw new Error("That isn't one of your methods.");
    if (methods.length < 2) throw new Error("Your only way to sign in can't be removed.");
    // Supabase Auth's own endpoint, as the caller: it checks the identity is theirs again.
    const res = await fetch(
      `${process.env["SUPABASE_URL"]}/auth/v1/user/identities/${encodeURIComponent(data.id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "",
        },
      },
    );
    if (!res.ok) throw new Error("Couldn't remove that sign-in method.");
    return { ok: true };
  });
