import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/*
 * Sign up with email and password, with no email code (owner, 21 Sep 2026: a password or Google is
 * enough). The account is created already confirmed, and the screen then signs in with the same
 * password, so the session is kept on this device like any other sign-in.
 */

export type SignUpResult = { status: "created" } | { status: "exists" };

export const signUpWithPassword = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(254),
        password: z.string().min(8).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<SignUpResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("already") || m.includes("exists")) return { status: "exists" };
      throw new Error(error.message);
    }
    return { status: "created" };
  });
