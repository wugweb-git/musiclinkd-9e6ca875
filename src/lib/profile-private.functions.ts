import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Date of birth and gender live in public.profile_private (owner-only RLS), never on the public
 * profiles row or its onboarding draft. Hidden by default: nothing shows them to anyone else.
 */

export const GENDERS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export type PrivateDetails = { dateOfBirth: string | null; gender: string | null };

type Row = { date_of_birth: string | null; gender: string | null };

// The generated types predate this table.
const table = (client: unknown) =>
  (client as SupabaseClient).from("profile_private" as never) as unknown as ReturnType<
    SupabaseClient["from"]
  >;

export const getMyPrivateDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PrivateDetails> => {
    const { data, error } = await table(context.supabase)
      .select("date_of_birth, gender")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const row = data as Row | null;
    return { dateOfBirth: row?.date_of_birth ?? null, gender: row?.gender ?? null };
  });

export const saveMyPrivateDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        dateOfBirth: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable(),
        gender: z.enum(["woman", "man", "non_binary", "prefer_not_to_say"]).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await table(context.supabase).upsert({
      id: context.userId,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      updated_at: new Date().toISOString(),
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
